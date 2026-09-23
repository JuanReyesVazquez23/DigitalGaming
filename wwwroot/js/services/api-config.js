// Compilado desde ts/services/api-config.ts
export function apiBase() {
  try {
    if (typeof window === "undefined") return "";
    const raw = typeof window.DM_API_URL === "string" ? window.DM_API_URL.trim() : "";
    return raw.replace(/\/+$/, "");
  } catch { return ""; }
}
export function api(path) {
  const b = apiBase();
  return b === "" ? path : `${b}${path}`;
}
