import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getVariant } from "@/lib/data";
import { getUnitPriceCents, getShippingCents } from "@/lib/utils";
import type { CartItem } from "@/types";

const MAX_QUANTITY_PER_ITEM = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: CartItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: "Too many items" }, { status: 413 });
    }

    // Server-side price resolution: never trust client-supplied prices.
    const resolvedItems: Array<{
      productId: string;
      variantId: string;
      productName: string;
      brand: string;
      size_ml: number;
      unitAmountCents: number;
      sku: string;
      image?: string;
      quantity: number;
    }> = [];
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
      if (variant.stock < quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name} (${variant.size_ml}ml)` },
          { status: 409 }
        );
      }
      resolvedItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        brand: product.brand,
        size_ml: variant.size_ml,
        unitAmountCents: getUnitPriceCents(variant.price, product.discount_percent),
        sku: variant.sku,
        ...(product.images?.[0] ? { image: product.images[0] } : {}),
        quantity,
      });
    }

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

    const subtotalCents = resolvedItems.reduce(
      (sum, i) => sum + i.unitAmountCents * i.quantity,
      0
    );
    const shippingCents = getShippingCents(subtotalCents);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: resolvedItems.map((item) => {
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
            unit_amount: item.unitAmountCents,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${cleanBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cleanBaseUrl}/carrito`,
      shipping_address_collection: {
        allowed_countries: ["ES"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCents, currency: "eur" },
            display_name:
              shippingCents === 0 ? "Envío gratis (península)" : "Envío estándar (península)",
          },
        },
      ],
      metadata: {
        items: JSON.stringify(
          resolvedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            quantity: i.quantity,
          }))
        ),
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

