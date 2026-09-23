// POST /api/orders — compra del carrito (requiere login). Transacción: valida stock,
// crea pedido y descuenta inventario. Agrupa líneas duplicadas (anti-oversell).
import crypto from "node:crypto";
import { getPool } from "./_db.js";
import { getAuthUser, send } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
  const user = getAuthUser(req);
  if (!user) return send(res, 401, { message: "No autorizado." });

  const items = req.body?.items ?? req.body?.Items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return send(res, 400, { message: "El carrito está vacío." });
  }
  // Agrupa por producto antes de validar stock.
  const grouped = new Map();
  for (const it of items) {
    const pid = String(it.productId ?? it.ProductId ?? "");
    const q = Number(it.quantity ?? it.Quantity ?? 0);
    if (!pid || !Number.isInteger(q) || q < 1 || q > 99) {
      return send(res, 400, { message: "Cantidad inválida para un producto." });
    }
    grouped.set(pid, (grouped.get(pid) || 0) + q);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lines = [];
    for (const [pid, qty] of grouped) {
      const { rows } = await client.query(
        `SELECT "Id","Name","Price","Stock" FROM "Products" WHERE "Id"=$1 FOR UPDATE`,
        [pid]
      );
      const p = rows[0];
      if (!p) {
        await client.query("ROLLBACK");
        return send(res, 400, { message: "Un producto del carrito ya no existe." });
      }
      if (p.Stock < qty) {
        await client.query("ROLLBACK");
        return send(res, 400, { message: `Sin stock suficiente de "${p.Name}" (quedan ${p.Stock}).` });
      }
      lines.push({ productId: p.Id, productName: p.Name, unitPrice: Number(p.Price), quantity: qty });
      await client.query(`UPDATE "Products" SET "Stock"="Stock"-$1 WHERE "Id"=$2`, [qty, pid]);
    }
    const total = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
    const orderId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "Orders"("Id","UserId","Username","Total","CreatedAtUtc") VALUES ($1,$2,$3,$4,now())`,
      [orderId, user.id, user.username, total]
    );
    for (const l of lines) {
      await client.query(
        `INSERT INTO "OrderItems"("Id","OrderId","ProductId","ProductName","UnitPrice","Quantity")
         VALUES (gen_random_uuid(),$1,$2,$3,$4,$5)`,
        [orderId, l.productId, l.productName, l.unitPrice, l.quantity]
      );
    }
    await client.query("COMMIT");
    return send(res, 201, { id: orderId, total, items: lines });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ya en error */ }
    throw e;
  } finally {
    client.release();
  }
}
