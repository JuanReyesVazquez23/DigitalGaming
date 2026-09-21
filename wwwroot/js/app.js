// Compilado desde ts/app.ts
import { fetchProducts } from "./data/product-repository.js";
import { filterProducts } from "./services/product-service.js";
import { addToCart } from "./services/cart-store.js";
import { renderStore } from "./ui/store-renderer.js";
import { setupAdmin } from "./ui/admin-controller.js";
import { setupAuth } from "./ui/auth-controller.js";
import { setupCart, toast } from "./ui/cart-drawer.js";
import { setupTapUnlock } from "./ui/tap-unlock.js";
const grid = el("grid");
const empty = el("emptyState");
const count = el("countLabel");
const statTotal = document.getElementById("statTotal");
const search = el("searchInput");
const filters = el("filters");
const brandTitle = el("brandTitle");
const tapHint = el("tapHint");
const adminPanel = el("adminPanel");
let all = [];
let activeCat = "all";
const auth = setupAuth({ onSessionChanged: () => { cart.renderCart(); void reload(); } });
const cart = setupCart({
  getCatalog: () => all,
  onCheckoutDone: reload,
  requireAuth: (notice) => auth.openAuth("login", notice),
});
const admin = setupAdmin({ onChanged: reload, onLock: () => tapLock.lock() });
const tapLock = setupTapUnlock(brandTitle, tapHint, () => {
  admin.setUnlocked(true);
  admin.renderAdminList(all);
  adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});
filters.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  activeCat = btn.dataset.cat ?? "all";
  filters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
  paint();
});
search.addEventListener("input", paint);
document.getElementById("gtaReserveBtn")?.addEventListener("click", () => {
  activeCat = "Videojuegos";
  search.value = "GTA";
  filters.querySelectorAll(".chip").forEach((c) =>
    c.classList.toggle("active", c.dataset.cat === "Videojuegos"));
  paint();
  grid.scrollIntoView({ behavior: "smooth", block: "start" });
});
async function reload() {
  all = await fetchProducts();
  paint();
  admin.renderAdminList(all);
  cart.renderCart();
}
function paint() {
  const items = filterProducts(all, activeCat, search.value);
  renderStore(grid, empty, count, items, (id) => {
    addToCart(id);
    cart.renderCart();
    const p = all.find((x) => x.id === id);
    toast(p ? `Agregado: ${p.name} 🛒` : "Agregado al carrito 🛒");
  });
  if (statTotal) statTotal.textContent = String(all.length);
}
function el(id) { const node = document.getElementById(id); if (!node) throw new Error(`Falta #${id}`); return node; }
void reload();
