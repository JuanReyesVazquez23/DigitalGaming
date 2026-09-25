// POST /api/auth/login — valida nombre + contraseña y devuelve sesión (access + refresh)
import { getPool } from "../_db.js";
import { newRefreshToken, refreshExpiresAt, send, signToken, verifyPassword } from "../_auth.js";
import { authRateLimit } from "../_ratelimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
  if (!authRateLimit(req)) return send(res, 429, { message: "Demasiados intentos. Espera un minuto." });
  const pool = getPool();
  const dto = req.body || {};
  const username = String(dto.username ?? dto.Username ?? "").trim();
  const password = String(dto.password ?? dto.Password ?? "");
  if (!username || !password) return send(res, 400, { message: "Nombre y contraseña son obligatorios." });

  const { rows } = await pool.query(
    `SELECT "Id","Username","PasswordHash","Role" FROM "Users" WHERE lower("Username")=lower($1)`,
    [username]
  );
  const u = rows[0];
  if (!u || !verifyPassword(password, u.PasswordHash)) {
    return send(res, 401, { message: "Nombre o contraseña incorrectos." });
  }
  const s = signToken({ id: u.Id, username: u.Username, role: u.Role });
  const r = newRefreshToken();
  await pool.query(
    `INSERT INTO "RefreshTokens"("Id","UserId","TokenHash","CreatedAtUtc","ExpiresAtUtc","RevokedAtUtc")
     VALUES (gen_random_uuid(),$1,$2,now(),$3,NULL)`,
    [u.Id, r.hash, refreshExpiresAt()]
  );
  return send(res, 200, { accessToken: s.token, refreshToken: r.opaque, username: u.Username, expiresAtUtc: s.expiresAtUtc });
}
