import "server-only";
import { query } from "@/lib/db";
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
 * Idempotent upsert: if an order with the same stripe_event_id exists,
 * returns { success: true, isDuplicate: true } without creating a duplicate.
 */
export async function saveOrder(
  order: Omit<Order, "stripe_event_id">,
  eventId: string
): Promise<SaveOrderResult> {
  if (!order.customerEmail) {
    throw new Error("saveOrder: customer_email is required");
  }

  const amountCents = Math.round(order.total * 100);
  const orderData = JSON.stringify({ items: order.items });

  const result = await query(
    `INSERT INTO orders (stripe_event_id, stripe_session_id, customer_email, amount_total, currency, payment_status, order_data) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id`,
    [eventId, order.id, order.customerEmail ?? "", amountCents, "eur", order.status, orderData]
  );

  const isDuplicate = result.length === 0;
  return { success: true, isDuplicate };
}