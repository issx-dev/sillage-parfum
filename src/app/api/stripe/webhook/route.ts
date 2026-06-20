import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { saveOrder } from "@/lib/data/orders";
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
    console.log("✅ Pedido completado:", session.id);
    console.log("   Total:", session.amount_total);
    console.log("   Items:", session.metadata?.items);

    const metadataItems = session.metadata?.items;
    const order: Omit<Order, "stripe_event_id"> = {
      id: session.id,
      items: [],
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      customerEmail: session.customer_details?.email ?? session.customer_email ?? undefined,
      createdAt: new Date().toISOString(),
    };
    if (metadataItems) {
      try {
        const parsed = JSON.parse(metadataItems);
        if (Array.isArray(parsed)) {
          order.items = parsed as Order["items"];
        }
      } catch (err) {
        console.error("Webhook: failed to parse session.metadata.items:", err);
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
