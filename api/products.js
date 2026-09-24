// GET /api/products (público) · POST /api/products (requiere login)
import { getPool } from "./_db.js";
import { categoryToInt, categoryToName, getAuthUser, send } from "./_auth.js";

function mapRow(r) {
  return {
    id: r.Id,
    name: r.Name,
    price: Number(r.Price),
    category: categoryToName(r.Category),
    imageUrl: r.ImageUrl,
    description: r.Description,
    stock: r.Stock,
    hidden: !!r.Hidden,
  };
}

function validate(dto) {
  const name = String(dto.name ?? dto.Name ?? "").trim();
  if (name.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  const price = Number(dto.price ?? dto.Price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return "El precio debe ser mayor a 0.";
  const stock = Number(dto.stock ?? dto.Stock ?? 0);
  if (!Number.isInteger(stock) || stock < 0) return "El stock no puede ser negativo.";
  return null;
}

export default async function handler(req, res) {
  const pool = getPool();

  if (req.method === "GET") {
    const { rows } = await pool.query(
      `SELECT "Id","Name","Price","Category","ImageUrl","Description","Stock","Hidden" FROM "Products" ORDER BY "Name"`
    );
    return send(res, 200, rows.map(mapRow));
  }

  if (req.method === "POST") {
    if (!getAuthUser(req)) return send(res, 401, { message: "No autorizado." });
    const dto = req.body || {};
    const err = validate(dto);
    if (err) return send(res, 400, { message: err });
    let category;
    try {
      category = categoryToInt(dto.category ?? dto.Category ?? "Accesorios");
    } catch (e) {
      return send(res, 400, { message: e.message });
    }
    const name = String(dto.name ?? dto.Name).trim();
    const imageUrl = String(dto.imageUrl ?? dto.ImageUrl ?? "").trim() || `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(name)}`;
    const { rows } = await pool.query(
      `INSERT INTO "Products"("Id","Name","Price","Category","ImageUrl","Description","Stock","Hidden")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7)
       RETURNING "Id","Name","Price","Category","ImageUrl","Description","Stock","Hidden"`,
      [name, Number(dto.price ?? dto.Price), category, imageUrl,
       String(dto.description ?? dto.Description ?? "").trim(), Number(dto.stock ?? dto.Stock ?? 0),
       Boolean(dto.hidden ?? dto.Hidden ?? false)]
    );
    return send(res, 201, mapRow(rows[0]));
  }

  res.setHeader("Allow", "GET, POST");
  return send(res, 405, { message: "Método no permitido." });
}
