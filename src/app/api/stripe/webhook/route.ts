import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { saveOrder, markOrderRefundedByPaymentIntent } from "@/lib/data/orders";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { applyDiscount } from "@/lib/utils";
import { expectedTotalCents, type PricingLine } from "@/lib/pricing";
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
    const couponCode = session.metadata?.couponCode ?? undefined;
    const order: Omit<Order, "stripe_event_id"> = {
      id: session.id,
      items: [],
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      customerEmail:
        session.customer_details?.email ?? session.customer_email ?? undefined,
      createdAt: new Date().toISOString(),
      paymentMethod: "stripe",
      ...(couponCode ? { couponCode } : {}),
      ...(typeof session.payment_intent === "string" && session.payment_intent
        ? { paymentIntent: session.payment_intent }
        : {}),
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

    // ─── Price integrity check (src/lib/pricing.ts) ───
    // El esperado se re-deriva desde DB con las MISMAS reglas con las que
    // el checkout cobró: discount_percent por producto + bundles
    // multi-compra + cupón server-side de metadata. Nunca se confía en el
    // total del cliente ni en amount_total a ciegas.
    //
    // Descuentos legítimos por DEBAJO del esperado se aceptan solo con
    // atestación de Stripe, no de la DB:
    //  a) cupón server-side (SILLAGE2): metadata.couponCode firmado por
    //     nuestro propio checkout — el esperado ya lo incluye;
    //  b) promotion codes 100% Stripe (allow_promotion_codes): el evento
    //     está firmado por Stripe, así que `total_details.amount_discount`
    //     ES la verificación contra Stripe: el descuento que Stripe dice
    //     haber aplicado debe cuadrar al céntimo con la diferencia.
    if (parsedItems.length > 0) {
      const variantIds = parsedItems
        .map((i) => i.variantId)
        .filter(Boolean);

      if (variantIds.length > 0) {
        const priceRows = (await query(
          `SELECT v.variant_id, v.price, v.size_ml, COALESCE(p.discount_percent, 0) AS discount_percent
           FROM variants v LEFT JOIN products p ON p.product_id = v.product_id
           WHERE v.variant_id = ANY($1)`,
          [variantIds]
        )) as Array<{
          variant_id: string;
          price: number | string;
          size_ml: number | string | null;
          discount_percent: number | string | null;
        }>;

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

        const qtyByVariant = new Map(
          parsedItems.map((i) => [i.variantId, Math.max(1, Math.floor(Number(i.quantity) || 1))])
        );
        const lines: PricingLine[] = priceRows.map((r) => {
          const price = Number(r.price ?? 0);
          const discount = Number(r.discount_percent ?? 0);
          return {
            variantId: r.variant_id,
            sizeMl: Number(r.size_ml ?? 0),
            unitPrice: applyDiscount(price, Number.isFinite(discount) ? discount : 0),
            quantity: qtyByVariant.get(r.variant_id) ?? 1,
          };
        });

        const expectedCents = await expectedTotalCents(lines, couponCode);
        const actualTotalCents = session.amount_total ?? 0;

        if (expectedCents !== actualTotalCents) {
          // Vía b): descuento Stripe atestiguado en el evento firmado.
          const stripeDiscount = session.total_details?.amount_discount ?? 0;
          const explained =
            stripeDiscount > 0 && expectedCents - actualTotalCents === stripeDiscount;

          if (!explained) {
            console.error(
              `[Webhook CRITICAL] Price mismatch: expected ${expectedCents} cents, got ${actualTotalCents} cents (stripe_discount=${stripeDiscount}, coupon=${couponCode ?? "none"})`
            );
            return NextResponse.json(
              { error: "Price verification failed" },
              { status: 400 }
            );
          }
          console.log(
            `[Webhook] Promotion-code discount accepted: expected ${expectedCents}, charged ${actualTotalCents}, stripe_discount=${stripeDiscount}`
          );
        }
      }
    }

    const result = await saveOrder(order, event.id);
    console.log("   saveOrder result:", result);
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    // Enlaza el refund con el pedido vía payment_intent guardado en
    // order_data por checkout.session.completed. Sin payment_intent no hay
    // enlace fiable: se confirma recepción sin tocar la DB.
    const pi =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : (charge.payment_intent as { id?: string } | null)?.id;
    if (pi) {
      const result = await markOrderRefundedByPaymentIntent(pi);
      console.log(
        `[Webhook] Refund processed: ${charge.id} for ${charge.amount} ${charge.currency} → order updated: ${result.updated}`
      );
    } else {
      console.log(
        `[Webhook] Refund received without payment_intent, nothing to link: ${charge.id}`
      );
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    console.warn(`[Webhook] Payment failed: ${paymentIntent.id} — ${paymentIntent.last_payment_error?.message ?? "unknown"}`);
  }

  return NextResponse.json({ received: true });
}
