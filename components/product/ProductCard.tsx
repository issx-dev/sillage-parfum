"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
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
      <div className="relative aspect-square bg-warm-50/40 overflow-hidden">
        {badgeLabel && (
          <span className="absolute top-3 left-3 z-10 text-[10px] font-sans tracking-[0.15em] uppercase text-gold border border-gold/30 px-2 py-0.5 bg-cream/90">
            {badgeLabel}
          </span>
        )}
        {/* WishlistButton — hover-visible on desktop, always visible on mobile, WCAG focus */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={activeWishlist ? "Quitar de favoritos" : "Añadir a favoritos"}
          className={cn(
            "absolute top-3 right-3 z-20 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center",
            "md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100",
            "transition-opacity duration-300"
          )}
        >
          <Heart className={cn("w-5 h-5", activeWishlist ? "fill-gold text-gold" : "text-cream")} />
        </button>
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

        {/* Buy bar — slides up on hover (desktop), always visible (mobile) */}
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
          aria-label="Añadir al carrito"
          className={cn(
            "w-full h-12 md:h-10 bg-black text-cream text-[10px] font-sans uppercase tracking-widest text-center",
            "flex items-center justify-center gap-2",
            "absolute bottom-0 left-0 right-0 z-20",
            "md:translate-y-full md:group-hover:translate-y-0",
            "focus:translate-y-0 focus-within:translate-y-0",
            "transition-transform duration-300 ease-out",
            "max-md:translate-y-0 max-md:relative",
            selectedVariant.stock === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Añadir al carrito
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name + Brand */}
        <h3 className={cn("font-serif", isLarge ? "text-xl" : "text-lg")}>
          {product.name}
        </h3>
        <p className="text-xs uppercase tracking-wider text-gray-mid mt-1">
          {product.brand}
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
