// Harness full-app: importa app.js real y simula flujos con DOM falso.
// Corre con: node tests/app.test.mjs (requiere npm run build antes)
const els = {};
function makeEl(id) {
  const listeners = {};
  const el = {
    id, textContent: "", innerHTML: "", value: "", hidden: false, disabled: false,
    checked: false, files: [], src: "", alt: "", referrerPolicy: "", href: "",
    style: {}, dataset: {}, options: [],
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; },
      contains(c) { return this._s.has(c); },
    },
    addEventListener(t, fn) { (listeners[t] ??= []).push(fn); },
    _listeners: listeners,
    appendChild() {},
    append() {},
    prepend() {},
    remove() {},
    focus() {},
    click() { (listeners.click || []).forEach((f) => f({ target: el })); },
    querySelector() { return makeEl(`${id}-q`); },
    querySelectorAll() { return []; },
    closest() { return null; },
    setAttribute() {},
    scrollIntoView() {},
  };
  return el;
}
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const docListeners = {};
globalThis.document = {
  getElementById: (id) => (els[id] ??= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  body: (els.body ??= makeEl("body")),
  addEventListener(t, fn) { (docListeners[t] ??= []).push(fn); },
  _dispatch(t, e) { (docListeners[t] || []).forEach((fn) => fn(e)); },
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.location = { hash: "", pathname: "/", search: "" };
globalThis.history = { pushState() {} };
if (!globalThis.crypto) globalThis.crypto = {};
if (!globalThis.crypto.randomUUID) {
  const { randomUUID } = await import("node:crypto");
  globalThis.crypto.randomUUID = randomUUID;
}

const GTA = { id: "gta-1", name: "GTA VI", price: 4950, category: "Videojuegos", imageUrl: "./assets/gta6.jpg", description: "d", stock: 50, hidden: true };
const VIS = { id: "vis-1", name: "Control Pro", price: 100, category: "Accesorios", imageUrl: "x", description: "d", stock: 5, hidden: false };
globalThis.fetchCalls = [];
globalThis.fetch = async (url, opts = {}) => {
  globalThis.fetchCalls.push(`${opts.method || "GET"} ${url}`);
  const u = String(url);
  if (u.endsWith("/api/products/all") && (opts.method || "GET") === "GET") {
    return { status: 200, ok: true, json: async () => [GTA, VIS] };
  }
  if ((u.includes("/api/products?") || u.endsWith("/api/products")) && (opts.method || "GET") === "GET") {
    // Imita al servidor: filtra ocultos y por categoría según querystring.
    const url = new URL(u, "http://x");
    let items = url.searchParams.get("includeHidden") === "true" ? [GTA, VIS] : [VIS];
    const cat = url.searchParams.get("category");
    if (cat) items = items.filter((p) => p.category === cat);
    const off = Number(url.searchParams.get("offset") || 0);
    return { status: 200, ok: true, json: async () => ({ items, total: items.length, limit: 8, offset: off }) };
  }
  if (u.endsWith("/api/auth/login")) {
    return { status: 200, ok: true, json: async () => ({ accessToken: "TOK", refreshToken: "REF", username: "pedro", expiresAtUtc: new Date(Date.now() + 3600e3).toISOString() }) };
  }
  if (u.endsWith("/api/auth/admin-status")) {
    const admin = store.dg_admin !== "0";
    return { status: 200, ok: true, json: async () => ({ username: "pedro", isAdmin: admin }) };
  }
  if (u.endsWith("/api/orders") && (opts.method || "GET") === "GET") {
    return { status: 200, ok: true, json: async () => [] };
  }
  if (u.endsWith("/api/orders/mine")) {
    return { status: 200, ok: true, json: async () => [{ id: "order-12345678", total: 4950, createdAtUtc: new Date().toISOString(), items: [{ productName: "GTA VI", quantity: 1, unitPrice: 4950 }] }] };
  }
  return { status: 404, ok: false, json: async () => ({ message: "no stub" }) };
};

const proj = new URL("../wwwroot/js/", import.meta.url).href;
const assert = (c, m) => { if (!c) throw new Error(`FAIL: ${m}`); console.log(`ok: ${m}`); };
await import(`${proj}app.js`);
await new Promise((r) => setTimeout(r, 50));

// 1. Sin sesión: historial -> login, no compras
els.ordersBtn.click();
await new Promise((r) => setTimeout(r, 20));
assert(els.authBackdrop.classList.contains("open"), "sin sesión abre login");
assert(!els.ordersBackdrop.classList.contains("open"), "sin sesión no abre compras");

// 2. Login guarda sesión y chip
els.aUser.value = "pedro";
els.aPass.value = "clave1234";
els.authSubmitBtn.click();
await new Promise((r) => setTimeout(r, 50));
assert(!!store.dg_auth_v2, "login guarda sesión");
assert(els.userName.textContent === "pedro", "chip muestra usuario");

// 3. Historial con sesión
els.ordersBtn.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.ordersBackdrop.classList.contains("open"), "abre Mis compras");
assert(globalThis.fetchCalls.some((c) => c.includes("/api/orders/mine")), "pide historial");

// 4. Escape cierra compras
globalThis.document._dispatch("keydown", { key: "Escape" });
assert(!els.ordersBackdrop.classList.contains("open"), "Escape cierra Mis compras");

// 4b. Oculto fuera del grid; Reservar aparta al carrito y abre drawer
await new Promise((r) => setTimeout(r, 20));
assert(els.countLabel.textContent === "1 producto", `grid oculta GTA (${els.countLabel.textContent})`);
els.gtaReserveBtn.click();
await new Promise((r) => setTimeout(r, 20));
assert(els.cartCount.textContent === "1", "badge marca 1");
assert(els.toast.textContent.includes("GTA"), "toast de reserva");
assert(els.cartDrawer.classList.contains("open"), "abre el carrito");
assert(/^\d+$/.test(els.cdDays.textContent), "countdown corriendo");

// 4c. Item inexistente se depura con aviso
store.dg_cart_v1 = JSON.stringify([{ id: "viejo-1", qty: 1 }]);
els.cartBtn.click();
els.checkoutBtn.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.toast.textContent.includes("quitó"), "item viejo se quita con aviso");
assert(!!els.cartCount.hidden, "carrito depurado");

// 5. No-admin denegado; admin desbloquea
store.dg_admin = "0";
for (let i = 0; i < 10; i++) els.brandTitle.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.adminPanel.style.display !== "block", "no-admin no entra");
assert(els.toast.textContent.includes("no tiene acceso"), "aviso de denegación");
delete store.dg_admin;
for (let i = 0; i < 10; i++) els.brandTitle.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.adminPanel.style.display === "block", "admin desbloquea con 10 toques");

// 6. Logout bloquea; sin sesión pide login; re-login re-desbloquea
els.logoutBtn.click();
await new Promise((r) => setTimeout(r, 20));
assert(els.adminPanel.style.display !== "block", "logout bloquea admin");
for (let i = 0; i < 9; i++) els.brandTitle.click();
assert(els.adminPanel.style.display !== "block", "9 toques no abren");
els.brandTitle.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.authBackdrop.classList.contains("open"), "sin sesión pide login");
els.aUser.value = "pedro";
els.aPass.value = "clave1234";
els.authSubmitBtn.click();
await new Promise((r) => setTimeout(r, 50));
for (let i = 0; i < 10; i++) els.brandTitle.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.adminPanel.style.display === "block", "re-desbloquea tras login");
console.log("FULLAPP_HARNESS_OK");
process.exit(0);
