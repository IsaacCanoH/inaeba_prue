import { db } from "../../db/indexedDB";
import { decryptData } from "../../utils/cryptoUtils";
import { deleteSecureData } from "../security/saveDataService";
import { createIncident } from "../dashboard/incidentsService";
import { dataURLtoBlob } from "../../utils/fileUtils";
import { createNotifications } from "../dashboard/notificationsService";
import { createAttendance } from "../dashboard/attendancesService";

const SYNC_HANDLERS = {
  "incidencia-pendiente": async (record, createNotification) => {
    const incident = decryptData(record.data);

    const formData = new FormData();
    formData.append("usuario_id", incident.usuario_id);
    formData.append("tipo_incidencia", incident.tipo_incidencia);
    formData.append("descripcion", incident.descripcion);
    formData.append("fecha_incidencia", incident.fecha_incidencia);

    incident.evidencias.forEach(evidence => {
      const blob = dataURLtoBlob(evidence.content);
      const file = new File([blob], evidence.name, { type: evidence.type });
      formData.append("archivos", file);
    });

    await createIncident(formData);

    if (typeof createNotification === "function") {
      await createNotification({
        usuario_id: incident.usuario_id,
        titulo: "Incidencia sincronizada",
        mensaje: "Tu incidencia fue enviada correctamente.",
        tipo: "exito",
        leida: false,
        vista: false,
        fecha_creacion: new Date().toISOString(),
        metadata: {
          descripcion: incident.descripcion,
          fecha: incident.fecha_incidencia,
        },
      });
    }
  },

  "notificacion-pendiente": async (record) => {
    const notification = decryptData(record.data);
    const syncedNotification = {
      ...notification,
      leida: true,
      vista: true,
    };
    await createNotifications(syncedNotification);
  },

  "asistencia-pendiente": async (record, createNotification) => {
    const asistencia = decryptData(record.data);

    const formData = new FormData();
    formData.append("usuario_id", asistencia.usuario_id);
    formData.append("tipo", asistencia.tipo);
    formData.append("metodo", asistencia.metodo);
    formData.append("condicion", asistencia.condicion);
    formData.append("fecha_hora_registro", asistencia.fecha_hora_registro);
    formData.append("ubicacion_lat", asistencia.ubicacion_lat);
    formData.append("ubicacion_lon", asistencia.ubicacion_lon)

    await createAttendance(formData);

    if (typeof createNotification === "function") {
      const tipoTexto = asistencia.tipo === "entrada" ? "Entrada" : asistencia.tipo === "salida" ? "Salida" : "Asistencia";

      await createNotification({
        usuario_id: asistencia.usuario_id,
        titulo: `Asistencia sincronizada: ${tipoTexto}`,
        mensaje: `Tu ${tipoTexto.toLowerCase()} fue registrada exitosamente.`,
        tipo: "exito",
        leida: false,
        vista: false,
        fecha_creacion: new Date().toISOString(),
        metadata: {
          tipo: asistencia.tipo,
          condicion: asistencia.condicion,
          fecha: asistencia.fecha_hora_registro,
        },
      });
    }
  },
};

export const syncPendingData = async (currentUserId, createNotification) => {
  try {
    const pending = await db.encryptedData.toArray();
    let synced = 0;

    for (const record of pending) {
      const decrypted = decryptData(record.data);

      if (decrypted.usuario_id !== currentUserId) continue;

      const baseType = record.type.split("-").slice(0, 2).join("-");
      const handler = SYNC_HANDLERS[baseType];

      if (!handler) {
        console.warn(`No existe handler para el tipo: ${baseType}`);
        continue;
      }

      try {
        await handler(record, createNotification);
        await deleteSecureData(record.id);
        synced++;
        console.log(`Sincronizado correctamente: ${record.type}`);
      } catch (err) {
        console.error(`Error al sincronizar ${record.type}:`, err.message);
      }
    }

    return synced;

  } catch (err) {
    console.error("Error en la sincronización general:", err);
    throw err;
  }
};
