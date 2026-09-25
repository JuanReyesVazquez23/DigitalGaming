// Layer: ts/data/auth-fetch — fetch con JWT que rota la sesión solo ante 401.
// Si el access venció, usa el refresh una vez y reintenta; si falla, NO_AUTH.
import type { Session } from "../domain/auth.js";
import { api } from "../services/api-config.js";
import { clearSession, getSession, saveSession } from "../services/session-store.js";

async function tryRefresh(): Promise<boolean> {
  const s = getSession();
  if (!s?.refreshToken) return false;
  try {
    const res = await fetch(api("/api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: s.refreshToken }),
    });
    if (!res.ok) {
      clearSession();
      return false;
    }
    const data = await res.json();
    const next: Session = {
      accessToken: String(data.accessToken ?? data.AccessToken ?? data.token ?? ""),
      refreshToken: String(data.refreshToken ?? data.RefreshToken ?? ""),
      username: String(data.username ?? data.Username ?? s.username),
      expiresAtUtc: String(data.expiresAtUtc ?? data.ExpiresAtUtc ?? ""),
    };
    if (!next.accessToken || !next.refreshToken) {
      clearSession();
      return false;
    }
    saveSession(next);
    return true;
  } catch {
    return false;
  }
}

export async function authFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const s = getSession();
  if (!s) throw new Error("NO_AUTH");
  const res = await fetch(path, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${s.accessToken}` },
  });
  if (res.status === 401 && !retried && (await tryRefresh())) {
    return authFetch(path, init, true);
  }
  if (res.status === 401) throw new Error("NO_AUTH");
  return res;
}
