// Compilado desde ts/data/order-repository.ts
const API = "/api/orders";
export async function checkout(lines, token) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ items: lines }),
  });
  if (res.status === 401) throw new Error("NO_AUTH");
  if (!res.ok) {
    let msg = "No se pudo completar la compra.";
    try {
      const data = await res.json();
      const m = data.message;
      if (typeof m === "string" && m !== "") msg = m;
    } catch { /* usa el fallback */ }
    throw new Error(msg);
  }
  const o = await res.json();
  const items = (o.items ?? o.Items ?? []).map((i) => ({
    productName: String(i.productName ?? i.ProductName ?? ""),
    quantity: Number(i.quantity ?? i.Quantity ?? 0),
    unitPrice: Number(i.unitPrice ?? i.UnitPrice ?? 0),
  }));
  return { id: String(o.id ?? o.Id ?? ""), total: Number(o.total ?? o.Total ?? 0), items };
}
export function orderLinesFor(cart, catalog) {
  return cart
    .filter((l) => catalog.some((p) => p.id === l.id))
    .map((l) => ({ productId: l.id, quantity: l.qty }));
}
