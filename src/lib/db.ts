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

/**
 * Query function used inside a transaction — same signature as `query`.
 */
export type TxQuery = typeof query;

/**
 * Execute a callback within a database transaction.
 * All queries inside the callback run on the same pooled connection.
 * If the callback throws, the transaction is rolled back automatically
 * by the postgres driver and the error re-propagates to the caller.
 */
export async function transaction<T>(fn: (txQuery: TxQuery) => Promise<T>): Promise<T> {
  return db.begin(async (trx) => {
    const txQuery: TxQuery = async (sql, values = []) => {
      return trx.unsafe(sql, values as postgres.Serializable[]) as unknown as Promise<unknown[]>;
    };
    return fn(txQuery);
  }) as Promise<T>;
}