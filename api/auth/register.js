// POST /api/auth/register — crea cuenta (nombre + contraseña) y devuelve sesión (access + refresh)
import { getPool } from "../_db.js";
import { hashPassword, newRefreshToken, refreshExpiresAt, send, signToken } from "../_auth.js";
import { authRateLimit } from "../_ratelimit.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
  if (!authRateLimit(req)) return send(res, 429, { message: "Demasiados intentos. Espera un minuto." });
  const pool = getPool();
  const dto = req.body || {};
  const username = String(dto.username ?? dto.Username ?? "").trim();
  if (username.length < 3) return send(res, 400, { message: "El nombre debe tener al menos 3 caracteres." });
  const password = String(dto.password ?? dto.Password ?? "");
  if (password.length < 6) return send(res, 400, { message: "La contraseña debe tener al menos 6 caracteres." });

  const exists = await pool.query(`SELECT 1 FROM "Users" WHERE lower("Username")=lower($1)`, [username]);
  if (exists.rowCount > 0) return send(res, 409, { message: "El nombre de usuario ya está en uso." });

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "Users"("Id","Username","PasswordHash","Role","CreatedAtUtc") VALUES ($1,$2,$3,'cliente',now())`,
    [id, username, hashPassword(password)]
  );
  const s = signToken({ id, username, role: "cliente" });
  const r = newRefreshToken();
  await pool.query(
    `INSERT INTO "RefreshTokens"("Id","UserId","TokenHash","CreatedAtUtc","ExpiresAtUtc","RevokedAtUtc")
     VALUES (gen_random_uuid(),$1,$2,now(),$3,NULL)`,
    [id, r.hash, refreshExpiresAt()]
  );
  return send(res, 201, { accessToken: s.token, refreshToken: r.opaque, username, expiresAtUtc: s.expiresAtUtc });
}
