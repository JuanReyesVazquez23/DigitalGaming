// Compilado desde ts/data/auth-repository.ts
import { api } from "../services/api-config.js";
const API = api("/api/auth");
async function parseSession(res) {
  const data = await res.json();
  return {
    token: String(data.token ?? data.Token ?? ""),
    username: String(data.username ?? data.Username ?? ""),
    expiresAtUtc: String(data.expiresAtUtc ?? data.ExpiresAtUtc ?? ""),
  };
}
async function failMessage(res, fallback) {
  try {
    const data = await res.json();
    const m = data.message ?? data.title;
    return typeof m === "string" && m !== "" ? m : fallback;
  } catch { return fallback; }
}
export async function register(username, password) {
  const res = await fetch(`${API}/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 409) throw new Error("Ese nombre ya está en uso. Prueba con otro.");
  if (!res.ok) throw new Error(await failMessage(res, "No se pudo crear la cuenta."));
  return parseSession(res);
}
export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 401) throw new Error("Nombre o contraseña incorrectos.");
  if (!res.ok) throw new Error(await failMessage(res, "No se pudo entrar."));
  return parseSession(res);
}
