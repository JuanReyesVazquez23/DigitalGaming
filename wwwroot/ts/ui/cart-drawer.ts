// Layer: ts/ui/cart-drawer — drawer del carrito + compra (pide login con JWT).
import { checkout, orderLinesFor } from "../data/order-repository.js";
import { formatPrice, type Product } from "../domain/models.js";
import { cartCount, clearCart, getCart, removeFromCart, setQty } from "../services/cart-store.js";
import { getSession } from "../services/session-store.js";
import { SHIPPING_ZONES, cartSubtotal, shippingCost, waOrderLink } from "../services/shipping.js";

interface CartDeps {
  getCatalog: () => Product[];
  onCheckoutDone: () => Promise<void>;
  requireAuth: (notice: string) => void;
  /** Repinta la tienda (stock en vivo) cuando cambia el carrito. */
  onCartChanged: () => void;
  /** Recarga el catálogo del servidor (para depurar el carrito antes de pagar). */
  refreshCatalog: () => Promise<void>;
}

export function setupCart(deps: CartDeps): {
  renderCart: () => void;
  openCart: () => void;
  updateBadge: () => void;
} {
  const backdrop = getEl("cartBackdrop");
  const drawer = getEl("cartDrawer");
  const itemsEl = getEl("cartItems");
  const emptyEl = getEl("cartEmpty");
  const totalEl = getEl("cartTotal");
  const errorEl = getEl("cartError");
  const badge = getEl("cartCount");
  const checkoutBtn = getEl("checkoutBtn") as HTMLButtonElement;
  const subtotalEl = getEl("cartSubtotal");
  const shippingEl = getEl("cartShipping");
  const zoneSel = getEl("shipZone") as HTMLSelectElement;
  const successEl = getEl("orderSuccess");
  const successText = getEl("orderSuccessText");
  const whatsBtn = getEl("orderWhatsBtn") as HTMLAnchorElement;

  if (zoneSel.options.length === 0) {
    for (const z of SHIPPING_ZONES) {
      const o = document.createElement("option");
      o.value = z.id;
      o.textContent = `${z.label} — ${z.cost === 0 ? "Gratis" : formatPrice(z.cost)}`;
      zoneSel.appendChild(o);
    }
  }

  function openCart(): void {
    renderCart();
    backdrop.classList.add("open");
    drawer.classList.add("open");
  }

  function closeCart(): void {
    backdrop.classList.remove("open");
    drawer.classList.remove("open");
  }

  function updateBadge(): void {
    const n = cartCount();
    badge.hidden = n === 0;
    badge.textContent = n > 99 ? "99+" : String(n);
  }

  function renderCart(): void {
    updateBadge();
    const catalog = deps.getCatalog();
    const cart = getCart();
    const detailed = cart
      .map((l) => ({ line: l, product: catalog.find((p) => p.id === l.id) }))
      .filter((d) => d.product !== undefined);

    itemsEl.innerHTML = "";
    errorEl.textContent = "";
    emptyEl.style.display = detailed.length === 0 ? "block" : "none";
    checkoutBtn.disabled = detailed.length === 0;

    for (const { line, product } of detailed) {
      const p = product as Product;
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `<img alt="" loading="lazy" /><div class="meta"><strong></strong><span></span><div class="qty"><button data-act="dec">−</button><b></b><button data-act="inc">+</button></div></div><button class="cart-remove">Quitar</button>`;
      const img = row.querySelector("img") as HTMLImageElement;
      img.src = p.imageUrl;
      img.alt = p.name;
      img.referrerPolicy = "no-referrer";
      (row.querySelector("strong") as HTMLElement).textContent = p.name;
      (row.querySelector(".meta span") as HTMLElement).textContent = `${formatPrice(p.price)} c/u`;
      (row.querySelector(".qty b") as HTMLElement).textContent = String(line.qty);
      (row.querySelector('[data-act="dec"]') as HTMLButtonElement).addEventListener("click", () => {
        setQty(line.id, line.qty - 1);
        renderCart();
        deps.onCartChanged();
      });
      (row.querySelector('[data-act="inc"]') as HTMLButtonElement).addEventListener("click", () => {
        // Tope: no apartar más de lo que hay en stock.
        if (line.qty + 1 > p.stock) {
          toast(`Solo quedan ${p.stock} de "${p.name}".`);
          return;
        }
        setQty(line.id, line.qty + 1);
        renderCart();
        deps.onCartChanged();
      });
      (row.querySelector(".cart-remove") as HTMLButtonElement).addEventListener("click", () => {
        removeFromCart(line.id);
        renderCart();
        deps.onCartChanged();
      });
      itemsEl.appendChild(row);
    }
    const subtotal = cartSubtotal(detailed.map(({ line, product }) => ({ price: (product as Product).price, qty: line.qty })));
    const ship = shippingCost(subtotal, zoneSel.value);
    subtotalEl.textContent = formatPrice(subtotal);
    shippingEl.textContent = ship === 0 ? (subtotal > 0 ? "Gratis" : formatPrice(0)) : formatPrice(ship);
    totalEl.textContent = formatPrice(subtotal + ship);
  }

  async function doCheckout(): Promise<void> {
    const session = getSession();
    // Why: comprar exige login; sin JWT el backend responde 401.
    if (!session) {
      closeCart();
      deps.requireAuth("Para comprar necesitas entrar con tu cuenta. Si no tienes, crea una en segundos.");
      return;
    }
    // Why revalidar acá y no solo en el servidor: si algo del carrito ya no existe
    // (caché vieja, otro reinicio), se quita con aviso en vez de fallar la compra.
    const lines = orderLinesFor(getCart(), deps.getCatalog());
    errorEl.textContent = "";
    successEl.hidden = true;
    checkoutBtn.disabled = true;
    try {
      await deps.refreshCatalog();
      const fresh = deps.getCatalog();
      const cart = getCart();
      const dropped = cart.filter((l) => !fresh.some((p) => p.id === l.id));
      for (const l of dropped) removeFromCart(l.id);
      const valid = orderLinesFor(getCart(), fresh);
      if (dropped.length > 0) {
        renderCart();
        deps.onCartChanged();
        toast(`Se quitó del carrito lo que ya no está disponible (${dropped.length}).`);
      }
      if (valid.length === 0) {
        if (lines.length === 0 && dropped.length === 0) return; // carrito ya vacío
        errorEl.textContent = "Tu carrito quedó vacío: esos productos ya no están disponibles.";
        return;
      }
      const order = await checkout(valid, zoneSel.value);
      const count = valid.reduce((n, l) => n + l.quantity, 0);
      clearCart();
      renderCart();
      successText.textContent = `Pedido #${order.id.slice(0, 8)} · Total ${formatPrice(order.total)}`;
      whatsBtn.href = waOrderLink(order.id, order.total, count, session.username);
      successEl.hidden = false;
      toast(`¡Compra lista, ${session.username}!`);
      await deps.onCheckoutDone();
    } catch (e) {
      if (e instanceof Error && e.message === "NO_AUTH") {
        closeCart();
        deps.requireAuth("Tu sesión venció. Entra de nuevo para completar la compra.");
      } else {
        errorEl.textContent = e instanceof Error ? e.message : "No se pudo completar la compra.";
      }
    } finally {
      checkoutBtn.disabled = false;
    }
  }

  function hideSuccess(): void {
    successEl.hidden = true;
  }

  getEl("cartBtn").addEventListener("click", openCart);
  getEl("closeCartBtn").addEventListener("click", () => {
    hideSuccess();
    closeCart();
  });
  backdrop.addEventListener("click", () => {
    hideSuccess();
    closeCart();
  });
  zoneSel.addEventListener("change", renderCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeCart();
  });
  checkoutBtn.addEventListener("click", () => void doCheckout());

  updateBadge();
  return { renderCart, openCart, updateBadge };
}

export function toast(msg: string, ms = 4200): void {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  window.clearTimeout((el as unknown as { _t?: number })._t);
  (el as unknown as { _t?: number })._t = window.setTimeout(() => {
    el.hidden = true;
  }, ms);
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id} en index.html`);
  return el;
}
