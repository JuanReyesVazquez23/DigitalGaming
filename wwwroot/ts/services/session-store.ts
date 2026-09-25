// Layer: ts/services/session-store — guarda la sesión en localStorage.
import type { Session } from "../domain/auth.js";

const KEY = "dg_auth_v2";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Session>;
    // Why v2: las sesiones viejas (solo `token`) se descartan y piden entrar de nuevo.
    if (!s.accessToken || !s.username) return null;
    return s as Session;
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
  return s ? { Authorization: `Bearer ${s.accessToken}` } : {};
}
