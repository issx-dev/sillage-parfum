import "server-only";
import { query, transaction } from "@/lib/db";
import type { Order } from "@/types";
import { mapFulfillmentStatus, type FulfillmentStatus } from "./fulfillment";

export type SaveOrderResult = { success: boolean; isDuplicate: boolean };

/**
 * Reads all orders from the database, ordered by creation date descending.
 */
export async function readOrders(): Promise<Order[]> {
  const rows = await query(
    `SELECT id, stripe_event_id, stripe_session_id, customer_email, amount_total, currency, payment_status, order_data, created_at FROM orders ORDER BY created_at DESC`
  );

  return (rows as Record<string, unknown>[]).map(mapOrderRow);
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
export interface OrdersPageFilter {
  status?: Order["status"];
  fulfillment?: FulfillmentStatus;
  email?: string;
  limit?: number;
  offset?: number;
}

function buildOrdersWhere(filter: { status?: Order["status"]; fulfillment?: FulfillmentStatus; email?: string }): {
  clause: string;
  values: unknown[];
} {
  const conds: string[] = [];
  const values: unknown[] = [];
  if (filter.status) {
    conds.push(`payment_status = $${values.length + 1}`);
    values.push(filter.status);
  }
  if (filter.fulfillment) {
    conds.push(`fulfillment_status = $${values.length + 1}`);
    values.push(filter.fulfillment);
  }
  if (filter.email) {
    conds.push(`customer_email ILIKE $${values.length + 1}`);
    values.push(`%${filter.email}%`);
  }
  return { clause: conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "", values };
}

/**
 * Pedidos paginados con los mismos filtros de la UI (estado + email).
 * Para el Resumen se sigue usando `readOrders` (KPIs sobre el total).
 */
export async function readOrdersPage(filter: OrdersPageFilter): Promise<Order[]> {
  const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);
  const offset = Math.max(filter.offset ?? 0, 0);
  const { clause, values } = buildOrdersWhere(filter);
  const rows = await query(
    `SELECT id, stripe_event_id, stripe_session_id, customer_email, amount_total, currency, payment_status, fulfillment_status, order_data, created_at FROM orders ${clause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );

  return (rows as Record<string, unknown>[]).map(mapOrderRow);
}

/** Nº total de pedidos con los mismos filtros (para paginar). */
export async function countOrders(filter: { status?: Order["status"]; fulfillment?: FulfillmentStatus; email?: string }): Promise<number> {
  const { clause, values } = buildOrdersWhere(filter);
  const rows = (await query(
    `SELECT COUNT(*)::int AS n FROM orders ${clause}`,
    values
  )) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

function mapOrderRow(row: Record<string, unknown>): Order {
  const status = row.payment_status as string;
  const mapped: Order["status"] =
    status === "paid"
      ? "paid"
      : status === "pending"
        ? "pending"
        : status === "refunded"
          ? "refunded"
          : "failed";
  const data = (row.order_data ?? {}) as {
    items?: Order["items"];
    paymentMethod?: Order["paymentMethod"];
    couponCode?: string;
    paymentIntent?: string | null;
    shipping?: Order["shipping"];
  };
  return {
    id: row.id as string,
    stripe_event_id: row.stripe_event_id as string,
    items: data.items ?? [],
    total: (row.amount_total as number) / 100,
    status: mapped,
    fulfillment: mapFulfillmentStatus(row.fulfillment_status),
    customerEmail: row.customer_email as string | undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
    ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
    ...(data.couponCode ? { couponCode: data.couponCode } : {}),
    ...(data.paymentIntent ? { paymentIntent: data.paymentIntent } : {}),
    ...(data.shipping ? { shipping: data.shipping } : {}),
  };
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
    // order_data guarda items + contexto (método de pago, cupón,
    // payment_intent para enlazar refunds, dirección en COD). Los lectores
    // antiguos que solo leen `items` siguen funcionando.
    const orderData = JSON.stringify({
      items: order.items,
      ...(order.paymentMethod ? { paymentMethod: order.paymentMethod } : {}),
      ...(order.couponCode ? { couponCode: order.couponCode } : {}),
      ...(order.paymentIntent ? { paymentIntent: order.paymentIntent } : {}),
      ...(order.shipping ? { shipping: order.shipping } : {}),
    });

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
        `UPDATE variants SET stock = stock - $1 WHERE variant_id = $2 AND stock >= $1 RETURNING variant_id`,
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

/**
 * Marca como `refunded` el pedido cuyo `order_data.paymentIntent` coincide.
 * Lo usa el webhook `charge.refunded`: sin payment_intent no hay enlace
 * fiable sesión↔pedido, así que el caller solo llama con un id presente.
 * Idempotente: si ya estaba en `refunded`, no toca nada.
 */
export async function markOrderRefundedByPaymentIntent(
  paymentIntentId: string
): Promise<{ updated: boolean }> {
  const rows = (await query(
    `UPDATE orders SET payment_status = 'refunded' WHERE order_data->>'paymentIntent' = $1 AND payment_status != 'refunded' RETURNING id`,
    [paymentIntentId]
  )) as unknown[];
  return { updated: rows.length > 0 };
}