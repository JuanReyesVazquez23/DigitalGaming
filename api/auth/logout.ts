// POST /api/auth/logout — revoca un refresh token, o todas las sesiones (requiere login).
import { getPool } from "../_db.js";
import { getAuthUser, send, sha256hex } from "../_auth.js";
import type { Handler } from "../_types.js";

const handler: Handler = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
  const user = getAuthUser(req);
  if (!user) return send(res, 401, { message: "No autorizado." });

  const pool = getPool();
  const body = (req.body ?? {}) as Record<string, unknown>;
  const opaque = String(body.refreshToken ?? body.RefreshToken ?? "");
  if (opaque !== "") {
    await pool.query(`UPDATE "RefreshTokens" SET "RevokedAtUtc"=now() WHERE "TokenHash"=$1`, [sha256hex(opaque)]);
  } else {
    await pool.query(`UPDATE "RefreshTokens" SET "RevokedAtUtc"=now() WHERE "UserId"=$1 AND "RevokedAtUtc" IS NULL`, [user.id]);
  }
  return res.status(204).end();
};

export default handler;
