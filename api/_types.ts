// Tipos compartidos del API (Vercel Functions). Sin dependencias: solo contratos.
export interface DbRow {
  [key: string]: unknown;
}

export interface DbResult {
  rows: DbRow[];
  rowCount: number | null;
}

export interface DbClient {
  query(text: string, params?: unknown[]): Promise<DbResult>;
  release(): void;
}

export interface DbPool {
  query(text: string, params?: unknown[]): Promise<DbResult>;
  connect(): Promise<DbClient>;
}

export interface VercelReq {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface VercelRes {
  status(code: number): VercelRes;
  json(obj: unknown): unknown;
  setHeader(name: string, value: string): void;
  end(): unknown;
}

export type Handler = (req: VercelReq, res: VercelRes) => Promise<unknown>;
