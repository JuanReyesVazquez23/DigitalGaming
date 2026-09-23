// Capa compartida: hash PBKDF2 (mismo formato que el backend C#), JWT y helpers HTTP.
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ITERATIONS = 210_000;
export const CATEGORIES = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];

function jwtKey() {
  const k = process.env.JWT_KEY || "";
  if (k.length < 32) throw new Error("Falta JWT_KEY (mínimo 32 caracteres) en variables de entorno.");
  return k;
}

export function jwtOpts() {
  return {
    issuer: process.env.JWT_ISSUER || "DigitalGaming",
    audience: process.env.JWT_AUDIENCE || "DigitalGaming",
    expiresIn: "12h",
  };
}

/** Mismo formato que PasswordHasher.cs: pbkdf2-sha256$iter$salt$hash */
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.pbkdf2Sync(pw, salt, ITERATIONS, 32, "sha256");
  return `pbkdf2-sha256$${ITERATIONS}$${salt.toString("base64")}$${h.toString("base64")}`;
}

export function verifyPassword(pw, stored) {
  if (!pw || !stored) return false;
  const parts = String(stored).split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iter = Number(parts[1]);
  if (!Number.isInteger(iter)) return false;
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  const actual = crypto.pbkdf2Sync(pw, salt, iter, expected.length, "sha256");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** "Consolas" -> 0. Lanza 400 si no es válida. */
export function categoryToInt(c) {
  const i = CATEGORIES.indexOf(String(c));
  if (i === -1) {
    const e = new Error("Categoría inválida.");
    e.status = 400;
    throw e;
  }
  return i;
}

export function categoryToName(n) {
  return CATEGORIES[Number(n)] ?? String(n);
}

export function signToken(user) {
  const o = jwtOpts();
  const token = jwt.sign(
    { sub: user.id, unique_name: user.username, name: user.username, role: user.role },
    jwtKey(),
    { issuer: o.issuer, audience: o.audience, expiresIn: o.expiresIn, jwtid: crypto.randomUUID() }
  );
  const decoded = jwt.decode(token);
  return { token, expiresAtUtc: new Date(decoded.exp * 1000).toISOString() };
}

/** Usuario del Bearer o null (token ausente/inválido/vencido). */
export function getAuthUser(req) {
  const h = req.headers?.authorization || "";
  const m = /^Bearer (.+)$/.exec(h);
  if (!m) return null;
  try {
    const o = jwtOpts();
    const p = jwt.verify(m[1], jwtKey(), { issuer: o.issuer, audience: o.audience });
    if (!p.sub || !p.name) return null;
    return { id: String(p.sub), username: String(p.name), role: String(p.role || "cliente") };
  } catch {
    return null;
  }
}

export function send(res, status, obj) {
  res.status(status).json(obj);
}

/** Lee JSON del body (Vercel ya lo parsea; fallback manual). */
export async function readBody(req) {
  if (req.body !== undefined) return req.body || {};
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw === "" ? {} : JSON.parse(raw);
}
