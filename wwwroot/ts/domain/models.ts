// Layer: ts/domain — entidades puras, sin dependencias.
export type Category = "Consolas" | "Videojuegos" | "Accesorios" | "PC" | "Monitores";

export interface Product {
  id: string;
  name: string;
  price: number;
  /** Categoría del catálogo (string para interoperar con C# enum serializado). */
  category: Category | string;
  imageUrl: string;
  description: string;
  stock: number;
  /** Oculto del catálogo: solo aparece con entradas directas (botón Reservar). */
  hidden: boolean;
}

export interface CreateProductDto {
  name: string;
  price: number;
  category: Category;
  imageUrl: string;
  description: string;
  stock: number;
  hidden: boolean;
}

export const CATEGORIES: Category[] = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];

/** Ventana de catálogo por desplazamiento (offset/limit). */
export interface PagedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export function formatPrice(n: number): string {
  // Tienda dominicana: pesos dominicanos, locale es-DO.
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}
