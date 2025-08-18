import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";
import { saveSecureData } from "../security/saveDataService";

const API_URL = "https://backend-pwa-b7qy.onrender.com/api/asistencia";

export const createAttendance = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/registrar-asistencia`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    const contentType = response.headers.get("Content-Type");
    const isJSON = contentType?.includes("application/json");

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json()).error || "Error al crear la asistencia."
        : await response.text();

      throw new Error(errorText || "Error desconocido al crear la asistencia.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al crear la asistencia:", err.message);
    throw err;
  }
};

export const getAttendancesByUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/obtener-asistencia/${userId}`, {
      method: "GET",
      cache: "no-store",
    });
    const result = await response.json();

    if (response.ok && result.status === "success") {
      return result.data;
    }

    console.error("Error en respuesta:", result);
    return [];
  } catch (err) {
    console.error("Error al obtener asistencias online:", err.message);
    return [];
  }
};

export const saveAttendancesOffline = async (attendances) => {
  try {
    await db.asistencias.clear();

    const encrypted = attendances.map((a) => ({
      id: a.id,
      usuario_id: a.usuario_id,
      data_cifrada: encryptData(a),
    }));

    await db.asistencias.bulkAdd(encrypted);
  } catch (err) {
    console.error("Error al guardar asistencias offline:", err.message);
  }
};

export const getAttendancesOffline = async (userId) => {
  try {
    const records = await db.asistencias
      .where("usuario_id")
      .equals(userId)
      .toArray();

    return records
      .map((r) => decryptData(r.data_cifrada))
      .filter(Boolean);
  } catch (err) {
    console.error("Error al obtener asistencias offline:", err.message);
    return [];
  }
};

export const createAttendanceOffline = async (attendance) => {
  try {
    const timestamp = Date.now();
    await saveSecureData(`asistencia-pendiente-${timestamp}`, attendance);
  } catch (err) {
    console.error("Error al guardar asistencia offline:", err.message);
    throw err;
  }
};

export const getPendingAttendancesByUser = async (usuario_id, fechaStr) => {
  try {
    const records = await db.encryptedData
      .where("type")
      .startsWith("asistencia-pendiente-")
      .toArray();

    return records
      .map((r) => {
        const data = decryptData(r.data);
        if (data?.usuario_id !== usuario_id) return null;

        const fecha = new Date(data.fecha_hora_registro).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        return fecha === fechaStr ? data : null;
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Error al obtener asistencias pendientes:", err.message);
    return [];
  }
};
