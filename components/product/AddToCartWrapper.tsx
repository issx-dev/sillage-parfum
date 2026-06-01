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
