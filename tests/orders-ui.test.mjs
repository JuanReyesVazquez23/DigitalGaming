// Tests del modal Mis compras (historial). Corre con: node tests/orders-ui.test.mjs
const els = {};
function makeEl(id) {
  const listeners = {};
  const el = {
    id, textContent: "", innerHTML: "", value: "", hidden: false, disabled: false,
    style: {}, dataset: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; },
      contains(c) { return this._s.has(c); },
    },
    addEventListener(t, fn) { (listeners[t] ??= []).push(fn); },
    appendChild() {},
    click() { (listeners.click || []).forEach((f) => f({ target: el })); },
    querySelector() { return makeEl(`${id}-q`); },
    querySelectorAll() { return []; },
    closest() { return null; },
  };
  return el;
}
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
globalThis.document = {
  getElementById: (id) => (els[id] ??= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  body: (els.body ??= makeEl("body")),
  addEventListener() {},
};
globalThis.window = globalThis;

const proj = new URL("../wwwroot/js/", import.meta.url).href;
const assert = (c, m) => { if (!c) throw new Error(`FAIL: ${m}`); console.log(`ok: ${m}`); };
const { setupOrders } = await import(`${proj}ui/orders-controller.js`);
let notice = null;
setupOrders({ requireAuth: (n) => { notice = n; } });

// Sin sesión -> pide login, no abre compras
els.ordersBtn.click();
await new Promise((r) => setTimeout(r, 20));
assert(!!notice && !els.ordersBackdrop.classList.contains("open"), "sin sesión pide login");

// Con sesión -> abre modal (fetch real fallará sin red: solo verifica apertura del flujo)
store.dg_auth_v2 = JSON.stringify({ accessToken: "T", refreshToken: "R", username: "u", expiresAtUtc: new Date(Date.now() + 3600e3).toISOString() });
els.ordersBtn.click();
await new Promise((r) => setTimeout(r, 50));
assert(els.ordersBackdrop.classList.contains("open"), "con sesión abre modal");
console.log("HARNESS_OK");
process.exit(0);
