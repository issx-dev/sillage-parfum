"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useCarouselState } from "@/hooks/useCarouselState";
import { Container } from "@/components/layout/Container";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export type CarouselVariant = "light" | "dark";

interface ProductCarouselProps {
  variant: CarouselVariant;
  products: Product[];
  /** Editorial eyebrow text (e.g. "selección sillage"). Required — no defaults. */
  eyebrow: string;
  /** Section title. Required — no defaults. */
  title: string;
  /** Section subtitle / supporting copy. Required — no defaults. */
  subtitle: string;
  /**
   * If true, shows status badges (NUEVO, TOP VENTAS, etc.) in addition to
   * the discount label. If false, only the discount label is rendered.
   * Defaults to true.
   */
  showStatusBadges?: boolean;
}

const STATUS_BADGE_LABELS: Record<string, string> = {
  nuevo: "NUEVO",
  oferta: "OFERTA",
  top_ventas: "TOP VENTAS",
};

/**
 * Variant-bound visual tokens. The component is intentionally a pure
 * presentation primitive — no copy defaults, no marketing strings.
 * All editorial text is passed in by the call site.
 */
const VARIANT_STYLES: Record<CarouselVariant, {
  sectionBg: string;
  eyebrowText: string;
  titleText: string;
  subtitleText: string;
  navBorder: string;
  navText: string;
  navBg: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  imageBg: string;
  contentDivider: string;
  priceText: string;
  progressBg: string;
}> = {
  light: {
    sectionBg: "bg-warm-50",
    eyebrowText: "text-gold",
    titleText: "text-warm-900",
    subtitleText: "text-warm-600",
    navBorder: "border-warm-300",
    navText: "text-warm-600",
    navBg: "bg-white",
    cardBg: "bg-white",
    cardBorder: "",
    cardHover: "hover:shadow-gold",
    imageBg: "bg-gradient-to-br from-warm-100 to-warm-200",
    contentDivider: "",
    priceText: "text-warm-900",
    progressBg: "bg-warm-200/60",
  },
  dark: {
    sectionBg: "bg-black",
    eyebrowText: "text-gold/80",
    titleText: "text-warm-50",
    subtitleText: "text-warm-400",
    navBorder: "border-warm-700",
    navText: "text-warm-400",
    navBg: "bg-white/5",
    cardBg: "bg-warm-900/30",
    cardBorder: "border border-warm-800/50",
    cardHover: "hover:border-gold/30",
    imageBg: "",
    contentDivider: "border-t border-warm-800/50",
    priceText: "text-warm-50",
    progressBg: "bg-warm-800/60",
  },
};

export function ProductCarousel({
  variant,
  products,
  eyebrow,
  title,
  subtitle,
  showStatusBadges = true,
}: ProductCarouselProps) {
  const styles = VARIANT_STYLES[variant];
  const {
    ref,
    isAtStart,
    isAtEnd,
    scrollProgress,
    isDragging,
    scroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
  } = useCarouselState<HTMLDivElement>();

  if (!products || products.length === 0) return null;

  return (
    <section className={cn("py-20 lg:py-28 overflow-hidden", styles.sectionBg)}>
      <Container>
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 lg:mb-16 gap-6">
            <div className="max-w-xl text-left">
              <span
                className={cn(
                  "text-[11px] uppercase tracking-[0.25em] font-semibold",
                  styles.eyebrowText
                )}
              >
                {eyebrow}
              </span>
              <h2
                className={cn(
                  "font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide mt-2",
                  styles.titleText
                )}
              >
                {title}
              </h2>
              <p
                className={cn(
                  "text-sm font-light mt-4 leading-relaxed max-w-[50ch]",
                  styles.subtitleText
                )}
              >
                {subtitle}
              </p>
            </div>

            <div className="flex gap-3 w-fit self-end sm:self-auto">
              <button
                onClick={() => scroll("left")}
                disabled={isAtStart}
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center transition-[color,border-color] duration-300 shadow-sm active:scale-95 min-w-[44px] min-h-[44px]",
                  styles.navBorder,
                  styles.navText,
                  styles.navBg,
                  isAtStart
                    ? "opacity-30 cursor-not-allowed pointer-events-none"
                    : "hover:text-gold hover:border-gold"
                )}
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.2]" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={isAtEnd}
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center transition-[color,border-color] duration-300 shadow-sm active:scale-95 min-w-[44px] min-h-[44px]",
                  styles.navBorder,
                  styles.navText,
                  styles.navBg,
                  isAtEnd
                    ? "opacity-30 cursor-not-allowed pointer-events-none"
                    : "hover:text-gold hover:border-gold"
                )}
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5 stroke-[1.2]" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger={50}>
          <div className="relative">
            <div
              ref={ref}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className={cn(
                "flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
            >
              {products.map((product) => {
                const hasDiscount = product.discount_percent > 0;
                const statusBadge = hasDiscount || !showStatusBadges
                  ? null
                  : STATUS_BADGE_LABELS[product.badge || ""] || null;
                const badgeLabel = hasDiscount
                  ? `OFERTA -${product.discount_percent}%`
                  : statusBadge;
                const primaryVariant =
                  product.variants.find((v) => v.stock > 0) || product.variants[0];
                const currentPrice = hasDiscount
                  ? primaryVariant.price * (1 - product.discount_percent / 100)
                  : primaryVariant.price;

                return (
                  <div
                    key={product.id}
                    className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start pointer-events-none"
                  >
                    <Link
                      href={`/productos/${product.slug}`}
                      className="block pointer-events-auto"
                    >
                      <div
                        className={cn(
                          "rounded-card overflow-hidden transition-[transform,box-shadow] duration-300 hover:scale-[1.03] group",
                          styles.cardBg,
                          styles.cardBorder,
                          styles.cardHover
                        )}
                      >
                        <div
                          className={cn(
                            "relative aspect-square overflow-hidden",
                            styles.imageBg
                          )}
                        >
                          {badgeLabel && (
                            <span className="absolute top-3 left-3 px-2 py-1 bg-gold text-[10px] font-semibold text-black z-10 tracking-[0.1em] uppercase rounded-sm shadow-sm">
                              {badgeLabel}
                            </span>
                          )}
                          <div className="absolute inset-0 p-6 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.05]">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-contain p-4"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        <div className={cn("p-4", styles.contentDivider)}>
                          <p className="text-xs uppercase tracking-wider text-warm-500 mb-1">
                            {product.brand}
                          </p>
                          <h3
                            className={cn(
                              "font-serif text-lg",
                              styles.priceText
                            )}
                          >
                            {product.name}
                          </h3>
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className={cn(
                                "text-base font-semibold",
                                styles.priceText
                              )}
                            >
                              {formatPrice(currentPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-warm-500 line-through">
                                {formatPrice(primaryVariant.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            <div
              className={cn(
                "mt-6 max-w-[320px] sm:max-w-[400px] mx-auto h-[1px] relative overflow-hidden rounded-full",
                styles.progressBg
              )}
            >
              <div
                className="absolute top-0 left-0 h-full w-full bg-gold origin-left transition-transform duration-150 ease-out"
                style={{ transform: `scaleX(${scrollProgress / 100})` }}
              />
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
