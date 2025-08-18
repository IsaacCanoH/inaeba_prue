import { useState, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { useGeolocation } from "./useGeolocation";
import { useLoader } from "../context/LoaderContext";
import { useNotifications } from "../context/NotificationContext";
import {
  getDistanceInMeters
} from "../utils/geoUtils";
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
} from "../services/dashboard/attendancesService";

export const useQrAndFace = (usuario, attendanceHistory = [], fetchAttendances) => {
  const { showSuccess, showError } = useToast();
  const { getCoordinates } = useGeolocation();
  const { showLoader, hideLoader } = useLoader();
  const { createNotification } = useNotifications();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [qrDetectado, setQrDetectado] = useState(null);

  const handleOpenCamera = useCallback(() => {
    setCameraActive(true);
    setShowQRModal(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    setCameraActive(false);
    setShowQRModal(false);
  }, []);

  const getTodayAttendanceStatus = async () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const offline = await getPendingAttendancesByUser(
      usuario?.user?.empleado_id,
      todayStr
    );

    const entradaOffline = offline.find((a) => a.tipo === "entrada");
    const salidaOffline = offline.find((a) => a.tipo === "salida");

    const todayRecord = attendanceHistory.find((a) => a.fecha === todayStr) || {};

    return {
      entrada: Boolean(todayRecord.entrada || entradaOffline),
      salida: Boolean(todayRecord.salida || salidaOffline),
    };
  };

  const handleScanSuccess = useCallback(async (qrText) => {
    setShowQRModal(false);
    setCameraActive(false);

    if (!isWeekday()) {
      showError("Solo puedes registrar asistencias de lunes a viernes.");
      return;
    }

    if (!isWithinAllowedTimeRange()) {
      showError("Fuera del horario permitido");
      return;
    }

    const status = await getTodayAttendanceStatus();
    if (status.entrada && status.salida) {
      showError("Ya registraste entrada y salida hoy.");
      return;
    }

    try {
      const workInfo = usuario?.work_info;

      if (qrText !== workInfo?.block_key_qr) {
        showError("El código QR escaneado no es válido para esta sede.");
        return;
      }

      if (!workInfo?.lat || !workInfo?.lng) {
        showError("No se pudo obtener la ubicación esperada.");
        return;
      }

      showLoader("Obteniendo ubicación precisa...");

      const currentCoords = await getCoordinates();
      const distance = getDistanceInMeters(
        parseFloat(workInfo.lat),
        parseFloat(workInfo.lng),
        currentCoords.latitude,
        currentCoords.longitude
      );

      hideLoader();

      if (distance <= 100) {
        setQrDetectado(qrText);
        setShowFaceModal(true);
      } else {
        showError("Estás fuera del rango de la ubicación esperada.");
      }
    } catch (err) {
      console.error("Error obteniendo ubicación:", err.message);
      showError("No se pudo obtener la ubicación actual.");
    }
  }, [usuario, getCoordinates, showError]);

  const handleFaceSuccess = useCallback(async () => {
    setShowFaceModal(false);
    if (!qrDetectado) return;

    try {
      showLoader("Registrando asistencia...");

      const now = new Date();
      const status = await getTodayAttendanceStatus();
      const tipo = status.entrada ? "salida" : "entrada";
      const metodo = "qr_movil"

      const schedule = usuario?.schedule;
      const condicion = tipo === "entrada"
        ? getPunctualityStatus(now, schedule)
        : getSalidaStatus(now, schedule);

      const { latitude, longitude } = await getCoordinates();

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

        if (typeof fetchAttendances === "function") {
          await fetchAttendances();
        }
      } catch (err) {
        console.warn("Error enviando asistencia. Guardando offline:", err.message);

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
          mensaje: `Asistencia ${capitalized} creada correctamente, se registrará cuando exista conexión.`,
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

      setQrDetectado(null);
    } catch (err) {
      console.error("Error general registrando asistencia:", err.message);
      showError("No se pudo registrar la asistencia.");
    } finally {
      hideLoader();
    }
  }, [qrDetectado, getCoordinates, usuario, attendanceHistory, showSuccess, showError, hideLoader]);

  const handleFaceFailure = useCallback(() => {
    setShowFaceModal(false);
    setQrDetectado(null);
    showError("Falló la autenticación facial.");
  }, [showError]);

  return {
    showQRModal,
    showFaceModal,
    cameraActive,
    handleOpenCamera,
    handleCloseCamera,
    handleScanSuccess,
    handleFaceSuccess,
    handleFaceFailure,
    setShowQRModal,
  };
};
