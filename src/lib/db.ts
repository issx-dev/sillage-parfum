import "server-only";
import postgres from "postgres";
import { env } from "@/lib/env";

// Cached postgres pool on globalThis for HMR in development.
const globalForDb = globalThis as unknown as { __db: postgres.Sql | undefined };

// Serverless-safe connection options:
// - max: 5          small pool: avoids the parallel-query stalls seen
//                   with max 1 under the Supabase pooler, still small enough
//                   not to exhaust it (measured 2026-09-13: 12 parallel
//                   queries in ~65-436ms on session pooler :5432).
// - prepare: false  required for the Supabase pooler (pgBouncer
//                   transaction/session mode discards prepared statements
//                   between transactions). Queries stay parameterized via unsafe().
// - connect_timeout: fail fast instead of hanging minutes on a dead route.
// - idle_timeout:   close idle connections so the pooler/NAT never hands us
//                   a stale socket (without this, a dead connection hangs
//                   until TCP timeout — observed 90-300s stalls in dev).
export const db =
  globalForDb.__db ??
  postgres(env.DATABASE_URL, {
    max: 5,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
  });

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