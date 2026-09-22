// Compilado desde ts/ui/store-renderer.ts
import { formatPrice } from "../domain/models.js";
export function renderStore(grid, empty, count, items, onAdd, cartQty) {
  grid.innerHTML = "";
  count.textContent = items.length === 1 ? "1 producto" : `${items.length} productos`;
  empty.style.display = items.length === 0 ? "block" : "none";
  for (const p of items) {
    const card = document.createElement("article");
    card.className = "card";
    const cat = String(p.category);
    card.innerHTML = `<div class="card-media"><img loading="lazy" alt="" /></div>
      <div class="card-body"><span class="badge cat-${cat}"></span>
      <h3 class="card-title"></h3><p class="card-desc"></p>
      <div class="card-foot"><span class="price"></span><span class="stock"></span></div>
      <button class="btn btn-secondary btn-add">Añadir al carrito</button></div>`;
    const img = card.querySelector("img");
    img.src = p.imageUrl; img.alt = p.name;
    img.referrerPolicy = "no-referrer";
    img.onerror = () => { img.src = `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(p.name)}`; };
    card.querySelector(".badge").textContent = cat;
    card.querySelector(".card-title").textContent = p.name;
    card.querySelector(".card-desc").textContent = p.description || "Sin descripción.";
    card.querySelector(".price").textContent = formatPrice(p.price);
    const reserved = cartQty?.(p.id) ?? 0;
    const available = Math.max(0, p.stock - reserved);
    const stock = card.querySelector(".stock");
    if (p.stock <= 0) {
      stock.textContent = "Agotado";
    } else if (available <= 0) {
      stock.textContent = `En tu carrito: ${reserved}`;
    } else if (reserved > 0) {
      stock.textContent = `Stock: ${available} · ${reserved} en carrito`;
    } else {
      stock.textContent = `Stock: ${p.stock}`;
    }
    if (available <= 5) stock.classList.add("low");
    const addBtn = card.querySelector(".btn-add");
    if (available <= 0) { addBtn.disabled = true; addBtn.textContent = p.stock <= 0 ? "Agotado" : "Límite en carrito"; }
    else { addBtn.addEventListener("click", () => onAdd?.(p.id)); }
    grid.appendChild(card);
  }
}
