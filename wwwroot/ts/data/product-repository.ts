// Layer: ts/data — acceso a datos (API ASP.NET + respaldo localStorage).
import type { CreateProductDto, Product } from "../domain/models.js";
import { authHeader } from "../services/session-store.js";

const API = "/api/products";
const LS_KEY = "dm_products_v1";

function readLocal(): Product[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Product[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocal(items: Product[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    /* almacenamiento lleno/bloqueado: MVP continúa solo con API */
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as Product[];
    // Normaliza C# (PascalCase) -> TS (camelCase) por si el backend serializa así.
    const normalized = data.map(normalize);
    if (normalized.length > 0) {
      // Why merge y no overwrite: los productos creados sin conexión viven solo
      // en localStorage; antes se borraban del caché (y de la vista) en el próximo fetch.
      const previous = readLocal();
      const localOnly = previous.filter((l) => !normalized.some((n) => n.id === l.id));
      writeLocal([...localOnly, ...normalized]);
    }
    return readLocal();
  } catch {
    return readLocal();
  }
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const fallback: Product = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: dto.name,
    price: dto.price,
    category: dto.category,
    imageUrl: dto.imageUrl,
    description: dto.description,
    stock: dto.stock,
  };
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(dto),
    });
    if (res.status === 401) throw new Error("NO_AUTH");
    if (!res.ok) throw new Error(`API ${res.status}`);
    const created = normalize(await res.json());
    writeLocal([created, ...readLocal()]);
    return created;
  } catch (e) {
    // Why: sin login (401) no se inventa un producto local: el admin debe ver el
    // aviso de sesión en vez de creer que guardó en el servidor.
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    writeLocal([fallback, ...readLocal()]);
    return fallback;
  }
}

export async function updateProduct(id: string, dto: CreateProductDto): Promise<Product> {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(dto),
    });
    if (res.status === 401) throw new Error("NO_AUTH");
    if (!res.ok) throw new Error(`API ${res.status}`);
    const updated = normalize(await res.json());
    writeLocal(readLocal().map((p) => (p.id === id ? updated : p)));
    return updated;
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    // Sin conexión: upsert local para no perder la edición.
    const current = readLocal();
    const edited: Product = {
      id,
      name: dto.name,
      price: dto.price,
      category: dto.category,
      imageUrl: dto.imageUrl,
      description: dto.description,
      stock: dto.stock,
    };
    const exists = current.some((p) => p.id === id);
    writeLocal(exists ? current.map((p) => (p.id === id ? edited : p)) : [edited, ...current]);
    return edited;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const removeLocal = (): void => writeLocal(readLocal().filter((p) => p.id !== id));
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE", headers: { ...authHeader() } });
    // Why API primero: con 401 no se toca el caché (el producto sigue en el servidor
    // y reaparecería al recargar, confundiendo al admin).
    if (res.status === 401) throw new Error("NO_AUTH");
    removeLocal();
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    removeLocal(); // Sin conexión: al menos se borra en local.
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(p: any): Product {
  return {
    id: String(p.id ?? p.Id ?? crypto.randomUUID()),
    name: String(p.name ?? p.Name ?? "Sin nombre"),
    price: Number(p.price ?? p.Price ?? 0),
    category: mapCategory(p.category ?? p.Category ?? "Accesorios"),
    imageUrl: String(p.imageUrl ?? p.ImageUrl ?? ""),
    description: String(p.description ?? p.Description ?? ""),
    stock: Number(p.stock ?? p.Stock ?? 0),
  };
}

// Why: C# serializa Category como número (0-4) o string; el filtro usa nombres.
function mapCategory(raw: unknown): string {
  const names = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];
  if (typeof raw === "number" && names[raw] !== undefined) return names[raw];
  const s = String(raw);
  const asNum = Number(s);
  if (Number.isInteger(asNum) && names[asNum] !== undefined) return names[asNum];
  return s;
}
