import { useState, useRef, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { useGeolocation } from "./useGeolocation";
import { useLoader } from "../context/LoaderContext";
import { useNotifications } from "../context/NotificationContext";
import { MD5 } from "crypto-js";
import { getDistanceInMeters } from "../utils/geoUtils";
import {
  isWeekday,
  isWithinAllowedTimeRange,
  getPunctualityStatus,
  getSalidaStatus,
} from "../utils/attendanceValidatorUtils";
import {
  createAttendance,
  createAttendanceOffline,
  getPendingAttendancesByUser,
  getAttendancesByUser,
} from "../services/dashboard/attendancesService";

export const usePinAttendance = (usuario, attendanceHistory = [], fetchAttendances) => {
  const { showError, showSuccess, showInfo } = useToast();
  const { getCoordinates } = useGeolocation();
  const { showLoader, hideLoader } = useLoader();
  const { createNotification } = useNotifications();

  const [showPINModal, setShowPINModal] = useState(false);
  const inputsRef = Array.from({ length: 4 }, () => useRef(null));
  const lastCoordsRef = useRef(null);

  const handleChange = useCallback((index, e) => {
    const value = e.target.value.replace(/\D/g, "");
    e.target.value = value;
    if (value.length === 1 && index < inputsRef.length - 1) {
      inputsRef[index + 1].current?.focus();
    }
  }, [inputsRef]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef[index - 1].current?.focus();
    }
  }, [inputsRef]);

  const getTodayAttendanceStatus = useCallback(async () => {
    const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

    const offline = await getPendingAttendancesByUser(usuario?.user?.empleado_id, today);
    const entradaOffline = offline.find(a => a.tipo === "entrada");
    const salidaOffline = offline.find(a => a.tipo === "salida");

    const todayRecord = attendanceHistory.find(a => a.fecha === today) || {};

    return {
      entrada: Boolean(todayRecord.entrada || entradaOffline),
      salida: Boolean(todayRecord.salida || salidaOffline),
    };
  }, [usuario, attendanceHistory]);

  const validatePinMonthlyLimit = useCallback(async () => {
    const registros = await getAttendancesByUser(usuario?.user?.empleado_id);
    const registrosPin = registros.filter(r => r.metodo === "pin");

    const diasAgrupados = {};
    registrosPin.forEach(r => {
      const fecha = new Date(r.fecha_hora_registro).toISOString().split("T")[0];
      if (!diasAgrupados[fecha]) diasAgrupados[fecha] = [];
      diasAgrupados[fecha].push(r);
    });

    const diasCompletos = Object.values(diasAgrupados).filter(regs => regs.length >= 2).length;
    return diasCompletos < 2;
  }, [usuario]);

  const registerAttendance = useCallback(async (status, coords) => {
    try {
      showLoader("Registrando asistencia...");

      const now = new Date();
      const tipo = status.entrada ? "salida" : "entrada";
      const metodo = "pin";
      const schedule = usuario?.schedule;
      const condicion = tipo === "entrada"
        ? getPunctualityStatus(now, schedule)
        : getSalidaStatus(now, schedule);

      const { latitude, longitude } = coords;

      const formData = new FormData();
      formData.append("usuario_id", usuario?.user?.empleado_id);
      formData.append("tipo", tipo);
      formData.append("metodo", metodo);
      formData.append("condicion", condicion);
      formData.append("fecha_hora_registro", new Date().toISOString());
      formData.append("ubicacion_lat", latitude.toString());
      formData.append("ubicacion_lon", longitude.toString());

      try {
        const result = await createAttendance(formData);
        if (!result || result.status !== "success") throw new Error();

        const capitalized = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        await createNotification({
          usuario_id: usuario?.user?.empleado_id,
          titulo: "Asistencia Registrada",
          mensaje: `${capitalized} del día registrada correctamente`,
          tipo: "exito",
          leida: false,
          vista: false,
          metadata: {
            tipo_asistencia: tipo,
            condicion,
            fecha_hora: new Date().toISOString(),
            ubicacion: { lat: latitude, lon: longitude },
            sede: usuario?.work_info?.office_name,
            horario: usuario?.schedule || null,
          },
        });

        showSuccess(`${capitalized} registrada correctamente.`);
        if (typeof fetchAttendances === "function") await fetchAttendances();

      } catch {
        console.warn("Error enviando asistencia. Guardando offline...");
        const offlineData = {
          usuario_id: usuario?.user?.empleado_id,
          tipo,
          metodo,
          condicion,
          fecha_hora_registro: new Date().toISOString(),
          ubicacion_lat: latitude.toString(),
          ubicacion_lon: longitude.toString(),
        };

        await createAttendanceOffline(offlineData);
        const capitalized = tipo.charAt(0).toUpperCase() + tipo.slice(1);

        await createNotification({
          usuario_id: usuario?.user?.empleado_id,
          titulo: "Asistencia creada",
          mensaje: `Asistencia ${capitalized} creada correctamente, se registrará cuando haya conexión.`,
          tipo: "alerta",
          leida: false,
          vista: false,
          fecha_creacion: new Date().toISOString(),
          metadata: {
            tipo_asistencia: tipo,
            condicion,
            fecha_hora: new Date().toISOString(),
            ubicacion: { lat: latitude, lon: longitude },
            sede: usuario?.work_info?.office_name,
            horario: usuario?.schedule || null,
          },
        });

        showSuccess(`${capitalized} almacenada. Se sincronizará cuando haya conexión.`);
      }
    } finally {
      hideLoader();
    }
  }, [usuario, showLoader, hideLoader, showSuccess, createNotification, fetchAttendances]);

  const handleSubmitPIN = useCallback(async () => {
    const pin = inputsRef.map(ref => ref.current?.value || "").join("");

    if (pin.length !== 4) return showError("Debes ingresar los 4 dígitos");

    const hashedPIN = MD5(pin).toString().toLowerCase();
    const storedPINHash = (usuario?.work_info?.pin || "").toLowerCase();
    if (!storedPINHash) return showError("No hay PIN configurado para este usuario");
    if (hashedPIN !== storedPINHash) return showError("PIN incorrecto");

    if (!(await validatePinMonthlyLimit())) {
      return showInfo("Has alcanzado el límite de 2 asistencias con PIN este mes.");
    }

    if (!isWeekday()) return showError("Solo puedes registrar asistencias de lunes a viernes.");
    if (!isWithinAllowedTimeRange()) return showError("Fuera del horario permitido");

    const status = await getTodayAttendanceStatus();
    if (status.entrada && status.salida) {
      return showError("Ya registraste entrada y salida hoy.");
    }

    try {
      const { lat, lng } = usuario?.work_info || {};
      if (!lat || !lng) return showError("No se pudo obtener la ubicación esperada.");

      showLoader("Obteniendo ubicación precisa...");
      let currentCoords = lastCoordsRef.current;
      const now = Date.now();
      if (!currentCoords || now - currentCoords.timestamp > 60000) {
        const coords = await getCoordinates();
        currentCoords = { ...coords, timestamp: now };
        lastCoordsRef.current = currentCoords;
      }

      const distance = getDistanceInMeters(parseFloat(lat), parseFloat(lng), currentCoords.latitude, currentCoords.longitude);
      hideLoader();
      if (distance > 100) return showError("Estás fuera del rango de la ubicación esperada.");

      await registerAttendance(status, currentCoords);
      setShowPINModal(false);

    } catch (err) {
      console.error("Error en registro por PIN:", err.message);
      showError("No se pudo registrar la asistencia.");
      hideLoader();
    }
  }, [usuario, inputsRef, getCoordinates, registerAttendance, validatePinMonthlyLimit, getTodayAttendanceStatus, showError, showInfo, showLoader, hideLoader]);

  return {
    showPINModal,
    setShowPINModal,
    inputsRef,
    handleChange,
    handleKeyDown,
    handleSubmitPIN,
  };
};
