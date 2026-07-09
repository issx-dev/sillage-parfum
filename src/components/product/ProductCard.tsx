"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, X } from "lucide-react";
import type { Product, Variant } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";
import { cn, formatPrice, applyDiscount } from "@/lib/utils";

export type ProductCardVariant = "default" | "carousel";
export type CardTheme = "light" | "dark";

interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  theme?: CardTheme;
  priority?: boolean;
  /** When false, only discount badges are shown — status badges like NUEVO/TOP VENTAS are hidden. Defaults to true. */
  showStatusBadges?: boolean;
}

const badgeLabels: Record<string, string> = {
  nuevo: "NUEVO",
  oferta: "OFERTA",
  top_ventas: "TOP VENTAS",
};

export function ProductCard({
  product,
  variant = "default",
  theme = "light",
  priority = false,
  showStatusBadges = true,
}: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    product.variants.find((v) => v.stock > 0) ?? product.variants[0]!
  );
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeWishlist = mounted && isWishlisted;

  // Default variant: first in-stock, or first if none
  const defaultVariant = product.variants.find((v) => v.stock > 0) ?? product.variants[0]!;

  // Case detection
  const allSoldOut = product.variants.every((v) => v.stock === 0);
  const hasMultipleVariants = product.variants.length > 1;

  // Cart handler (reusable across cases)
  const handleAddToCart = (v: Variant) => {
    addItem({
      variantId: v.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? "",
      size_ml: v.size_ml,
      price: applyDiscount(v.price, product.discount_percent),
      quantity: 1,
    });
    openCart();
    toast.success(`${product.name} (${v.size_ml}ml) añadido al carrito`);
  };

  const isCarousel = variant === "carousel";
  const isDark = theme === "dark";
  const hasDiscount = product.discount_percent > 0;

  // In carousel mode, showStatusBadges controls whether status badges appear.
  // In default mode, all badges are always shown.
  const statusBadge = hasDiscount || !showStatusBadges
    ? null
    : badgeLabels[product.badge || ""] || null;
  const badgeLabel = hasDiscount
    ? `OFERTA -${product.discount_percent}%`
    : isCarousel
      ? statusBadge
      : badgeLabels[product.badge || ""] || null;

  const currentPrice = applyDiscount(selectedVariant.price, product.discount_percent);

  const originalPrice = hasDiscount ? selectedVariant.price : null;

  // Theme-dependent class tokens (used in carousel variant)
  const cardBg = isDark ? "bg-warm-900/30 border border-warm-800/50" : "bg-white";
  const cardHover = isDark ? "hover:border-gold/30" : "hover-safe:shadow-gold";
  const brandColor = isDark ? "text-warm-500" : "text-gray-mid";
  const brandSpacing = isCarousel ? "mb-1" : "mt-1";
  const nameColor = isDark ? "text-warm-50" : "";
  const descColor = isDark ? "text-warm-400/80" : "text-charcoal/70";
  const priceColor = isDark ? "text-warm-50" : "";
  const strikethroughColor = isDark ? "text-warm-500" : "text-gray-mid";
  const contentDivider = isDark ? "border-t border-warm-800/50" : "";

  return (
    <div
      className={cn(
        "group rounded-card overflow-hidden transition-[transform,box-shadow] duration-300 flex flex-col relative",
        // Card background & shadow
        isCarousel
          ? cn(cardBg, "hover:scale-[1.03]", cardHover)
          : "bg-white shadow-card hover-safe:shadow-gold hover-safe:scale-[1.03]",
      )}
    >
      {/* Image container */}
      <div className={cn(
        "relative aspect-square overflow-hidden",
        isDark ? "" : "bg-warm-50/40",
      )}>
        {/* Sibling Link to PDP covering the image container */}
        <Link
          href={`/productos/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`Ver detalles de ${product.name}`}
        />

        {badgeLabel && (
          <span className="absolute top-3 left-3 z-10 text-[10px] font-sans tracking-[0.15em] uppercase text-gold border border-gold/30 px-2 py-0.5 bg-cream/90 pointer-events-none">
            {badgeLabel}
          </span>
        )}
        {/* WishlistButton sitting above image — hover-visible on desktop, always on mobile, WCAG focus */}
        {!isCarousel && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            aria-label={activeWishlist ? "Quitar de favoritos" : "Añadir a favoritos"}
            className={cn(
              "absolute top-4 right-4 z-20 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-cream/80 backdrop-blur-sm border border-warm-200/30 shadow-xs hover:scale-110 active:scale-95",
              "md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100",
              "transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-300 cursor-pointer"
            )}
          >
            <Heart className={cn("w-5 h-5 transition-colors duration-200", activeWishlist ? "fill-gold-dark text-gold-dark" : "text-gray-mid")} />
          </button>
        )}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out pointer-events-none",
          isCarousel ? "p-6 group-hover:scale-[1.05]" : "p-3 group-hover:scale-[1.04]",
        )}>
          <Image
            src={product.images[0] ?? "/images/og-default.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-contain",
              isCarousel ? "p-4" : "p-1 mix-blend-multiply [filter:drop-shadow(0_12px_20px_rgba(0,0,0,0.07))]",
            )}
            priority={priority || product.badge === "top_ventas" || product.badge === "nuevo"}
            loading={priority || product.badge === "top_ventas" || product.badge === "nuevo" ? undefined : "lazy"}
          />
        </div>

        {/* Floating Add to Cart Button (Shopping Bag) */}
        {!isCarousel && !allSoldOut && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hasMultipleVariants) {
                  setShowSizeSelector(true);
                } else {
                  handleAddToCart(selectedVariant);
                }
              }}
              aria-label="Añadir al carrito"
              className={cn(
                "w-11 h-11 rounded-full bg-white text-charcoal shadow-md border border-warm-200/50 flex items-center justify-center transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-300 cursor-pointer active:scale-95 hover:bg-black hover:text-cream",
                "md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100"
              )}
            >
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Out of Stock Overlay / Badge */}
        {!isCarousel && allSoldOut && (
          <div className="absolute bottom-4 right-4 z-20 bg-warm-200 text-warm-500 text-[9px] font-sans uppercase tracking-widest px-2.5 py-1.5 rounded-sm border border-warm-300 cursor-not-allowed select-none">
            Agotado
          </div>
        )}

        {/* Size Selection Drawer Panel Overlay */}
        {!isCarousel && hasMultipleVariants && (
          <div className={cn(
            "absolute inset-x-0 bottom-0 z-30 bg-white border-t border-warm-200/60 p-4 transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-300 ease-out flex flex-col justify-center items-center rounded-b-card",
            showSizeSelector ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none invisible"
          )}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSizeSelector(false);
              }}
              className="absolute top-2 right-2 text-warm-500 hover:text-warm-900 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
              aria-label="Cerrar selector de tamaños"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-[10px] tracking-[0.2em] uppercase text-gold-dark mb-2.5 font-medium">Tamaño de frasco</p>
            <div className="flex gap-2 w-full justify-center">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    aria-label={isSelected ? `Confirmar ${v.size_ml}ml al carrito` : `Seleccionar ${v.size_ml}ml`}
                    onMouseEnter={() => setSelectedVariant(v)}
                    onMouseLeave={() => setSelectedVariant(defaultVariant)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (v.stock === 0) return;

                      if (isSelected) {
                        handleAddToCart(v);
                        setShowSizeSelector(false);
                      } else {
                        setSelectedVariant(v);
                      }
                    }}
                    className={cn(
                      "flex-1 max-w-[100px] h-11 border border-warm-200 bg-white text-charcoal text-[11px] uppercase tracking-wider flex items-center justify-center hover:border-gold hover:bg-warm-50 active:scale-95 transition-[background-color,color,border-color,box-shadow,opacity,transform] rounded-md cursor-pointer",
                      isSelected && "border-gold bg-warm-50 font-semibold",
                      v.stock === 0 && "opacity-30 cursor-not-allowed line-through hover:bg-transparent hover:text-charcoal"
                    )}
                  >
                    {v.size_ml}ml
                  </button>
                );
              })}
            </div>
            {/* Confirmation button — always visible, shows the currently selected variant */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(selectedVariant);
                setShowSizeSelector(false);
              }}
              className="mt-3 w-full h-10 bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-md flex items-center justify-center active:scale-[0.98] transition-transform cursor-pointer"
            >
              Añadir {selectedVariant.size_ml}ml al carrito
            </button>
          </div>
        )}
      </div>

      {/* Content — wraps product info in a second Link to satisfy a11y & visual PDP clicks */}
      <Link
        href={`/productos/${product.slug}`}
        className={cn("p-4 flex flex-col flex-1 no-underline", contentDivider)}
      >
        {/* Brand */}
        <p className={cn("text-xs uppercase tracking-wider", brandColor, brandSpacing)}>
          {product.brand}
        </p>
        {/* Name */}
        <h3 className={cn("font-serif text-lg", nameColor)}>
          {product.name}
        </h3>
        {/* Description */}
        {product.shortDescription && (
          <p className={cn("text-xs font-light mt-1 line-clamp-1", descColor)}>
            {product.shortDescription}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-4 flex items-center gap-2">
          <span className={cn(
            isCarousel ? "text-base" : "text-lg",
            "font-semibold",
            priceColor,
          )}>
            {formatPrice(currentPrice)}
          </span>
          {originalPrice && (
            <span className={cn("text-sm line-through", strikethroughColor)}>
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
