// Compilado desde ts/data/product-repository.ts
import { authHeader } from "../services/session-store.js";
const API = "/api/products";
const LS_KEY = "dm_products_v1";
function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeLocal(items) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch { /* MVP continúa */ }
}
export async function fetchProducts() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const normalized = data.map(normalize);
    if (normalized.length > 0) {
      const previous = readLocal();
      const localOnly = previous.filter((l) => !normalized.some((n) => n.id === l.id));
      writeLocal([...localOnly, ...normalized]);
    }
    return readLocal();
  } catch { return readLocal(); }
}
export async function createProduct(dto) {
  const fallback = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: dto.name, price: dto.price, category: dto.category,
    imageUrl: dto.imageUrl, description: dto.description, stock: dto.stock,
  };
  try {
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(dto) });
    if (res.status === 401) throw new Error("NO_AUTH");
    if (!res.ok) throw new Error(`API ${res.status}`);
    const created = normalize(await res.json());
    writeLocal([created, ...readLocal()]);
    return created;
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    writeLocal([fallback, ...readLocal()]);
    return fallback;
  }
}
export async function updateProduct(id, dto) {
  try {
    const res = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify(dto) });
    if (res.status === 401) throw new Error("NO_AUTH");
    if (!res.ok) throw new Error(`API ${res.status}`);
    const updated = normalize(await res.json());
    writeLocal(readLocal().map((p) => (p.id === id ? updated : p)));
    return updated;
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    const current = readLocal();
    const edited = { id, name: dto.name, price: dto.price, category: dto.category, imageUrl: dto.imageUrl, description: dto.description, stock: dto.stock };
    const exists = current.some((p) => p.id === id);
    writeLocal(exists ? current.map((p) => (p.id === id ? edited : p)) : [edited, ...current]);
    return edited;
  }
}
export async function deleteProduct(id) {
  const removeLocal = () => writeLocal(readLocal().filter((p) => p.id !== id));
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE", headers: { ...authHeader() } });
    if (res.status === 401) throw new Error("NO_AUTH");
    removeLocal();
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    removeLocal();
  }
}
function normalize(p) {
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
function mapCategory(raw) {
  const names = ["Consolas", "Videojuegos", "Accesorios", "PC", "Monitores"];
  if (typeof raw === "number" && names[raw] !== undefined) return names[raw];
  const s = String(raw);
  const asNum = Number(s);
  if (Number.isInteger(asNum) && names[asNum] !== undefined) return names[asNum];
  return s;
}
