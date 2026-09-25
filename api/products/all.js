// GET /api/products/all — catálogo completo (admin/listas). Sin caché CDN (cambia con cada alta).
import { getPool } from "../_db.js";
import { categoryToName, send } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { message: "Método no permitido." });
  }
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT "Id","Name","Price","Category","ImageUrl","Description","Stock","Hidden" FROM "Products" ORDER BY "Name"`
  );
  return send(res, 200, rows.map((r) => ({
    id: r.Id,
    name: r.Name,
    price: Number(r.Price),
    category: categoryToName(r.Category),
    imageUrl: r.ImageUrl,
    description: r.Description,
    stock: r.Stock,
    hidden: !!r.Hidden,
  })));
}
