// Layer: ts/app — composición (entry point). Une domain/data/services/ui.
import { fetchProducts } from "./data/product-repository.js";
import { filterProducts } from "./services/product-service.js";
import { addToCart, getCart } from "./services/cart-store.js";
import { getSession } from "./services/session-store.js";
import { renderStore } from "./ui/store-renderer.js";
import { setupAdmin } from "./ui/admin-controller.js";
import { setupAuth } from "./ui/auth-controller.js";
import { setupCart, toast } from "./ui/cart-drawer.js";
import { setupOrders } from "./ui/orders-controller.js";
import { setupTapUnlock } from "./ui/tap-unlock.js";
import type { Product } from "./domain/models.js";

const grid = el("grid");
const empty = el("emptyState");
const count = el("countLabel");
const statTotal = document.getElementById("statTotal");
const search = el("searchInput") as HTMLInputElement;
const filters = el("filters");
const brandTitle = el("brandTitle");
const tapHint = el("tapHint");
const adminPanel = el("adminPanel");

let all: Product[] = [];
let activeCat = "all";

const auth = setupAuth({
  onSessionChanged: () => {
    cart.renderCart();
    void reload();
    if (getSession()) {
      // Why: si entró para comprar, le devuelvo el carrito para cerrar la compra.
      if (getCart().length > 0) cart.openCart();
    } else {
      // Why: sin sesión el admin no puede guardar (401); se bloquea para no confundir.
      admin.lock();
    }
  },
});

const cart = setupCart({
  getCatalog: () => all,
  onCheckoutDone: reload,
  requireAuth: (notice) => auth.openAuth("login", notice),
  onCartChanged: paint,
});

setupOrders({
  requireAuth: (notice) => auth.openAuth("login", notice),
});

const admin = setupAdmin({
  onChanged: reload,
  onLock: () => tapLock.lock(),
});

const tapLock = setupTapUnlock(brandTitle, tapHint, () => {
  admin.setUnlocked(true);
  admin.renderAdminList(all);
  // Lleva al panel para que la salida sea descubrible.
  adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

filters.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("[data-cat]") as HTMLElement | null;
  if (!btn) return;
  activeCat = btn.dataset.cat ?? "all";
  filters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
  paint();
});

search.addEventListener("input", paint);

// Anuncio GTA VI: el botón filtra el catálogo y lleva a la ficha de reserva.
document.getElementById("gtaReserveBtn")?.addEventListener("click", () => {
  activeCat = "Videojuegos";
  search.value = "GTA";
  filters.querySelectorAll(".chip").forEach((c) =>
    c.classList.toggle("active", (c as HTMLElement).dataset.cat === "Videojuegos"));
  paint();
  grid.scrollIntoView({ behavior: "smooth", block: "start" });
});

async function reload(): Promise<void> {
  all = await fetchProducts();
  paint();
  admin.renderAdminList(all);
  cart.renderCart();
}

function paint(): void {
  const items = filterProducts(all, activeCat, search.value);
  const reserved = new Map(getCart().map((l) => [l.id, l.qty] as const));
  renderStore(
    grid,
    empty,
    count,
    items,
    (id) => {
      addToCart(id);
      cart.renderCart();
      paint();
      const p = all.find((x) => x.id === id);
      toast(p ? `Agregado: ${p.name} 🛒` : "Agregado al carrito 🛒");
    },
    (id) => reserved.get(id) ?? 0
  );
  if (statTotal) statTotal.textContent = String(all.length);
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta #${id}`);
  return node;
}

void reload();
