// POST /api/auth/login — valida nombre + contraseña y devuelve sesión JWT
import { getPool } from "../_db.js";
import { send, signToken, verifyPassword } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
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
  return send(res, 200, { token: s.token, username: u.Username, expiresAtUtc: s.expiresAtUtc });
}
