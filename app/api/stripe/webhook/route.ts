import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { saveOrder } from "@/lib/data/orders";
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
      process.env.STRIPE_WEBHOOK_SECRET!
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
    const order: Order = {
      id: session.id,
      items: [],
      total: session.amount_total ?? 0,
      status: "paid",
      customerEmail: session.customer_details?.email ?? session.customer_email ?? undefined,
      createdAt: new Date().toISOString(),
      stripe_event_id: event.id,
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

    const result = await saveOrder(order, undefined, event.id);
    console.log("   saveOrder result:", result);
  }

  return NextResponse.json({ received: true });
}
