import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";

const API_URL = "https://backend-pwa-b7qy.onrender.com/api/fotosRostros";

export const saveFacePhoto = async ({ usuario_id, imagen_base64, descriptor }) => {
  try {
    const response = await fetch(`${API_URL}/guardar-foto-rostro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id, imagen_base64, descriptor }),
      cache: "no-store"
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al guardar la foto de rostro.");
    }

    return await response.json();
  } catch (err) {
    console.error("Error al guardar la foto de rostro:", err.message);
    throw err;
  }
};

export const getFacePhoto = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/obtener-foto-rostro/${userId}`, {
      method: "GET",
      cache: "no-store"
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al obtener la foto de rostro.");
    }

    const data = await response.json();
    await saveLocalFace(userId, data);

    return data;
  } catch (err) {
    console.error("Error al obtener la foto de rostro:", err.message);
    throw err;
  }
};

export const saveLocalFace = async (usuario_id, rostroData) => {
  try {
    const encrypted = encryptData(rostroData);

    await db.rostros.put({
      usuario_id,
      encrypted,
    });
  } catch (err) {
    console.error(`Error al guardar rostro localmente para usuario ${usuario_id}:`, err.message);
    throw err;
  }
};

export const getLocalFace = async (usuario_id) => {
  try {
    const entry = await db.rostros.get(usuario_id);
    return entry ? decryptData(entry.encrypted) : null;
  } catch (err) {
    console.error(`Error al obtener rostro localmente para usuario ${usuario_id}:`, err.message);
    return null;
  }
};
