import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Order } from "@/types";

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

export type SaveOrderResult = { success: boolean; isDuplicate: boolean };

/**
 * Reads the orders file. Returns [] if the file does not exist.
 * On corrupt JSON, renames the corrupt file to `orders.json.corrupt.<timestamp>`
 * for forensic inspection and returns [].
 */
export async function readOrders(filePath = ORDERS_FILE): Promise<Order[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("orders file root is not an array");
    }
    return parsed as Order[];
  } catch (err) {
    console.error("readOrders: corrupt JSON, quarantining file:", err);
    const corruptPath = `${filePath}.corrupt.${Date.now()}`;
    try {
      await fs.rename(filePath, corruptPath);
    } catch (renameErr) {
      console.error("readOrders: failed to quarantine corrupt file:", renameErr);
    }
    return [];
  }
}

/**
 * Atomically appends an order to the orders file. Deduplicates by `eventId`:
 * if an order with the same stripe_event_id already exists, returns
 * `{ success: true, isDuplicate: true }` and writes nothing.
 * Uses write-to-tmp + rename for crash safety.
 */
export async function saveOrder(
  order: Order,
  filePath = ORDERS_FILE,
  eventId: string
): Promise<SaveOrderResult> {
  const existing = await readOrders(filePath);

  if (existing.some((o) => o.stripe_event_id === eventId)) {
    return { success: true, isDuplicate: true };
  }

  const fullOrder: Order = { ...order, stripe_event_id: eventId };
  const next = [...existing, fullOrder];

  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);

  return { success: true, isDuplicate: false };
}
