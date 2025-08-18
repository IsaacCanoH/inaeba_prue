import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";
import { saveSecureData } from "../security/saveDataService";

const API_URL = "https://backend-pwa-b7qy.onrender.com/api/inicidencia";

export const createIncident = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/crear-incidencia`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    const contentType = response.headers.get("Content-Type");
    const isJSON = contentType?.includes("application/json");

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json()).error || "Error al crear la incidencia."
        : await response.text();

      throw new Error(errorText || "Error desconocido al crear la incidencia.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al crear la incidencia:", err.message);
    throw err;
  }
};

export const getIncidentsByUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/obtener-incidencia/${userId}`, {
      method: "GET",
      cache: "no-store",
    });

    const contentType = response.headers.get("Content-Type");
    const isJSON = contentType?.includes("application/json");

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json()).error || "Error al obtener las incidencias."
        : await response.text();

      throw new Error(errorText || "Error desconocido al obtener incidencias.");
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error("Error al obtener incidencias del usuario:", err.message);
    throw err;
  }
};

export const getEligibleIncidentDates = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/fechas-elegibles/${userId}`, {
      method: "GET",
      cache: "no-store",
    });

    const contentType = response.headers.get("Content-Type") || "";
    const isJSON = contentType.includes("application/json");

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json()).error || "Error al obtener fechas elegibles."
        : await response.text();
      throw new Error(errorText || "Error desconocido al obtener fechas elegibles.");
    }

    const raw = isJSON ? await response.json() : { data: [] };

    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.fechas)
      ? raw.fechas
      : [];
    const fechas = arr
      .filter((d) => d && typeof d.fecha === "string")
      .map((d) => ({
        fecha: d.fecha,
        estado_final: d.estado_final || d.estado || null,
      }));

    await saveEligibleIncidentDatesOffline(userId, fechas);

    return fechas;
  } catch (err) {
    console.error("Error al obtener fechas elegibles:", err.message);
    throw err;
  }
};

export const getTypeIncident = async (isOffline) => {
  try {
    if (isOffline) {
      return await getIncidentTypesOffline();
    }

    const response = await fetch(`${API_URL}/tipo-incidencia`, {
      method: "GET",
      cache: "no-store",
    });

    const contentType = response.headers.get("Content-Type");
    const isJSON = contentType?.includes("application/json");

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json()).error || "Error al obtener los tipos de incidencia."
        : await response.text();

      throw new Error(errorText || "Error desconocido al obtener tipos de incidencia.");
    }

    const result = await response.json();
    const tipos = result?.data?.map((item) => item.tipo) || [];

    await saveIncidentTypesOffline(tipos);

    return tipos;
  } catch (err) {
    console.error("Error al obtener tipos de incidencia:", err.message);
    return [];
  }
};

export const createIncidentOffline = async (incident) => {
  try {
    const timestamp = Date.now();
    await saveSecureData(`incidencia-pendiente-${timestamp}`, incident);
  } catch (err) {
    console.error("Error al guardar incidencia offline:", err.message);
    throw err;
  }
};

export const saveIncidentsOffline = async (incidents) => {
  try {
    await db.incidencias.clear();

    const encrypted = incidents.map((i) => ({
      usuario_id: i.usuario_id,
      fecha_incidencia: i.fecha_incidencia,
      data_cifrada: encryptData(i),
    }));

    await db.incidencias.bulkAdd(encrypted);
  } catch (err) {
    console.error("Error al guardar incidencias offline:", err.message);
  }
};

export const getIncidentsOffline = async (userId) => {
  try {
    const records = await db.incidencias
      .where("usuario_id")
      .equals(userId)
      .toArray();

    return records
      .map((r) => decryptData(r.data_cifrada))
      .filter(Boolean);
  } catch (err) {
    console.error("Error al obtener incidencias offline:", err.message);
    return [];
  }
};

export const saveIncidentTypesOffline = async (tipos) => {
  try {
    await db.catalogo_tipos_incidencia.clear();

    const encrypted = tipos.map((tipo) => ({
      data_cifrada: encryptData(tipo),
    }));

    await db.catalogo_tipos_incidencia.bulkAdd(encrypted);
  } catch (err) {
    console.error("Error al guardar tipos de incidencia offline:", err.message);
  }
};

export const getIncidentTypesOffline = async () => {
  try {
    const records = await db.catalogo_tipos_incidencia.toArray();

    return records
      .map((r) => decryptData(r.data_cifrada))
      .filter(Boolean);
  } catch (err) {
    console.error("Error al obtener tipos de incidencia offline:", err.message);
    return [];
  }
};

export const saveEligibleIncidentDatesOffline = async (userId, fechas = []) => {
  try {
    await db.fechas_elegibles_incidencia
      .where("usuario_id")
      .equals(userId)
      .delete();

    if (!Array.isArray(fechas) || fechas.length === 0) return;

    const rows = fechas.map((f) => ({
      usuario_id: userId,
      fecha: f.fecha,
      data_cifrada: encryptData(f),
    }));

    await db.fechas_elegibles_incidencia.bulkAdd(rows);
  } catch (err) {
    console.error("Error al guardar fechas elegibles offline:", err);
  }
};

export const getEligibleIncidentDatesOffline = async (userId) => {
  try {
    const rows = await db.fechas_elegibles_incidencia
      .where("usuario_id")
      .equals(userId)
      .toArray();

    return rows
      .map((r) => decryptData(r.data_cifrada))
      .filter(Boolean)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  } catch (err) {
    console.error("Error al obtener fechas elegibles offline:", err);
    return [];
  }
};

export const removeEligibleDateOffline = async (userId, fecha) => {
  try {
    await db.fechas_elegibles_incidencia
      .where({ usuario_id: userId, fecha })
      .delete();
  } catch (err) {
    console.error("Error al eliminar fecha elegible offline:", err.message);
  }
};