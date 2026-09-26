// GET /api/orders/mine — historial del usuario logueado
import { getPool } from "../_db.js";
import { getAuthUser, send } from "../_auth.js";
import type { DbRow, Handler } from "../_types.js";

const handler: Handler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { message: "Método no permitido." });
  }
  const user = getAuthUser(req);
  if (!user) return send(res, 401, { message: "No autorizado." });

  const pool = getPool();
  const { rows: orders } = await pool.query(
    `SELECT "Id","Total","CreatedAtUtc" FROM "Orders" WHERE "UserId"=$1 ORDER BY "CreatedAtUtc" DESC`,
    [user.id]
  );
  const out = [];
  for (const o of orders) {
    const { rows: items } = await pool.query(
      `SELECT "ProductName","UnitPrice","Quantity" FROM "OrderItems" WHERE "OrderId"=$1`,
      [String(o.Id)]
    );
    out.push({
      id: String(o.Id),
      total: Number(o.Total ?? 0),
      createdAtUtc: o.CreatedAtUtc instanceof Date ? o.CreatedAtUtc.toISOString() : String(o.CreatedAtUtc ?? ""),
      items: items.map((i: DbRow) => ({
        productName: String(i.ProductName ?? ""),
        quantity: Number(i.Quantity ?? 0),
        unitPrice: Number(i.UnitPrice ?? 0),
      })),
    });
  }
  return send(res, 200, out);
};

export default handler;
