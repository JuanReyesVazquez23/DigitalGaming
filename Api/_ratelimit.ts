// Capa compartida: rate limiting best-effort por instancia (ventana fija por IP).
// Nota: en serverless cada instancia lleva su contador; frena abuso casual,
// no un ataque distribuido (eso requiere Redis/Upstash o firewall).
import type { VercelReq } from "./_types.js";

const buckets = new Map<string, { count: number; reset: number }>();

function ipOf(req: VercelReq): string {
  const fwd = String(req.headers?.["x-forwarded-for"] ?? "").split(",")[0].trim();
  return fwd || "unknown";
}

/**
 * Consume un token del bucket.
 * @param req La petición entrante.
 * @param keyScope Ámbito (ej. "auth:login").
 * @param limit Peticiones por ventana.
 * @param windowMs Ventana en ms.
 * @returns True si se permite, false si excede (responder 429).
 */
export function takeToken(req: VercelReq, keyScope: string, limit: number, windowMs: number): boolean {
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

export function authRateLimit(req: VercelReq): boolean {
  // 20 req/min por IP en rutas de auth (register/login/refresh).
  return takeToken(req, "auth", 20, 60_000);
}
