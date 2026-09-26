// Layer: ts/services — reglas de negocio del MVP.
import type { Category, CreateProductDto, Product } from "../domain/models.js";

export function validateNewProduct(input: CreateProductDto): string | null {
  if (!input.name || input.name.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (!Number.isFinite(input.price) || input.price <= 0) return "El precio debe ser mayor a 0.";
  if (input.stock < 0) return "El stock no puede ser negativo.";
  return null;
}

/**
 * Normaliza una URL pegada por el admin: recorta espacios y agrega
 * `https://` si falta. Acepta data-URI de archivos subidos.
 */
export function normalizeImageUrl(raw: string): string {
  const t = (raw ?? "").trim();
  if (t === "") return "";
  if (t.startsWith("data:image/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return `https://${t}`;
}

export function withImageFallback(dto: CreateProductDto): CreateProductDto {
  const url = normalizeImageUrl(dto.imageUrl);
  if (url !== "") return { ...dto, imageUrl: url };
  return {
    ...dto,
    imageUrl: `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(dto.name)}`,
  };
}

/**
 * Minúsculas sin tildes ni signos: "Audífono" -> "audifono".
 * Así la búsqueda perdona tildes, mayúsculas y puntuación.
 */
export function normalizeText(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Búsqueda tolerante: cada palabra (ya normalizada) debe aparecer
 * en nombre, descripción o categoría, en cualquier orden.
 */
export function matchesProduct(p: Product, category: string, query: string): boolean {
  const okCat = category === "all" || String(p.category) === category;
  if (!okCat) return false;
  const tokens = normalizeText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = normalizeText(`${p.name} ${p.description} ${String(p.category)}`);
  return tokens.every((t) => hay.includes(t));
}

export function filterProducts(items: Product[], category: string, query: string): Product[] {
  return items.filter((p) => matchesProduct(p, category, query));
}

export function categoryOf(value: string): Category {
  const allowed: Category[] = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];
  return (allowed as string[]).includes(value) ? (value as Category) : "Accesorios";
}
