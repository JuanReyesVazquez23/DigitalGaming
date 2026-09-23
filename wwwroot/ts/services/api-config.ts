// Layer: ts/services/api-config — base del API.
// Local: mismo origen (""). Vercel: window.DM_API_URL generada en build desde API_URL.
export function apiBase(): string {
  try {
    if (typeof window === "undefined") return "";
    const w = window as unknown as { DM_API_URL?: unknown };
    const raw = typeof w.DM_API_URL === "string" ? w.DM_API_URL.trim() : "";
    return raw.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

/**
 * Une la base con una ruta /api/....
 * @param path La ruta del API (ej. "/api/products").
 * @returns La URL absoluta en Vercel o la misma ruta en local.
 */
export function api(path: string): string {
  const b = apiBase();
  return b === "" ? path : `${b}${path}`;
}
