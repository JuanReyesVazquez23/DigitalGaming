// Capa compartida: pool Postgres (Neon pooled string) para las Functions.
// Env var en Vercel: POSTGRES_URL = connection string pooled con ?sslmode=require
import pg from "pg";
import type { DbPool } from "./_types.js";

const { Pool } = pg;
let pool: DbPool | null = null;

export function getPool(): DbPool {
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
export function __setPool(p: DbPool): void {
  pool = p;
}
