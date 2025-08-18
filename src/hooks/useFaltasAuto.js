import { useEffect, useRef } from "react";
import {
  createAttendance,
  getAttendancesByUser,
  getAttendancesOffline,
  getPendingAttendancesByUser,
  createAttendanceOffline,
} from "../services/dashboard/attendancesService";
import { isWeekday, isWithinAllowedTimeRange } from "../utils/attendanceValidatorUtils";

const getWeekdaysBetween = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWeekday(current)) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const useFaltasAuto = (usuario, isOffline, fetchAttendances) => {
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (!usuario || hasExecuted.current) return;
    hasExecuted.current = true;

    const checkAndRegisterFaltas = async () => {
      try {
        const empleado_id = usuario.user.empleado_id;

        const allRecords = isOffline
          ? await getAttendancesOffline(empleado_id)
          : await getAttendancesByUser(empleado_id);

        if (!allRecords.length) return;

        const sorted = allRecords.sort(
          (a, b) => new Date(a.fecha_hora_registro) - new Date(b.fecha_hora_registro)
        );

        const primerRegistro = new Date(sorted[0].fecha_hora_registro);
        const hoy = new Date();
        const hoyStr = hoy.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const fechasRegistradas = new Set(
          sorted.map((r) =>
            new Date(r.fecha_hora_registro).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              timeZone: "America/Mexico_City",
            })
          )
        );

        const pendientes = await getPendingAttendancesByUser(empleado_id, hoyStr);
        pendientes.forEach((r) => {
          const fecha = new Date(r.fecha_hora_registro).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "America/Mexico_City",
          });
          fechasRegistradas.add(fecha);
        });

        const weekdays = getWeekdaysBetween(primerRegistro, hoy);
        const registrosFaltas = [];

        for (const dia of weekdays) {
          const diaStr = dia.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "America/Mexico_City",
          });

          const isToday = diaStr === hoyStr;
          const allowToday = isToday && isWithinAllowedTimeRange(hoy);

          const registrosDia = sorted.filter((r) => {
            const rFecha = new Date(r.fecha_hora_registro).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              timeZone: "America/Mexico_City",
            });
            return rFecha === diaStr;
          });

          // Caso 1: ya tiene 2 registros → nada que hacer
          if (registrosDia.length >= 2) continue;

          // Caso 2: solo tiene 1 → completar con el tipo faltante
          if (registrosDia.length === 1) {
            if (isToday && allowToday) continue;

            const existente = registrosDia[0].tipo;
            const faltante = existente === "entrada" ? "salida" : "entrada";

            const fechaISO = new Date(
              Date.UTC(dia.getFullYear(), dia.getMonth(), dia.getDate(), 6, 0, 0)
            ).toISOString();

            const asistencia = {
              usuario_id: empleado_id,
              tipo: faltante,
              metodo: "no-aplica",
              condicion: "falta",
              fecha_hora_registro: fechaISO,
              ubicacion_lat: 0,
              ubicacion_lon: 0,
            };

            registrosFaltas.push(asistencia);
            continue;
          }

          // Caso 3: sin registros → crear entrada y salida como falta
          if (!fechasRegistradas.has(diaStr)) {
            if (isToday && allowToday) continue;

            const fechaISO = new Date(
              Date.UTC(dia.getFullYear(), dia.getMonth(), dia.getDate(), 6, 0, 0)
            ).toISOString();

            ["entrada", "salida"].forEach((tipo) => {
              const asistencia = {
                usuario_id: empleado_id,
                tipo,
                metodo: "no-aplica",
                condicion: "falta",
                fecha_hora_registro: fechaISO,
                ubicacion_lat: 0,
                ubicacion_lon: 0,
              };
              registrosFaltas.push(asistencia);
            });
          }
        }

        if (!registrosFaltas.length) return;

        if (isOffline) {
          for (const falta of registrosFaltas) {
            await createAttendanceOffline(falta);
          }
        } else {
          for (const falta of registrosFaltas) {
            const formData = new FormData();
            formData.append("usuario_id", falta.usuario_id);
            formData.append("tipo", falta.tipo);
            formData.append("metodo", falta.metodo);
            formData.append("condicion", falta.condicion);
            formData.append("fecha_hora_registro", falta.fecha_hora_registro);
            formData.append("ubicacion_lat", "0");
            formData.append("ubicacion_lon", "0");
            await createAttendance(formData);
          }

          await fetchAttendances();
        }
      } catch (err) {
        console.error("Error registrando faltas automáticas:", err.message);
      }
    };

    checkAndRegisterFaltas();
  }, [usuario, isOffline, fetchAttendances]);
};
