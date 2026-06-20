"use client";

import { useState } from "react";
import type { Product, Variant } from "@/types";
import { AddToCartButton } from "./AddToCartButton";
import { formatPrice, applyDiscount } from "@/lib/utils";
import { SizeSelector } from "./SizeSelector";
import { WishlistButton } from "@/components/product/WishlistButton";

interface Props {
  product: Product;
  firstVariant: Variant;
  hasDiscount: boolean;
}

export function AddToCartWrapper({ product, firstVariant, hasDiscount }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(firstVariant);

  const currentPrice = applyDiscount(selectedVariant.price, product.discount_percent);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.15em] text-gray-mid block mb-3 font-semibold">
          Tamaño
        </span>
        <SizeSelector
          variants={product.variants}
          selectedVariant={selectedVariant}
          onSelect={setSelectedVariant}
        />
      </div>

      {/* Elegant discount details helper (only visible if there is a discount) */}
      {hasDiscount && (
        <div className="text-xs text-gray-mid tracking-wide pt-1">
          Precio original: <span className="line-through">{formatPrice(selectedVariant.price)}</span>{" "}
          <span className="text-terracotta font-medium ml-1.5">
            (-{product.discount_percent}%)
          </span>
        </div>
      )}

      <div className="pt-2 flex items-center gap-3">
        <AddToCartButton
          item={{
            variantId: selectedVariant.id,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.images[0] ?? "",
            size_ml: selectedVariant.size_ml,
            price: currentPrice,
            quantity: 1,
          }}
          disabled={selectedVariant.stock === 0}
          className="w-full h-12 text-xs uppercase tracking-widest font-semibold"
        >
          Añadir al carrito — {formatPrice(currentPrice)}
        </AddToCartButton>
        <WishlistButton
          productId={product.id}
          className="w-11 h-11 rounded-full border border-charcoal/30 text-charcoal hover:text-gold hover:border-gold transition-colors"
        />
      </div>
    </div>
  );
}
