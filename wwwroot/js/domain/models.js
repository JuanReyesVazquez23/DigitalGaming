// Compilado desde ts/domain/models.ts (MVP: JS espejo para navegador sin build).
export const CATEGORIES = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];
export function formatPrice(n) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}
