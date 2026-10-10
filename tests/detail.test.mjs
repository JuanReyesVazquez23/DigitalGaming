// Tests: detalle de producto + búsqueda tolerante (módulos wwwroot reales).
// Corre con: node tests/detail.test.mjs (requiere npm run build antes)
const els = {};
function makeEl(id) {
  const listeners = {};
  const el = {
    id, textContent: "", innerHTML: "", value: "", hidden: false, disabled: false,
    src: "", alt: "", style: {}, dataset: {}, className: "",
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
  };
  return el;
}
globalThis.document = {
  getElementById: (id) => (els[id] ??= makeEl(id)),
  createElement: (tag) => makeEl(tag),
  body: (els.body ??= makeEl("body")),
  addEventListener() {},
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.location = { hash: "", pathname: "/", search: "" };
globalThis.history = { pushState() {} };

const proj = new URL("../wwwroot/js/", import.meta.url).href;
const assert = (c, m) => { if (!c) throw new Error(`FAIL: ${m}`); console.log(`ok: ${m}`); };

// --- búsqueda tolerante ---
const svc = await import(`${proj}services/product-service.js`);
assert(svc.normalizeText("Audífono Gamer ¡PRO!") === "audifono gamer pro", "normalizeText sin tildes/signos");
const p = { id: "1", name: "Audífono Fury", price: 1, category: "Accesorios", imageUrl: "", description: "Sonido 7.1", stock: 10, hidden: false };
assert(svc.matchesProduct(p, "all", "audifono"), "audifono encuentra Audífono");
assert(svc.matchesProduct(p, "all", "fury 7.1 accesorios"), "tokens en cualquier orden + categoría");
assert(!svc.matchesProduct(p, "all", "audifono xbox"), "token ausente no pasa");
assert(!svc.matchesProduct(p, "PC", "audifono"), "categoría filtra");

// --- detalle ---
const { setupDetail } = await import(`${proj}ui/product-detail.js`);
const catalog = [
  p,
  { id: "2", name: "Control Pro", price: 2, category: "Accesorios", imageUrl: "", description: "", stock: 3, hidden: false },
  { id: "3", name: "PC Titan", price: 3, category: "PC", imageUrl: "", description: "", stock: 1, hidden: false },
];
let added = null;
const detail = setupDetail({ getCatalog: () => catalog, onAdd: (id, qty) => { added = { id, qty }; } });
detail.openDetail("1");
assert(els.detailBackdrop.classList.contains("open"), "detalle abre");
assert(els.detailName.textContent === "Audífono Fury", "detalle pinta nombre");
assert(els.detailRelated, "relacionados existen");
els.detailInc.click(); els.detailInc.click();
assert(els.detailQty.textContent === "3", "qty sube con tope");
els.detailAddBtn.click();
assert(added && added.id === "1" && added.qty === 3, "añade con cantidad");
detail.openDetail("no-existe");
assert(els.detailName.textContent === "Audífono Fury", "id inválido no rompe");
detail.closeDetail();
assert(!els.detailBackdrop.classList.contains("open"), "detalle cierra");
console.log("DETAIL_SEARCH_TESTS_OK");
process.exit(0);
