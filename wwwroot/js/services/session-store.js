// Compilado desde ts/services/session-store.ts
const KEY = "dm_auth_v1";
export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.token || !s.username) return null;
    if (s.expiresAtUtc && new Date(s.expiresAtUtc).getTime() < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch { return null; }
}
export function saveSession(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
export function clearSession() { localStorage.removeItem(KEY); }
export function authHeader() {
  const s = getSession();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}
