import "server-only";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("auth_token="));
  if (!pair) return null;
  return pair.slice("auth_token=".length);
}

/**
 * GET /api/orders/mine — pedidos del usuario autenticado (por email del
 * token), ordenados por fecha descendente. 401 sin sesión válida.
 */
export async function GET(req: Request) {
  const token = getTokenFromCookieHeader(req.headers.get("cookie"));
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const rows = (await query(
    `SELECT id, stripe_event_id, stripe_session_id, customer_email, amount_total,
            currency, payment_status, fulfillment_status, order_data, created_at
       FROM orders
      WHERE lower(customer_email) = $1
      ORDER BY created_at DESC
      LIMIT 50`,
    [user.email.toLowerCase()]
  )) as Record<string, unknown>[];

  const orders = rows.map((row) => {
    const data = (row.order_data ?? {}) as {
      items?: { name?: string; quantity?: number; price?: number; size_ml?: number }[];
      couponCode?: string;
      paymentMethod?: string;
    };
    return {
      id: row.id,
      total: (row.amount_total as number) / 100,
      currency: row.currency,
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status ?? "pendiente",
      couponCode: data.couponCode ?? null,
      paymentMethod: data.paymentMethod ?? null,
      items: data.items ?? [],
      createdAt: new Date(row.created_at as string).toISOString(),
    };
  });

  return NextResponse.json({ orders });
}
