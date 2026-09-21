// Compilado desde ts/services/product-service.ts
export function validateNewProduct(input) {
  if (!input.name || input.name.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (!Number.isFinite(input.price) || input.price <= 0) return "El precio debe ser mayor a 0.";
  if (input.stock < 0) return "El stock no puede ser negativo.";
  return null;
}
export function normalizeImageUrl(raw) {
  const t = (raw ?? "").trim();
  if (t === "") return "";
  if (t.startsWith("data:image/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return `https://${t}`;
}
export function withImageFallback(dto) {
  const url = normalizeImageUrl(dto.imageUrl);
  if (url !== "") return { ...dto, imageUrl: url };
  return { ...dto, imageUrl: `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(dto.name)}` };
}
export function filterProducts(items, category, query) {
  const q = query.trim().toLowerCase();
  return items.filter((p) => {
    const okCat = category === "all" || String(p.category) === category;
    const okQuery = q === "" || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    return okCat && okQuery;
  });
}
export function categoryOf(value) {
  const allowed = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];
  return allowed.includes(value) ? value : "Accesorios";
}
