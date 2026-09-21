// Layer: ts/data/auth-repository — registro y login contra /api/auth (devuelve JWT).
import type { Session } from "../domain/auth.js";

const API = "/api/auth";

async function parseSession(res: Response): Promise<Session> {
  const data = await res.json();
  return {
    token: String(data.token ?? data.Token ?? ""),
    username: String(data.username ?? data.Username ?? ""),
    expiresAtUtc: String(data.expiresAtUtc ?? data.ExpiresAtUtc ?? ""),
  };
}

async function failMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    const m = data.message ?? data.title;
    return typeof m === "string" && m !== "" ? m : fallback;
  } catch {
    return fallback;
  }
}

export async function register(username: string, password: string): Promise<Session> {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 409) throw new Error("Ese nombre ya está en uso. Prueba con otro.");
  if (!res.ok) throw new Error(await failMessage(res, "No se pudo crear la cuenta."));
  return parseSession(res);
}

export async function login(username: string, password: string): Promise<Session> {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (res.status === 401) throw new Error("Nombre o contraseña incorrectos.");
  if (!res.ok) throw new Error(await failMessage(res, "No se pudo entrar."));
  return parseSession(res);
}
