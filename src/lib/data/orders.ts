import "server-only";
import { query, transaction } from "@/lib/db";
import type { Order } from "@/types";

export type SaveOrderResult = { success: boolean; isDuplicate: boolean };

/**
 * Reads all orders from the database, ordered by creation date descending.
 */
export async function readOrders(): Promise<Order[]> {
  const rows = await query(
    `SELECT id, stripe_event_id, stripe_session_id, customer_email, amount_total, currency, payment_status, order_data, created_at FROM orders ORDER BY created_at DESC`
  );

  return (rows as Record<string, unknown>[]).map((row) => {
    const status = row.payment_status as string;
    const mapped: Order["status"] =
      status === "paid"
        ? "paid"
        : status === "refunded"
          ? "refunded"
          : "failed";
    return {
      id: row.id as string,
      stripe_event_id: row.stripe_event_id as string,
      items: (row.order_data as { items?: Order["items"] })?.items ?? [],
      total: (row.amount_total as number) / 100,
      status: mapped,
      customerEmail: row.customer_email as string | undefined,
      createdAt: new Date(row.created_at as string).toISOString(),
    };
  });
}

/**
 * Idempotent upsert wrapped in a transaction. If an order with the same
 * stripe_event_id already exists, returns { success: true, isDuplicate: true }
 * without creating a duplicate or decrementing stock.
 *
 * For new orders, decrements stock for each variant atomically. If any
 * variant has insufficient stock (`UPDATE ... WHERE stock >= $1` returns
 * 0 rows), the entire transaction is rolled back and an error is thrown.
 */
export async function saveOrder(
  order: Omit<Order, "stripe_event_id">,
  eventId: string
): Promise<SaveOrderResult> {
  if (!order.customerEmail) {
    throw new Error("saveOrder: customer_email is required");
  }

  return transaction(async (txQuery) => {
    const amountCents = Math.round(order.total * 100);
    const orderData = JSON.stringify({ items: order.items });

    const result = await txQuery(
      `INSERT INTO orders (stripe_event_id, stripe_session_id, customer_email, amount_total, currency, payment_status, order_data) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id`,
      [eventId, order.id, order.customerEmail ?? "", amountCents, "eur", order.status, orderData]
    );

    // ON CONFLICT DO NOTHING → 0 rows → duplicate event, no stock changes.
    if (result.length === 0) {
      return { success: true, isDuplicate: true };
    }

    // Decrement stock for each variant in the order.
    for (const item of order.items) {
      const stockResult = await txQuery(
        `UPDATE variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id`,
        [item.quantity, item.variantId]
      );
      if (stockResult.length === 0) {
        // Throwing inside transaction() auto-rolls back via the driver.
        throw new Error(`saveOrder: insufficient stock for variant ${item.variantId}`);
      }
    }

    return { success: true, isDuplicate: false };
  });
}