// Capa compartida: pool Postgres (Neon pooled string) para las Functions.
// Env var en Vercel: POSTGRES_URL = connection string pooled con ?sslmode=require
import pg from "pg";

const { Pool } = pg;
let pool = null;

export function getPool() {
  if (pool) return pool;
  const cs =
    process.env.POSTGRES_URL ||
    process.env.ConnectionStrings__DefaultConnection ||
    "";
  if (!cs) {
    throw new Error("Falta POSTGRES_URL (connection string de Neon) en variables de entorno.");
  }
  pool = new Pool({ connectionString: cs, max: 5 });
  return pool;
}

// Solo tests: inyecta un pool falso.
export function __setPool(p) {
  pool = p;
}
