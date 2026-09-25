// POST /api/upload — sube imagen de producto a Vercel Blob (requiere login).
// Sin BLOB_READ_WRITE_TOKEN responde 501 y el admin usa base64 local (dev).
import { promises as fs } from "node:fs";
import { put } from "@vercel/blob";
import formidable from "formidable";
import { getAuthUser, send } from "./_auth.js";

const MAX_BYTES = 4 * 1024 * 1024;

function safeName(original) {
  const base = String(original || "imagen").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80);
  return `productos/${Date.now()}-${Math.random().toString(36).slice(2)}-${base || "imagen"}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { message: "Método no permitido." });
  }
  if (!getAuthUser(req)) return send(res, 401, { message: "No autorizado." });
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";
  if (!token) return send(res, 501, { message: "Storage no configurado." });

  let file;
  try {
    const form = formidable({ multiples: false, maxFileSize: MAX_BYTES, maxTotalFileSize: MAX_BYTES });
    const [, files] = await form.parse(req);
    const up = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!up) return send(res, 400, { message: "Falta el archivo (campo file)." });
    file = up;
  } catch {
    return send(res, 400, { message: "Archivo inválido o mayor a 4MB." });
  }
  if (!String(file.mimetype || "").startsWith("image/")) {
    return send(res, 400, { message: "Solo se permiten imágenes (JPG, PNG, WEBP)." });
  }
  try {
    const data = await fs.readFile(file.filepath);
    const blob = await put(safeName(file.originalFilename), data, {
      access: "public",
      contentType: file.mimetype || "image/jpeg",
      token,
    });
    try { await fs.unlink(file.filepath); } catch { /* temporal, da igual */ }
    return send(res, 201, { url: blob.url });
  } catch {
    return send(res, 500, { message: "No se pudo subir la imagen." });
  }
}
