import { db } from "../../db/indexedDB";
import { nanoid } from "nanoid";
import { encryptData, decryptData } from "../../utils/cryptoUtils";

export const saveSecureData = async (type, object) => {
  try {
    const id = `offline-${nanoid()}`;

    await db.encryptedData.add({
      id,
      type,
      data: encryptData(object),
      savedAt: new Date(),
    });
  } catch (err) {
    console.error("Error al guardar dato seguro:", err.message);
    throw err;
  }
};

export const getSecureData = async (type) => {
  try {
    const record = await db.encryptedData.where("type").equals(type).first();
    return record ? decryptData(record.data) : null;
  } catch (err) {
    console.error("Error al obtener dato seguro:", err.message);
    throw err;
  }
};

export const deleteSecureData = async (id) => {
  try {
    await db.encryptedData.delete(id);
  } catch (err) {
    console.error("Error al eliminar dato seguro:", err.message);
    throw err;
  }
};
