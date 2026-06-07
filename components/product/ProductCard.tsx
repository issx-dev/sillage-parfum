"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { Product, Variant } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
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
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeWishlist = mounted && isWishlisted;

  const isLarge = variant === "large";
  const hasDiscount = product.discount_percent > 0;
  const badgeLabel = hasDiscount
    ? `OFERTA -${product.discount_percent}%`
    : badgeLabels[product.badge || ""] || null;

  const currentPrice = hasDiscount
    ? selectedVariant.price * (1 - product.discount_percent / 100)
    : selectedVariant.price;

  const originalPrice = hasDiscount ? selectedVariant.price : null;

  return (
    <Link
      href={`/productos/${product.slug}`}
      className={cn(
        "group bg-white rounded-card overflow-hidden shadow-card transition-[transform,box-shadow] duration-300 hover:shadow-gold hover:scale-[1.03] flex flex-col no-underline",
        isLarge ? "flex flex-col" : "flex flex-col"
      )}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-gradient-to-br from-[#F5F2EB] to-[#EAE5D9] overflow-hidden">
        {badgeLabel && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-gold text-[10px] font-semibold text-black z-10 tracking-[0.1em] uppercase rounded-sm shadow-sm">
            {badgeLabel}
          </span>
        )}
        {/* WishlistButton sits above — stopPropagation prevents card navigation */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="p-2 min-w-[44px] min-h-[44px] rounded-full bg-cream/80 backdrop-blur-sm flex items-center justify-center transition-[transform,opacity] duration-200 hover:scale-110"
            aria-label={activeWishlist ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-[color,transform] duration-200",
                activeWishlist ? "fill-gold-dark text-gold-dark" : "text-gray-mid"
              )}
            />
          </button>
        </div>
        <div className="absolute inset-0 p-8 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.05]">
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
      <div className="p-4 flex flex-col flex-1">
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
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const isSelected = selectedVariant.id === v.id;
              const isDisabled = v.stock === 0;
              return (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isDisabled) setSelectedVariant(v);
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "px-3 py-1.5 text-sm border rounded transition-[background-color,color,border-color,transform] duration-200 min-w-[50px] min-h-[44px]",
                    isSelected
                      ? "border-gold bg-black text-cream"
                      : "border-gray-light text-gray-mid hover:border-gold",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  title={isDisabled ? "Agotado" : undefined}
                >
                  {v.size_ml}ml
                </button>
              );
            })}
          </div>
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
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedVariant.stock === 0) return;
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
              openCart();
              toast.success(`${product.name} añadido a tu carrito`);
            }}
            disabled={selectedVariant.stock === 0}
            className="w-full bg-black text-cream hover:bg-gray-mid font-medium py-3 px-6 rounded transition-colors min-h-[44px] active:scale-[0.97]"
          >
            {selectedVariant.stock === 0 ? "Agotado" : "Añadir al carrito"}
          </button>
        </div>
      </div>
    </Link>
  );
}
