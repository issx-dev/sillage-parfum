"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, X, Eye } from "lucide-react";
import type { Product, Variant } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";
import { cn, formatPrice, applyDiscount } from "@/lib/utils";

export type ProductCardVariant = "default" | "carousel" | "recommendation";
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
  const [addedQty, setAddedQty] = useState<number | null>(null);
  const [addedOverlay, setAddedOverlay] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeWishlist = mounted && isWishlisted;

  // Case detection
  const allSoldOut = product.variants.every((v) => v.stock === 0);
  const hasMultipleVariants = product.variants.length > 1;

  // Cart handler with Chogan fluid overlay animation
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
      inspiration: product.inspiration,
      officialCode: product.officialCode,
    });
    setAddedOverlay(true);
    setTimeout(() => {
      setAddedOverlay(false);
    }, 1200);
    openCart();
    toast.success(`${product.name} (${v.size_ml}ml) añadido al carrito`);
  };

  // Multi-buy handler with fluid overlay animation
  const handleAddMulti = (qty: number) => {
    const unitP = applyDiscount(selectedVariant.price, product.discount_percent);
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? "",
      size_ml: selectedVariant.size_ml,
      price: unitP,
      quantity: qty,
      inspiration: product.inspiration,
      officialCode: product.officialCode,
    });
    setAddedQty(qty);
    setAddedOverlay(true);
    setTimeout(() => {
      setAddedQty(null);
      setAddedOverlay(false);
      openCart();
      setShowSizeSelector(false);
      toast.success(`${qty}x ${product.name} (${selectedVariant.size_ml}ml) añadido`);
    }, 1200);
  };

  const isCarousel = variant === "carousel";
  const isRecommendation = variant === "recommendation";
  const isDark = theme === "dark";
  const hasDiscount = product.discount_percent > 0;

  const statusBadge = hasDiscount || !showStatusBadges
    ? null
    : badgeLabels[product.badge || ""] || null;
  const badgeLabel = hasDiscount
    ? `OFERTA -${product.discount_percent}%`
    : (isCarousel || isRecommendation)
      ? statusBadge
      : badgeLabels[product.badge || ""] || null;

  const currentPrice = applyDiscount(selectedVariant.price, product.discount_percent);

  // Multi-buy pricing
  const isEligibleMultibuy = selectedVariant.size_ml === 70 && Math.round(currentPrice) === 35;
  const pack2Price = isEligibleMultibuy ? 63 : currentPrice * 2;
  const pack3Price = isEligibleMultibuy ? 84 : currentPrice * 3;
  const pack2Saving = Math.max(0, Math.round(((currentPrice * 2) - pack2Price) * 100) / 100);
  const pack3Saving = Math.max(0, Math.round(((currentPrice * 3) - pack3Price) * 100) / 100);

  const originalPrice = hasDiscount ? selectedVariant.price : null;

  const cardBg = isDark ? "bg-warm-900/30 border border-warm-800/50" : "bg-white";
  const cardHover = isDark ? "hover:border-gold/30" : "hover-safe:shadow-gold";
  const nameColor = isDark ? "text-warm-50" : "";
  const descColor = isDark ? "text-warm-400/80" : "text-charcoal/70";
  const priceColor = isDark ? "text-warm-50" : "";
  const strikethroughColor = isDark ? "text-warm-500" : "text-gray-mid";
  const contentDivider = isDark ? "border-t border-warm-800/50" : "";

  return (
    <div
      className={cn(
        "group rounded-card overflow-hidden transition-[transform,box-shadow] duration-300 flex flex-col relative",
        isCarousel || isRecommendation
          ? cn(cardBg, "hover:scale-[1.03]", cardHover)
          : "bg-white shadow-card hover-safe:shadow-gold hover-safe:scale-[1.03]",
      )}
    >
      {/* Chogan Fluid "¡Añadido!" Overlay Animation */}
      {addedOverlay && (
        <div className="absolute inset-0 z-50 bg-[#E8E6FF] flex items-center justify-center transition-all duration-300 ease-out animate-in fade-in zoom-in-95 rounded-card backdrop-blur-xs">
          <span className="font-sans font-bold text-base text-charcoal tracking-wide">
            ¡Añadido!
          </span>
        </div>
      )}

      {/* Image container with 4K Studio Photography */}
      <div className="relative aspect-square overflow-hidden select-none bg-warm-100/50">
        {/* Link covering the image */}
        <Link
          href={`/productos/${product.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`Ver detalles de ${product.name}`}
        />

        {badgeLabel && (
          <span className="absolute top-3 left-3 z-10 text-[10px] font-sans tracking-[0.15em] uppercase text-gold border border-gold/30 px-2 py-0.5 bg-cream/95 pointer-events-none">
            {badgeLabel}
          </span>
        )}

        {/* Wishlist Button */}
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

        {/* 4K AI Studio Product Photography */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 group-hover:scale-[1.04] transition-transform duration-500 ease-out overflow-hidden">
          <Image
            src={product.images[0] ?? "/images/og-default.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            priority={priority || product.badge === "top_ventas" || product.badge === "nuevo"}
            loading={priority || product.badge === "top_ventas" || product.badge === "nuevo" ? undefined : "lazy"}
          />
        </div>

        {/* Floating Add to Cart Button (Shopping Bag) — used in Default / Landing mode */}
        {!isRecommendation && !allSoldOut && (
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

        {/* Out of Stock Badge */}
        {allSoldOut && (
          <div className="absolute bottom-4 right-4 z-20 bg-warm-200 text-warm-500 text-[9px] font-sans uppercase tracking-widest px-2.5 py-1.5 rounded-sm border border-warm-300 cursor-not-allowed select-none">
            Agotado
          </div>
        )}

        {/* Size Selector Drawer Overlay */}
        {hasMultipleVariants && (
          <div className={cn(
            "absolute inset-x-0 top-0 bottom-0 z-30 bg-white/95 text-charcoal p-4 transition-all duration-300 ease-out flex flex-col justify-center items-center backdrop-blur-md overflow-y-auto border-b border-warm-200",
            showSizeSelector ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none invisible"
          )}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSizeSelector(false);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-charcoal p-1 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
              aria-label="Cerrar selector de tamaños"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] tracking-[0.2em] uppercase text-gold-dark font-bold mb-3">
              Selecciona Tamaño & Oferta
            </span>

            {/* Size Selector Buttons */}
            <div className="flex gap-2 w-full justify-center mb-3">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    aria-label={isSelected ? `Confirmar ${v.size_ml}ml` : `Seleccionar ${v.size_ml}ml`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (v.stock === 0) return;
                      setSelectedVariant(v);
                    }}
                    className={cn(
                      "flex-1 py-1.5 px-2 border rounded text-[11px] font-sans tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      isSelected
                        ? "border-charcoal text-charcoal font-bold bg-warm-100/80"
                        : "border-warm-200 text-gray-mid hover:border-gray-400 bg-white",
                      v.stock === 0 && "opacity-30 cursor-not-allowed line-through"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-gold-dark" : "bg-gray-300")} />
                    {v.size_ml}ml
                  </button>
                );
              })}
            </div>

            {/* Multi-buy Quantity Offer Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                disabled={addedQty !== null}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddMulti(2); }}
                className={cn(
                  "w-full py-2.5 px-3 border rounded text-left flex items-center justify-between transition-all duration-200 cursor-pointer relative",
                  addedQty === 2
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-emerald-600/40 bg-emerald-50/30 hover:border-emerald-600 hover:bg-emerald-50/70"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal">2 Perfumes ({selectedVariant.size_ml}ml)</span>
                  {pack2Saving > 0 && (
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Popular</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {addedQty === 2 ? (
                    <span className="text-xs text-emerald-700 font-bold">¡Añadido!</span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-charcoal">{formatPrice(pack2Price)}</span>
                      {pack2Saving > 0 && <span className="text-[9px] text-emerald-700 font-medium">-{formatPrice(pack2Saving)}</span>}
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                disabled={addedQty !== null}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddMulti(3); }}
                className={cn(
                  "w-full py-2.5 px-3 border rounded text-left flex items-center justify-between transition-all duration-200 cursor-pointer",
                  addedQty === 3
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-warm-200 bg-white hover:border-warm-300 hover:bg-warm-50/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  <span className="text-xs font-medium text-charcoal">3 Perfumes ({selectedVariant.size_ml}ml)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {addedQty === 3 ? (
                    <span className="text-xs text-emerald-700 font-bold">¡Añadido!</span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-charcoal">{formatPrice(pack3Price)}</span>
                      {pack3Saving > 0 && <span className="text-[9px] text-emerald-700 font-medium">-{formatPrice(pack3Saving)}</span>}
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                disabled={addedQty !== null}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddMulti(1); }}
                className={cn(
                  "w-full py-2 px-3 border rounded text-left flex items-center justify-between transition-all duration-200 cursor-pointer",
                  addedQty === 1
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-warm-200 bg-white hover:border-warm-300 hover:bg-warm-50/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  <span className="text-xs text-gray-600">1 Perfume ({selectedVariant.size_ml}ml)</span>
                </div>
                {addedQty === 1 ? (
                  <span className="text-xs text-emerald-700 font-bold">¡Añadido!</span>
                ) : (
                  <span className="text-xs text-charcoal font-medium">{formatPrice(currentPrice)}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-4 flex flex-col flex-1", contentDivider)}>
        {/* Inspiration & Quick View Eye Row */}
        {isRecommendation ? (
          <div className="flex items-center justify-between gap-1 mb-1.5">
            {product.inspiration ? (
              <span className="text-[10px] font-sans tracking-tight text-gold-dark font-medium bg-gold/5 border border-gold/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gold shrink-0" />
                Inspiración: {product.inspiration}
              </span>
            ) : (
              <div />
            )}
            <Link
              href={`/productos/${product.slug}`}
              className="p-1 text-gray-400 hover:text-charcoal transition-colors cursor-pointer shrink-0"
              aria-label={`Ver detalles de ${product.name}`}
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Default Landing & Catalog Inspiration Tag */
          product.inspiration && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-sans tracking-tight text-gold-dark font-medium bg-gold/5 border border-gold/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gold shrink-0" />
                Inspiración: {product.inspiration}
              </span>
            </div>
          )
        )}

        {/* Name (Official Chogan Title) */}
        <h3 className={cn("font-serif text-base sm:text-lg font-medium leading-snug", nameColor)}>
          <Link href={`/productos/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {/* Description / Size line */}
        {isRecommendation ? (
          <p className={cn("text-xs font-light mt-1 opacity-90", descColor)}>
            {selectedVariant.size_ml} ml
          </p>
        ) : (
          product.shortDescription && (
            <p className={cn("text-xs font-light mt-1 line-clamp-1 opacity-90", descColor)}>
              {product.shortDescription}
            </p>
          )
        )}

        {/* Price */}
        <div className="mt-auto pt-2.5 flex items-center gap-2">
          <span className={cn(
            isCarousel || isRecommendation ? "text-base" : "text-lg",
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

        {/* Chogan Inline Size Selector & Quick Add Row (Only in Recommendation mode on PDP) */}
        {isRecommendation && !allSoldOut && (
          <div className="mt-3 pt-2.5 border-t border-warm-200/50 flex items-center justify-between gap-2">
            {/* Sizes List with Active Dot Indicator */}
            <div className="flex items-center gap-2 text-xs font-sans">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    type="button"
                    aria-label={isSelected ? `Tamaño actual ${v.size_ml}ml` : `Cambiar a ${v.size_ml}ml`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (v.stock === 0) return;
                      setSelectedVariant(v);
                    }}
                    className={cn(
                      "flex flex-col items-center cursor-pointer transition-colors px-1 py-0.5",
                      isSelected ? "font-bold text-charcoal" : "text-gray-mid hover:text-charcoal",
                      v.stock === 0 && "opacity-40 cursor-not-allowed line-through"
                    )}
                  >
                    <span>{v.size_ml} ml</span>
                    <span className={cn("w-1 h-1 rounded-full mt-0.5 transition-all", isSelected ? "bg-charcoal scale-100" : "bg-transparent scale-0")} />
                  </button>
                );
              })}
            </div>

            {/* Quick Add Square Icon Button [ 🛍️ ] */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart(selectedVariant);
              }}
              aria-label="Añadir al carrito"
              className="w-9 h-9 border border-warm-300 rounded hover:border-charcoal hover:bg-warm-100 flex items-center justify-center text-charcoal transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
