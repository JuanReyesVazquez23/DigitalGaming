// Layer: ts/services/image — optimiza fotos en cliente y las sube a Storage.
import { api } from "./api-config.js";
import { authFetch } from "../data/auth-fetch.js";

/**
 * Reduce una imagen a maxDim px por lado (JPEG 0.85) para no subir fotos gigantes.
 */
export async function downscaleImage(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no soporta procesar imágenes.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("No se pudo procesar la imagen.");
  return blob;
}

/** Convierte un archivo a data-URI (fallback local cuando no hay Storage). */
export function fileToDataUri(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer ese archivo."));
    reader.readAsDataURL(file);
  });
}

/**
 * Sube un blob a /api/upload (requiere login).
 * Sin Storage (501) o sin endpoint (404, backend local) usa base64 local.
 */
export async function resolveUpload(blob: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);
  let res: Response;
  try {
    res = await authFetch(api("/api/upload"), { method: "POST", body: form });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTH") throw e;
    return fileToDataUri(blob);
  }
  if (res.status === 501 || res.status === 404) return fileToDataUri(blob);
  if (!res.ok) {
    let msg = "No se pudo subir la imagen.";
    try {
      const data = await res.json();
      const m = (data as { message?: unknown }).message;
      if (typeof m === "string" && m !== "") msg = m;
    } catch { /* usa el fallback */ }
    throw new Error(msg);
  }
  const data = (await res.json()) as { url?: unknown };
  const url = typeof data.url === "string" ? data.url : "";
  if (!url) throw new Error("No se pudo subir la imagen.");
  return url;
}
