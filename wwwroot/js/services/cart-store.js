// Compilado desde ts/services/cart-store.ts
const KEY = "dm_cart_v1";
export function getCart() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((l) => l.id && l.qty > 0) : [];
  } catch { return []; }
}
function save(cart) { localStorage.setItem(KEY, JSON.stringify(cart)); }
export function addToCart(id) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  if (line) line.qty = Math.min(99, line.qty + 1);
  else cart.push({ id, qty: 1 });
  save(cart);
}
export function setQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((l) => l.id !== id);
  else {
    const line = cart.find((l) => l.id === id);
    if (line) line.qty = Math.min(99, qty);
  }
  save(cart);
}
export function removeFromCart(id) { save(getCart().filter((l) => l.id !== id)); }
export function clearCart() { localStorage.removeItem(KEY); }
export function cartCount() { return getCart().reduce((n, l) => n + l.qty, 0); }
