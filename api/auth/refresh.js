// POST /api/auth/refresh — rota el refresh token y devuelve sesión nueva.
// El refresh usado queda revocado (si lo robaron, el legítimo falla y se detecta).
import { getPool } from "../_db.js";
import { newRefreshToken, refreshExpiresAt, send, sha256hex, signToken } from "../_auth.js";
import { authRateLimit } from "../_ratelimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
  if (!authRateLimit(req)) return send(res, 429, { message: "Demasiados intentos. Espera un minuto." });
  const opaque = String(req.body?.refreshToken ?? req.body?.RefreshToken ?? "");
  if (!opaque) return send(res, 400, { message: "Falta el refresh token." });

  const pool = getPool();
  const hash = sha256hex(opaque);
  const { rows } = await pool.query(
    `SELECT "Id","UserId","ExpiresAtUtc","RevokedAtUtc" FROM "RefreshTokens" WHERE "TokenHash"=$1`,
    [hash]
  );
  const t = rows[0];
  if (!t || t.RevokedAtUtc || new Date(t.ExpiresAtUtc).getTime() <= Date.now()) {
    return send(res, 401, { message: "Sesión inválida o vencida. Entra de nuevo." });
  }
  const { rows: users } = await pool.query(
    `SELECT "Id","Username","Role" FROM "Users" WHERE "Id"=$1`,
    [t.UserId]
  );
  const u = users[0];
  if (!u) return send(res, 401, { message: "Sesión inválida o vencida. Entra de nuevo." });

  await pool.query(`UPDATE "RefreshTokens" SET "RevokedAtUtc"=now() WHERE "TokenHash"=$1`, [hash]);
  const s = signToken({ id: u.Id, username: u.Username, role: u.Role });
  const r = newRefreshToken();
  await pool.query(
    `INSERT INTO "RefreshTokens"("Id","UserId","TokenHash","CreatedAtUtc","ExpiresAtUtc","RevokedAtUtc")
     VALUES (gen_random_uuid(),$1,$2,now(),$3,NULL)`,
    [u.Id, r.hash, refreshExpiresAt()]
  );
  return send(res, 200, { accessToken: s.token, refreshToken: r.opaque, username: u.Username, expiresAtUtc: s.expiresAtUtc });
}
