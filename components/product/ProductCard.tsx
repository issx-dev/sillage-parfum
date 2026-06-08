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
  priority?: boolean;
}

const badgeLabels: Record<string, string> = {
  nuevo: "NUEVO",
  oferta: "OFERTA",
  top_ventas: "TOP VENTAS",
};

export function ProductCard({ product, variant = "default", priority = false }: ProductCardProps) {
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
        "group bg-white rounded-card overflow-hidden shadow-card transition-[transform,box-shadow] duration-300 hover-safe:shadow-gold hover-safe:scale-[1.03] flex flex-col no-underline",
        isLarge ? "flex flex-col" : "flex flex-col"
      )}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-gradient-to-br from-warm-100 to-warm-200 overflow-hidden">
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
        <div className="absolute inset-0 p-3 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-1 mix-blend-multiply [filter:drop-shadow(0_12px_20px_rgba(0,0,0,0.07))]"
            priority={priority || product.badge === "top_ventas" || product.badge === "nuevo"}
            loading={priority || product.badge === "top_ventas" || product.badge === "nuevo" ? undefined : "lazy"}
          />
        </div>

        {/* Floating Add to Cart Button */}
        <div className="absolute bottom-3 right-3 z-20">
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
            className="w-10 h-10 rounded-full bg-white hover:bg-black text-charcoal hover:text-cream shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-300 border border-warm-200/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Añadir al carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Family pill */}
        <span className="text-xs px-2 py-1 bg-gray-light text-charcoal rounded-full w-fit mb-2">
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

        {/* Price */}
        <div className="mt-auto pt-4 flex items-center gap-2">
          <span className="text-lg font-semibold">{formatPrice(currentPrice)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-mid line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
