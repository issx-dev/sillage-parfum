import "server-only";
import postgres from "postgres";
import { env } from "@/lib/env";

// Cached postgres pool on globalThis for HMR in development.
const globalForDb = globalThis as unknown as { __db: postgres.Sql | undefined };

export const db = globalForDb.__db ?? postgres(env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}

/**
 * Execute a raw SQL query with parameterized values.
 * Returns rows as unknown[] for caller-side type assertion.
 */
export async function query(
  sql: string,
  values: unknown[] = []
): Promise<unknown[]> {
  return db.unsafe(sql, values as postgres.Serializable[]) as unknown as Promise<unknown[]>;
}