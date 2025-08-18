import { db } from "../../db/indexedDB";
import { encryptData, decryptData } from "../../utils/cryptoUtils";

const API_URL = "https://backend-pwa-b7qy.onrender.com/api/auth";

export const login = async (username, password) => {
  try {
    const userInfo = await loginOnline(username, password);
    await persistSession(username, password, userInfo);
    return { success: true, user: userInfo };
  } catch (err) {
    if (err?.code === "AUTH") {
      return { success: false, error: "Credenciales incorrectas" };
    }
    console.warn("Fallo online (red/servidor). Intentando login offline...", err?.message);
    return loginOffline(username, password);
  }
};

const loginOnline = async (username, password) => {
  let response;
  try {
    response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: username, clave_acceso: password }),
    });
  } catch (e) {
    const err = new Error("Fallo de red");
    err.code = "NETWORK";
    throw err;
  }

  let json = {};
  try {
    json = await response.json();
  } catch {
  }
  const data = Array.isArray(json) ? json[0] : json;

  if (response.status === 401 || response.status === 403) {
    const err = new Error(data?.error || "Credenciales inválidas (online)");
    err.code = "AUTH";
    throw err;
  }

  if (!response.ok) {
    const err = new Error(data?.error || "Fallo de red/servidor");
    err.code = "NETWORK";
    throw err;
  }

  if (data?.status !== "success" || !data?.data) {
    const err = new Error("Respuesta inválida de la API");
    err.code = "NETWORK";
    throw err;
  }

  return data.data;
};

const persistSession = async (username, password, userInfo) => {
  localStorage.setItem("usuario", JSON.stringify(userInfo));

  await db.usuarios.put({
    usuario: username,
    credentials: encryptData({ usuario: username, password }),
    data: encryptData(userInfo),
  });
};

const loginOffline = async (username, password) => {
  try {
    const stored =
      (await db.usuarios.get(username)) ||
      (await db.usuarios.where("usuario").equals(username).first());

    if (!stored) {
      return { success: false, error: "No hay datos locales para este usuario." };
    }

    const creds = decryptData(stored.credentials);
    const valid = creds?.usuario === username && creds?.password === password;

    if (!valid) {
      return { success: false, error: "Credenciales incorrectas (offline)" };
    }

    const localUser = { ...decryptData(stored.data), offline: true };
    localStorage.setItem("usuario", JSON.stringify(localUser));
    return { success: true, user: localUser };
  } catch (err) {
    console.error("Error en login offline:", err.message);
    return { success: false, error: "Fallo al intentar login offline." };
  }
};
