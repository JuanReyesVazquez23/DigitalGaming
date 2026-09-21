// Layer: ts/services/session-store — guarda la sesión JWT en localStorage.
import type { Session } from "../domain/auth.js";

const KEY = "dm_auth_v1";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.token || !s.username) return null;
    // Why: si el JWT expiró, se limpia para obligar a entrar de nuevo.
    if (s.expiresAtUtc && new Date(s.expiresAtUtc).getTime() < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: Session): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}

/** Cabecera Authorization si hay sesión, o vacío si es visita pública. */
export function authHeader(): Record<string, string> {
  const s = getSession();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}
