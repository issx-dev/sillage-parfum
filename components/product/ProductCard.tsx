"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product, Variant } from "@/types";
import { SizeSelector } from "./SizeSelector";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistButton } from "./WishlistButton";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "large";
}

const badgeLabels: Record<string, string> = {
  nuevo: "NUEVO",
  oferta: "OFERTA",
  top_ventas: "TOP VENTAS",
};

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    product.variants.find((v) => v.stock > 0) || product.variants[0]
  );
  const addItem = useCartStore((s) => s.addItem);

  const isLarge = variant === "large";
  const hasDiscount = product.discount_percent > 0;
  const badgeLabel = hasDiscount
    ? `OFERTA -${product.discount_percent}%`
    : badgeLabels[product.badge || ""] || null;

  const currentPrice = hasDiscount
    ? selectedVariant.price * (1 - product.discount_percent / 100)
    : selectedVariant.price;

  const originalPrice = hasDiscount ? selectedVariant.price : null;

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
    <div
      className={cn(
        "group bg-white rounded-card overflow-hidden shadow-card transition-[transform,box-shadow,opacity] duration-300 hover:shadow-gold hover:scale-[1.03] relative",
        isLarge ? "flex flex-col" : "flex flex-col"
      )}
    >
      {/* Clickable card overlay — covers entire card except interactive elements */}
      <Link
        href={`/productos/${product.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Ver ${product.name}`}
      />

      {/* Image container */}
      <div className="relative aspect-square bg-gradient-to-br from-[#F5F2EB] to-[#EAE5D9] overflow-hidden">
        {badgeLabel && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-gold text-[10px] font-semibold text-black z-10 tracking-[0.1em] uppercase rounded-sm shadow-sm">
            {badgeLabel}
          </span>
        )}
        {/* WishlistButton sits above the overlay link — stopPropagation prevents card navigation */}
        <div className="relative z-20">
          <WishlistButton
            productId={product.id}
            className="absolute top-3 right-3"
          />
        </div>
        <div className="absolute inset-0 p-8 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.05] z-10">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 mix-blend-multiply"
            priority={product.badge === "top_ventas" || product.badge === "nuevo"}
            loading={product.badge === "top_ventas" || product.badge === "nuevo" ? undefined : "lazy"}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 relative z-10">
        {/* Family pill */}
        <span className="text-xs px-2 py-1 bg-gray-light text-gray-mid rounded-full w-fit mb-2">
          {product.family}
        </span>

        {/* Name + Brand */}
        <h3 className={cn("font-serif", isLarge ? "text-xl" : "text-lg")}>
          {product.name}
        </h3>
        <p className="text-xs uppercase tracking-wider text-gray-mid mt-1">
          {product.brand}
        </p>

        {/* Short description */}
        <p className="text-sm text-gray-mid mt-2 line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Size selector */}
        <div className="mt-4">
          <SizeSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelect={setSelectedVariant}
          />
        </div>

        {/* Price */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-lg font-semibold">{formatPrice(currentPrice)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-mid line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <div className="mt-4">
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
          />
        </div>
      </div>
    </div>
  );
}
