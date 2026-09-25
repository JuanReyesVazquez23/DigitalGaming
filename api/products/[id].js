// PUT /api/products/:id · DELETE /api/products/:id (requieren login)
import { del } from "@vercel/blob";
import { getPool } from "../_db.js";
import { categoryToInt, categoryToName, getAuthUser, send } from "../_auth.js";

/** Borra el blob viejo sin romper nada si no es blob o falla. */
async function dropBlob(url) {
  if (typeof url !== "string" || (!url.includes("blob.vercel-storage.com") && !url.includes("public.blob.vercel-storage.com"))) return;
  try {
    await del(url);
  } catch { /* best-effort */ }
}

export default async function handler(req, res) {
  if (!getAuthUser(req)) return send(res, 401, { message: "No autorizado." });
  const pool = getPool();
  const { id } = req.query;

  if (req.method === "PUT") {
    const dto = req.body || {};
    const name = String(dto.name ?? dto.Name ?? "").trim();
    if (name.length < 2) return send(res, 400, { message: "El nombre debe tener al menos 2 caracteres." });
    const price = Number(dto.price ?? dto.Price ?? 0);
    if (!Number.isFinite(price) || price <= 0) return send(res, 400, { message: "El precio debe ser mayor a 0." });
    let category;
    try {
      category = categoryToInt(dto.category ?? dto.Category ?? "Accesorios");
    } catch (e) {
      return send(res, 400, { message: e.message });
    }
    const imageUrl = String(dto.imageUrl ?? dto.ImageUrl ?? "").trim() || `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(name)}`;
    const prev = await pool.query(`SELECT "ImageUrl" FROM "Products" WHERE "Id"=$1`, [id]);
    const { rows } = await pool.query(
      `UPDATE "Products" SET "Name"=$1,"Price"=$2,"Category"=$3,"ImageUrl"=$4,"Description"=$5,"Stock"=$6,"Hidden"=$7
       WHERE "Id"=$8
       RETURNING "Id","Name","Price","Category","ImageUrl","Description","Stock","Hidden"`,
      [name, price, category, imageUrl, String(dto.description ?? dto.Description ?? "").trim(),
       Math.max(0, Number(dto.stock ?? dto.Stock ?? 0)), Boolean(dto.hidden ?? dto.Hidden ?? false), id]
    );
    if (rows.length === 0) return send(res, 404, { message: "No encontrado." });
    const r = rows[0];
    if (prev.rows[0] && prev.rows[0].ImageUrl !== r.ImageUrl) await dropBlob(prev.rows[0].ImageUrl);
    return send(res, 200, {
      id: r.Id, name: r.Name, price: Number(r.Price), category: categoryToName(r.Category),
      imageUrl: r.ImageUrl, description: r.Description, stock: r.Stock, hidden: !!r.Hidden,
    });
  }

  if (req.method === "DELETE") {
    const prev = await pool.query(`SELECT "ImageUrl" FROM "Products" WHERE "Id"=$1`, [id]);
    const { rowCount } = await pool.query(`DELETE FROM "Products" WHERE "Id"=$1`, [id]);
    if (rowCount === 0) return send(res, 404, { message: "No encontrado." });
    if (prev.rows[0]) await dropBlob(prev.rows[0].ImageUrl);
    return res.status(204).end();
  }

  res.setHeader("Allow", "PUT, DELETE");
  return send(res, 405, { message: "Método no permitido." });
}
