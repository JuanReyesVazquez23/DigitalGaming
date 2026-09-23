// GET /api/auth/me — identidad del JWT (requiere login)
import { getAuthUser, send } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { message: "Método no permitido." });
  }
  const u = getAuthUser(req);
  if (!u) return send(res, 401, { message: "No autorizado." });
  return send(res, 200, { username: u.username, role: u.role });
}
