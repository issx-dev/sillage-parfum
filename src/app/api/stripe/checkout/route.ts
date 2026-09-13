import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getVariant } from "@/lib/data";
import { applyDiscount } from "@/lib/utils";
import { normalizeCoupon } from "@/lib/coupons";
import { isCouponEligibleForEmail } from "@/lib/coupon-eligibility";
import { priceLines, type PricingLine } from "@/lib/pricing";
import type { CartItem } from "@/types";

const MAX_QUANTITY_PER_ITEM = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, couponCode: rawCoupon } = body as {
      items: CartItem[];
      customerEmail?: string;
      couponCode?: string;
    };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: "Too many items" }, { status: 413 });
    }

    // Cupón server-side: se valida aquí, nunca en el cliente.
    // Un código desconocido es 400 para que la UI muestre el error.
    // BIENVENIDA10 (firstOrderOnly) exige además primer pedido del email,
    // cuando el email se conoce (ver src/lib/coupon-eligibility.ts).
    const couponCode = rawCoupon ? normalizeCoupon(String(rawCoupon)) : null;
    if (couponCode) {
      const eligibility = await isCouponEligibleForEmail(couponCode, body.customerEmail);
      if (!eligibility.eligible) {
        return NextResponse.json({ error: eligibility.reason }, { status: 400 });
      }
    }

    // Server-side price resolution: never trust client-supplied prices.
    // El unitario parte de variant.price + discount_percent de DB y el
    // total aplica los bundles multi-compra — lo mismo que ve la UI
    // (cartStore.getDiscountedTotal). Ver src/lib/pricing.ts.
    const resolvedItems: Array<{
      productId: string;
      variantId: string;
      productName: string;
      brand: string;
      size_ml: number;
      sku: string;
      image?: string;
      quantity: number;
    }> = [];
    const pricingLines: PricingLine[] = [];
    for (const item of items) {
      const found = await getVariant(item.productId, item.variantId);
      if (!found) {
        return NextResponse.json(
          { error: "One or more variants were not found" },
          { status: 404 }
        );
      }
      const { product, variant } = found;
      const quantity = Math.min(
        Math.max(1, Math.floor(Number(item.quantity) || 1)),
        MAX_QUANTITY_PER_ITEM
      );
      const unitPrice = applyDiscount(variant.price, product.discount_percent);
      resolvedItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        brand: product.brand,
        size_ml: variant.size_ml,
        sku: variant.sku,
        ...(product.images?.[0] ? { image: product.images[0] } : {}),
        quantity,
      });
      pricingLines.push({
        variantId: variant.id,
        sizeMl: variant.size_ml,
        unitPrice,
        quantity,
      });
    }

    const priced = priceLines(pricingLines, couponCode);
    const byVariant = new Map(resolvedItems.map((i) => [i.variantId, i]));

    const ALLOWED_ORIGINS = new Set<string>([
      process.env.NEXT_PUBLIC_BASE_URL,
      "https://sillage.com",
      "https://www.sillage.com",
    ].filter(Boolean) as string[]);
    if (process.env.NODE_ENV !== "production") {
      ALLOWED_ORIGINS.add("http://localhost:3000");
    }
    const origin = request.headers.get("origin");
    const baseUrl = (origin && ALLOWED_ORIGINS.has(origin))
      ? origin
      : (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Se mantiene para códigos creados en el dashboard de Stripe; el
      // webhook los tolera verificando total_details.amount_discount del
      // evento firmado. SILLAGE2 no necesita Stripe: va bakeado en líneas.
      allow_promotion_codes: true,
      line_items: priced.chargeLines.map((line) => {
        const item = byVariant.get(line.variantId)!;
        let imageUrl = item.image;
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = `${cleanBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
        }

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${item.productName} - ${item.size_ml}ml`,
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
            unit_amount: line.unitAmountCents,
          },
          quantity: line.quantity,
        };
      }),
      success_url: `${cleanBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cleanBaseUrl}/carrito`,
      shipping_address_collection: {
        allowed_countries: ["ES"],
      },
      metadata: {
        items: JSON.stringify(
          resolvedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            quantity: i.quantity,
          }))
        ),
        // El webhook re-deriva el total esperado con este cupón; sin él,
        // un total con descuento se rechazaría como manipulación.
        ...(priced.appliedCoupon ? { couponCode: priced.appliedCoupon } : {}),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
