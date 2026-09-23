// Compilado desde ts/services/api-config.ts
export function apiBase() {
  try {
    if (typeof window === "undefined") return "";
    const raw = typeof window.DG_API_URL === "string" ? window.DG_API_URL.trim() : "";
    return raw.replace(/\/+$/, "");
  } catch { return ""; }
}
export function api(path) {
  const b = apiBase();
  return b === "" ? path : `${b}${path}`;
}
