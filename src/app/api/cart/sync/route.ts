import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getVariantsByIds } from "@/lib/data";
import { applyDiscount } from "@/lib/utils";
import type { CartSyncEntry } from "@/types";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 50;

/**
 * Cart sync: returns the authoritative price/stock/name for each variant in
 * the client's cart. The database is the single source of truth; the client
 * cart only remembers variant ids and quantities.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { variantIds?: unknown };
    const ids = Array.isArray(body.variantIds)
      ? Array.from(new Set(body.variantIds.filter((v): v is string => typeof v === "string")))
      : null;

    if (!ids) {
      return NextResponse.json({ error: "Invalid variantIds" }, { status: 400 });
    }
    if (ids.length > MAX_ITEMS) {
      return NextResponse.json({ error: "Too many items" }, { status: 413 });
    }

    const found = await getVariantsByIds(ids);
    const entries: CartSyncEntry[] = ids.map((variantId) => {
      const hit = found.get(variantId);
      if (!hit) return { variantId, available: false };
      const { product, variant } = hit;
      return {
        variantId,
        available: true,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.images[0] ?? "",
        size_ml: variant.size_ml,
        price: applyDiscount(variant.price, product.discount_percent),
        stock: variant.stock,
      };
    });

    return NextResponse.json({ items: entries }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}
