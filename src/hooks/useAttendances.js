import { useState, useEffect, useRef } from "react";
import {
  getAttendancesByUser,
  saveAttendancesOffline,
  getAttendancesOffline,
} from "../services/dashboard/attendancesService";

export const useAttendances = (usuario, isOffline) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const employeeId = usuario.user.empleado_id;
      const data = await fetchAttendanceData(employeeId, isOffline);
      const history = processAttendanceHistory(data);
      const stats = calculateAttendanceStats(history);

      setAttendanceHistory(history);
      setStatistics(stats);
    } catch (err) {
      console.error("Error al cargar asistencias:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!usuario || hasFetched.current) return;
    hasFetched.current = true;
    fetchAttendances();
  }, [usuario, isOffline]);

  useEffect(() => {
    const onSynced = (e) => {
      fetchAttendances();
    };
    window.addEventListener("app:sync-finished", onSynced);
    return () => window.removeEventListener("app:sync-finished", onSynced);
  }, [usuario?.user?.empleado_id, isOffline]); 

  return {
    attendanceHistory,
    statistics,
    fetchAttendances,
    loading
  };
};

const fetchAttendanceData = async (employeeId, isOffline) => {
  const data = isOffline
    ? await getAttendancesOffline(employeeId)
    : await getAttendancesByUser(employeeId);

  if (!isOffline) {
    await saveAttendancesOffline(data);
  }

  return data;
};

const processAttendanceHistory = (attendances) => {
  const grouped = {};

  attendances.forEach((record) => {
    const date = new Date(record.fecha_hora_registro);

    const day = date.toLocaleDateString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const time = date.toLocaleTimeString("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    if (!grouped[day]) {
      grouped[day] = {
        entrada: "",
        salida: "",
        horas: "00:00",
        estado: "",
        condicion_salida: "",
        estado_final: "",
        fecha: day,
      };
    }

    const current = grouped[day];

    if (record.tipo === "entrada" && (!current.entrada || date < new Date(`${day} ${current.entrada}`))) {
      current.entrada = time;
      current.estado = record.condicion;
    }

    if (record.tipo === "salida" && (!current.salida || date > new Date(`${day} ${current.salida}`))) {
      current.salida = time;
      current.condicion_salida = record.condicion;
    }
  });

  const registros = calculateWorkedHours(Object.values(grouped));

  registros.forEach((item) => {
    const entrada = item.estado;
    const salida = item.condicion_salida;

    if (entrada === "puntual" && salida === "puntual") {
      item.estado_final = "puntual";
    }
    else if (entrada === "puntual" && salida === "incompleta") {
      item.estado_final = "incompleta";
    }
    else if (entrada === "puntual" && salida === "falta") {
      item.estado_final = "incompleta";
    }
    else if (entrada === "retardo" && salida === "puntual") {
      item.estado_final = "retardo";
    }
    else if (entrada === "retardo" && salida === "incompleta") {
      item.estado_final = "incompleta";
    }
    else if (entrada === "retardo" && salida === "falta") {
      item.estado_final = "incompleta";
    }
    else if (entrada === "falta" && salida === "falta") {
      item.estado_final = "falta";
    }
    else {
      item.estado_final = entrada || "falta";
    }
  });

  return registros;
};

const calculateWorkedHours = (data) =>
  data.map((item) => {
    if (item.entrada && item.salida) {
      const [h1, m1] = item.entrada.split(":").map(Number);
      const [h2, m2] = item.salida.split(":").map(Number);

      const entrada = new Date(0, 0, 0, h1, m1);
      const salida = new Date(0, 0, 0, h2, m2);
      const diff = salida - entrada;

      const hours = diff > 0 ? Math.floor(diff / 3600000) : 0;
      const minutes = diff > 0 ? Math.floor((diff % 3600000) / 60000) : 0;

      item.horas = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }

    return item;
  });

const calculateAttendanceStats = (history) => {
  const total = history.length;

  const asistencias = history.filter((h) => h.estado_final === "puntual").length;
  const retardos = history.filter((h) => h.estado_final === "retardo").length;
  const faltas = history.filter((h) => h.estado_final === "falta").length;
  const incompletas = history.filter((h) => h.estado_final === "incompleta").length;

  const porcentaje = total > 0 ? Math.round((asistencias / total) * 100) : 0;

  return {
    asistencias,
    retardos,
    faltas,
    incompletas,
    porcentaje,
  };
};

