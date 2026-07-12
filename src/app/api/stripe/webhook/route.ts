import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { saveOrder } from "@/lib/data/orders";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import type { Order } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Pedido completado:", session.id);
    console.log("   Total:", session.amount_total);
    console.log("   Items:", session.metadata?.items);

    const metadataItems = session.metadata?.items;
    const order: Omit<Order, "stripe_event_id"> = {
      id: session.id,
      items: [],
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      customerEmail:
        session.customer_details?.email ?? session.customer_email ?? undefined,
      createdAt: new Date().toISOString(),
    };

    let parsedItems: Array<{
      variantId: string;
      quantity: number;
    }> = [];

    if (metadataItems) {
      try {
        const parsed = JSON.parse(metadataItems);
        if (Array.isArray(parsed)) {
          order.items = parsed as Order["items"];
          parsedItems = parsed as typeof parsedItems;
        }
      } catch (err) {
        console.error("Webhook: failed to parse session.metadata.items:", err);
      }
    }

    // ─── Price integrity check ───
    // Verify that the Stripe amount_total matches the sum of DB variant
    // prices × quantities. This prevents client-side price manipulation.
    if (parsedItems.length > 0) {
      const variantIds = parsedItems
        .map((i) => i.variantId)
        .filter(Boolean);

      if (variantIds.length > 0) {
        const priceRows = (await query(
          "SELECT id, price FROM variants WHERE id = ANY($1)",
          [variantIds]
        )) as Array<{ id: string; price: number }>;

        // Check that all ordered variants were found in the DB.
        if (priceRows.length !== new Set(variantIds).size) {
          console.error(
            `[Webhook CRITICAL] Price check failed: one or more variants not found in DB (expected ${variantIds.length}, got ${priceRows.length})`
          );
          return NextResponse.json(
            { error: "Price verification failed" },
            { status: 400 }
          );
        }

        // Calculate expected total in cents to avoid floating-point drift.
        const priceMap = new Map(priceRows.map((r) => [r.id, r.price]));
        const expectedTotalCents = parsedItems.reduce(
          (sum, item) =>
            sum + Math.round((priceMap.get(item.variantId) ?? 0) * 100) * item.quantity,
          0
        );

        const actualTotalCents = session.amount_total ?? 0;

        if (expectedTotalCents !== actualTotalCents) {
          console.error(
            `[Webhook CRITICAL] Price mismatch: expected ${expectedTotalCents} cents, got ${actualTotalCents} cents`
          );
          return NextResponse.json(
            { error: "Price verification failed" },
            { status: 400 }
          );
        }
      }
    }

    const result = await saveOrder(order, event.id);
    console.log("   saveOrder result:", result);
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    console.log(`[Webhook] Refund processed: ${charge.id} for ${charge.amount} ${charge.currency}`);
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    console.warn(`[Webhook] Payment failed: ${paymentIntent.id} — ${paymentIntent.last_payment_error?.message ?? "unknown"}`);
  }

  return NextResponse.json({ received: true });
}