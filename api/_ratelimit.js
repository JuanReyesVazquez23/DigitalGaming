// Capa compartida: rate limiting best-effort por instancia (ventana fija por IP).
// Nota: en serverless cada instancia lleva su contador; frena abuso casual,
// no un ataque distribuido (eso requiere Redis/Upstash o firewall).
const buckets = new Map();

function ipOf(req) {
  const fwd = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || "unknown";
}

/**
 * @param keyScope ámbito (ej. "auth:login")
 * @param limit peticiones por ventana
 * @param windowMs ventana en ms
 * @returns true si se permite, false si excede (llamar send 429).
 */
export function takeToken(req, keyScope, limit, windowMs) {
  const key = `${keyScope}:${ipOf(req)}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset <= now) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  return b.count <= limit;
}

export function authRateLimit(req) {
  // 20 req/min por IP en rutas de auth (register/login/refresh).
  return takeToken(req, "auth", 20, 60_000);
}
