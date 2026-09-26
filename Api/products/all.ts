// GET /api/products/all — catálogo completo (admin/listas). Sin caché CDN (cambia con cada alta).
import { getPool } from "../_db.js";
import { categoryToName, send } from "../_auth.js";
import type { DbRow, Handler } from "../_types.js";

function mapRow(r: DbRow): Record<string, unknown> {
  return {
    id: String(r.Id ?? ""),
    name: String(r.Name ?? ""),
    price: Number(r.Price ?? 0),
    category: categoryToName(r.Category),
    imageUrl: String(r.ImageUrl ?? ""),
    description: String(r.Description ?? ""),
    stock: Number(r.Stock ?? 0),
    hidden: Boolean(r.Hidden ?? false),
  };
}

const handler: Handler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { message: "Método no permitido." });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT "Id","Name","Price","Category","ImageUrl","Description","Stock","Hidden" FROM "Products" ORDER BY "Name"`
  );
  return send(res, 200, rows.map(mapRow));
};

export default handler;
