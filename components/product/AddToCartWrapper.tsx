"use client";

import { useState } from "react";
import type { Product, Variant } from "@/types";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistButton } from "./WishlistButton";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { SizeSelector } from "./SizeSelector";

interface Props {
  product: Product;
  firstVariant: Variant;
  hasDiscount: boolean;
}

export function AddToCartWrapper({ product, firstVariant, hasDiscount }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(firstVariant);
  const addItem = useCartStore((s) => s.addItem);

  const currentPrice = hasDiscount
    ? selectedVariant.price * (1 - product.discount_percent / 100)
    : selectedVariant.price;

  const handleAddToCart = () => {
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0],
      size_ml: selectedVariant.size_ml,
      price: currentPrice,
      quantity: 1,
    });
    toast.success(`${product.name} añadido a tu carrito`);
  };

  return (
    <div className="space-y-4">
      <SizeSelector
        variants={product.variants}
        selectedVariant={selectedVariant}
        onSelect={setSelectedVariant}
      />
      {/* Price display — reacts to size selection */}
      <div className="mt-4">
        {hasDiscount ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-gold-dark">
              {formatPrice(selectedVariant.price * (1 - product.discount_percent / 100))}
            </span>
            <span className="text-lg text-gray-mid line-through">
              {formatPrice(selectedVariant.price)}
            </span>
          </div>
        ) : (
          <span className="text-2xl font-semibold">{formatPrice(selectedVariant.price)}</span>
        )}
      </div>
      <div className="flex gap-4">
        <AddToCartButton
          item={{
            variantId: selectedVariant.id,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.images[0],
            size_ml: selectedVariant.size_ml,
            price: currentPrice,
            quantity: 1,
          }}
          disabled={selectedVariant.stock === 0}
          className="flex-1"
        />
        <WishlistButton productId={product.id} />
      </div>
    </div>
  );
}
