// Layer: ts/ui/product-detail — overlay de ficha con relacionados y deep link #/p/:id.
import { formatPrice, type Product } from "../domain/models.js";

interface DetailDeps {
  getCatalog: () => Product[];
  onAdd: (id: string, qty: number) => void;
}

export function setupDetail(deps: DetailDeps): {
  openDetail: (id: string) => void;
  closeDetail: () => void;
} {
  const backdrop = getEl("detailBackdrop");
  const img = getEl("detailImg") as HTMLImageElement;
  const cat = getEl("detailCat");
  const name = getEl("detailName");
  const price = getEl("detailPrice");
  const stock = getEl("detailStock");
  const desc = getEl("detailDesc");
  const qtyEl = getEl("detailQty");
  const related = getEl("detailRelated");

  let currentId: string | null = null;
  let qty = 1;

  function paintQty(max: number): void {
    qty = Math.min(Math.max(1, qty), Math.max(1, max));
    qtyEl.textContent = String(qty);
  }

  function openDetail(id: string): void {
    const p = deps.getCatalog().find((x) => x.id === id);
    if (!p) return;
    currentId = id;
    qty = 1;
    img.src = p.imageUrl;
    img.alt = p.name;
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      img.onerror = null;
      img.src = `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(p.name)}`;
    };
    cat.textContent = String(p.category);
    cat.className = `badge cat-${String(p.category)}`;
    name.textContent = p.name;
    price.textContent = formatPrice(p.price);
    stock.textContent = p.stock <= 0 ? "Agotado" : `Stock: ${p.stock}`;
    stock.className = p.stock <= 5 ? "muted stock low" : "muted stock";
    desc.textContent = p.description || "Sin descripción.";
    paintQty(p.stock);

    related.innerHTML = "";
    const rel = deps.getCatalog().filter((x) => x.id !== id && String(x.category) === String(p.category)).slice(0, 4);
    getEl("detailRelatedWrap").style.display = rel.length === 0 ? "none" : "";
    for (const r of rel) {
      const b = document.createElement("button");
      b.innerHTML = `<img loading="lazy" alt="" /><span></span>`;
      const ri = b.querySelector("img") as HTMLImageElement;
      ri.src = r.imageUrl;
      ri.alt = r.name;
      (b.querySelector("span") as HTMLElement).textContent = r.name;
      b.addEventListener("click", () => openDetail(r.id));
      related.appendChild(b);
    }

    backdrop.classList.add("open");
    document.body.classList.add("modal-open");
    try {
      window.location.hash = `#/p/${id}`;
    } catch { /* sin historial disponible */ }
  }

  function closeDetail(): void {
    if (!backdrop.classList.contains("open")) return;
    backdrop.classList.remove("open");
    document.body.classList.remove("modal-open");
    currentId = null;
    try {
      if (window.location.hash.startsWith("#/p/")) {
        window.history.pushState(null, "", window.location.pathname + window.location.search);
      }
    } catch { /* sin historial disponible */ }
  }

  function current(): Product | undefined {
    return currentId ? deps.getCatalog().find((x) => x.id === currentId) : undefined;
  }

  getEl("detailDec").addEventListener("click", () => {
    const p = current();
    if (!p) return;
    qty -= 1;
    paintQty(p.stock);
  });
  getEl("detailInc").addEventListener("click", () => {
    const p = current();
    if (!p) return;
    if (qty + 1 > p.stock) return;
    qty += 1;
    paintQty(p.stock);
  });
  getEl("detailAddBtn").addEventListener("click", () => {
    if (currentId) deps.onAdd(currentId, qty);
  });
  getEl("closeDetailBtn").addEventListener("click", closeDetail);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeDetail();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop.classList.contains("open")) closeDetail();
  });
  window.addEventListener("hashchange", () => {
    if (!window.location.hash.startsWith("#/p/")) closeDetail();
  });

  return { openDetail, closeDetail };
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id} en index.html`);
  return el;
}
