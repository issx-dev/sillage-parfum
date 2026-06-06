import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { CartItem } from "@/types";

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

    const origin = request.headers.get("origin");
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => {
        // Stripe requires absolute URLs for product images
        let imageUrl = item.image;
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = `${cleanBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
        }

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${item.name} - ${item.size_ml}ml`,
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
        items: JSON.stringify(items),
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

