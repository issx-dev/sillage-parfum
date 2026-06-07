import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getVariant } from "@/lib/data";
import type { CartItem } from "@/types";

const MAX_QUANTITY_PER_ITEM = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: CartItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      );
    }

    // Server-side price resolution: never trust client-supplied prices.
    const resolvedItems: Array<{
      productId: string;
      variantId: string;
      productName: string;
      brand: string;
      size_ml: number;
      price: number;
      sku: string;
      image: string;
      quantity: number;
    }> = [];
    for (const item of items) {
      const found = getVariant(item.productId, item.variantId);
      if (!found) {
        return NextResponse.json(
          { error: "One or more variants were not found" },
          { status: 404 }
        );
      }
      const { product, variant } = found;
      resolvedItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        brand: product.brand,
        size_ml: variant.size_ml,
        price: variant.price,
        sku: variant.sku,
        image: product.images?.[0] ?? item.image,
        quantity: Math.min(
          Math.max(1, Math.floor(Number(item.quantity) || 1)),
          MAX_QUANTITY_PER_ITEM
        ),
      });
    }

    const origin = request.headers.get("origin");
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
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

