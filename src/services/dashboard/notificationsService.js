import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";
import { saveSecureData } from "../security/saveDataService";

const API_URL = "http://localhost:3000/api/notificacion";

export const createNotifications = async (data) => {
  try {
    const response = await fetch(`${API_URL}/crear-notificacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store"
    });

    const contentType = response.headers.get("Content-Type");
    const isJSON = contentType?.includes("application/json");

    if (!response.ok) {
      const errorText = isJSON
        ? (await response.json())?.error || "Error al crear la notificación."
        : await response.text();

      throw new Error(errorText || "Error desconocido al crear la notificación.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al crear la notificación:", err.message);
    throw err;
  }
};

export const getNotificationsByUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/obtener-notificacion/${userId}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al obtener las notificaciones.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al obtener notificaciones:", err.message);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/leer/${notificationId}`, {
      method: "PATCH",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al marcar la notificación como leída.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al marcar notificación como leída:", err.message);
    throw err;
  }
};

export const markNotificationAsView = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/vista/${notificationId}`, {
      method: "PATCH",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al marcar la notificación como vista.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al marcar notificación como vista:", err.message);
    throw err;
  }
};

export const saveNotificationsOffline = async (notificaciones) => {
  try {
    await db.notificaciones.clear();

    const encrypted = notificaciones.map((n) => ({
      notificacion_id: n.notificacion_id,
      usuario_id: n.usuario_id,
      encrypted: encryptData(n),
    }));

    await db.notificaciones.bulkPut(encrypted);
  } catch (err) {
    console.error("Error al guardar notificaciones offline:", err.message);
  }
};

export const getNotificationsOfflineByUser = async (userId) => {
  try {
    const rows = await db.notificaciones
      .where("usuario_id")
      .equals(userId)
      .toArray();

    return rows.map((r) => decryptData(r.encrypted)).filter(Boolean);
  } catch (err) {
    console.error("Error al obtener notificaciones offline:", err.message);
    return [];
  }
};

export const createNotificationOffline = async (notification) => {
  try {
    const timestamp = Date.now();
    await saveSecureData(`notificacion-pendiente-${timestamp}`, notification);
  } catch (err) {
    console.error("Error al guardar notificación offline:", err.message);
    throw err;
  }
};

export const getPendingNotificationsOffline = async (userId) => {
  try {
    const rows = await db.encryptedData
      .where("type")
      .startsWith("notificacion-")
      .toArray();

    return rows
      .map((r) => {
        const decrypted = decryptData(r.data);
        if (decrypted?.usuario_id !== userId) return null;

        return {
          ...decrypted,
          notificacion_id: r.id,
          leida: false,
          fecha_creacion:
            decrypted.fecha_creacion || new Date(r.savedAt).toISOString(),
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Error al obtener notificaciones pendientes offline:", err.message);
    return [];
  }
};
