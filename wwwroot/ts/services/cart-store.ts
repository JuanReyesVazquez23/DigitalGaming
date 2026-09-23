// Layer: ts/services/cart-store — carrito en localStorage (funciona sin login; la compra sí lo pide).
import type { CartLine } from "../domain/auth.js";

const KEY = "dg_cart_v1";

export function getCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CartLine[];
    return Array.isArray(arr) ? arr.filter((l) => l.id && l.qty > 0) : [];
  } catch {
    return [];
  }
}

function save(cart: CartLine[]): void {
  localStorage.setItem(KEY, JSON.stringify(cart));
}

export function addToCart(id: string): void {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (line) line.qty = Math.min(99, line.qty + 1);
  else cart.push({ id, qty: 1 });
  save(cart);
}

export function setQty(id: string, qty: number): void {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((l) => l.id !== id);
  else {
    const line = cart.find((l) => l.id === id);
    if (line) line.qty = Math.min(99, qty);
  }
  save(cart);
}

export function removeFromCart(id: string): void {
  save(getCart().filter((l) => l.id !== id));
}

export function clearCart(): void {
  localStorage.removeItem(KEY);
}

export function cartCount(): number {
  return getCart().reduce((n, l) => n + l.qty, 0);
}
