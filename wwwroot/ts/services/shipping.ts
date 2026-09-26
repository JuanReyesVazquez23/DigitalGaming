// Layer: ts/services/shipping — zonas de envío RD + link de WhatsApp.
// Números de ejemplo: reemplazar WHATSAPP_NUMBER por el real de la tienda.
export interface ShippingZone {
  id: string;
  label: string;
  cost: number;
}

export const SHIPPING_ZONES: ShippingZone[] = [
  { id: "santo-domingo", label: "Gran Santo Domingo", cost: 250 },
  { id: "interior", label: "Interior del país", cost: 450 },
  { id: "pickup", label: "Recoger en tienda (SDE)", cost: 0 },
];

/** Envío gratis desde este subtotal (solo productos). */
export const FREE_SHIPPING_OVER = 20000;

/** WhatsApp de ejemplo de la tienda (elegir país RD + 809 + 555 ficticio). */
export const WHATSAPP_NUMBER = "18095550134";

export function zoneById(id: string): ShippingZone {
  return SHIPPING_ZONES.find((z) => z.id === id) ?? SHIPPING_ZONES[0];
}

export function shippingCost(subtotal: number, zoneId: string): number {
  if (subtotal >= FREE_SHIPPING_OVER) return 0;
  return zoneById(zoneId).cost;
}

export function cartSubtotal(items: { price: number; qty: number }[]): number {
  return items.reduce((n, l) => n + l.price * l.qty, 0);
}

export function waOrderLink(orderId: string, total: number, count: number, username: string): string {
  const msg =
    `Hola DigitalGaming, confirmo mi pedido #${orderId.slice(0, 8)} ` +
    `por RD$${total.toLocaleString("es-DO")} (${count} artículo(s)). Soy ${username}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
