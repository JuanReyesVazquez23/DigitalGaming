// Layer: ts/data/order-repository — compra (requiere JWT).
import type { CheckoutLine } from "../domain/auth.js";
import type { Product } from "../domain/models.js";

const API = "/api/orders";

export interface PlacedOrder {
  id: string;
  total: number;
  items: { productName: string; quantity: number; unitPrice: number }[];
}

export interface PlacedOrderFull extends PlacedOrder {
  createdAtUtc: string;
}

export async function checkout(lines: CheckoutLine[], token: string): Promise<PlacedOrder> {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = (data as any).message;
      if (typeof m === "string" && m !== "") msg = m;
    } catch { /* usa el fallback */ }
    throw new Error(msg);
  }
  const o = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((o.items ?? o.Items ?? []) as any[]).map((i) => ({
    productName: String(i.productName ?? i.ProductName ?? ""),
    quantity: Number(i.quantity ?? i.Quantity ?? 0),
    unitPrice: Number(i.unitPrice ?? i.UnitPrice ?? 0),
  }));
  return {
    id: String(o.id ?? o.Id ?? ""),
    total: Number(o.total ?? o.Total ?? 0),
    items,
  };
}

export function orderLinesFor(
  cart: { id: string; qty: number }[],
  catalog: Product[]
): CheckoutLine[] {
  return cart
    .filter((l) => catalog.some((p) => p.id === l.id))
    .map((l) => ({ productId: l.id, quantity: l.qty }));
}

export async function mine(token: string): Promise<PlacedOrderFull[]> {
  const res = await fetch(`${API}/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("NO_AUTH");
  if (!res.ok) throw new Error("No se pudo cargar el historial.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr = (await res.json()) as any[];
  return arr.map((o) => ({
    id: String(o.id ?? o.Id ?? ""),
    total: Number(o.total ?? o.Total ?? 0),
    createdAtUtc: String(o.createdAtUtc ?? o.CreatedAtUtc ?? ""),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (((o.items ?? o.Items ?? []) as any[]).map((i) => ({
      productName: String(i.productName ?? i.ProductName ?? ""),
      quantity: Number(i.quantity ?? i.Quantity ?? 0),
      unitPrice: Number(i.unitPrice ?? i.UnitPrice ?? 0),
    }))),
  }));
}
