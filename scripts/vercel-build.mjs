// Build de Vercel: genera wwwroot/js/config.js con la URL del API
// desde la variable de entorno API_URL (vacía = mismo origen, Functions en /api).
// Sin API_URL se usa "" (mismo origen, modo local).
import { writeFileSync } from "node:fs";

const api = (process.env.API_URL ?? "").trim().replace(/\/+$/, "");
const out = new URL("../wwwroot/js/config.js", import.meta.url);
writeFileSync(
  out,
  `// Generado en build de Vercel desde API_URL. No editar a mano.\nwindow.DG_API_URL = ${JSON.stringify(api)};\n`
);
console.log(`config.js -> API_URL=${api === "" ? "(mismo origen)" : api}`);
