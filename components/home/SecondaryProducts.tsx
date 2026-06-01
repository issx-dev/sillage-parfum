"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { Product } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

interface SecondaryProductsProps {
  products: Product[];
}

export function SecondaryProducts({ products }: SecondaryProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef(0);
  const dragScrollLeft = useRef(0);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    setIsAtStart(scrollLeft <= 4);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 4);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollState();

    const timer = setTimeout(updateScrollState, 100);

    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      clearTimeout(timer);
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStart.current = e.pageX - scrollRef.current.offsetLeft;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStart.current) * 1.5;
    scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-black overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 lg:mb-16 gap-6">
            <div className="max-w-xl text-left">
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-gold/80">
                continuación
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-warm-50 tracking-wide mt-2">
                Descubre más
              </h2>
              <p className="text-sm font-light text-warm-400 mt-4 leading-relaxed max-w-[50ch]">
                Explora nuestra selección de fragancias que definen tendencias.
              </p>
            </div>

            {/* Arrow navigation */}
            <div className="flex gap-3 w-fit self-end sm:self-auto">
              <button
                onClick={() => handleScroll("left")}
                disabled={isAtStart}
                className={cn(
                  "w-12 h-12 rounded-full border border-warm-700 flex items-center justify-center text-warm-400 transition-[color,border-color] duration-300 bg-white/5 active:scale-95 min-w-[44px] min-h-[44px]",
                  isAtStart
                    ? "opacity-30 cursor-not-allowed pointer-events-none"
                    : "hover:text-gold hover:border-gold"
                )}
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.2]" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                disabled={isAtEnd}
                className={cn(
                  "w-12 h-12 rounded-full border border-warm-700 flex items-center justify-center text-warm-400 transition-[color,border-color] duration-300 bg-white/5 active:scale-95 min-w-[44px] min-h-[44px]",
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

        {/* Product Carousel */}
        <ScrollReveal stagger={50}>
          <div className="relative">
            <div
              ref={scrollRef}
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
                const badgeLabel = hasDiscount
                  ? `OFERTA -${product.discount_percent}%`
                  : null;
                const primaryVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
                const currentPrice = hasDiscount
                  ? primaryVariant.price * (1 - product.discount_percent / 100)
                  : primaryVariant.price;

                return (
                  <div
                    key={product.id}
                    className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start pointer-events-none"
                  >
                    <Link href={`/productos/${product.slug}`} className="block pointer-events-auto">
                      <div className="bg-warm-900/30 rounded-card overflow-hidden border border-warm-800/50 transition-[transform,border-color] duration-300 hover:border-gold/30 hover:scale-[1.03] group">
                        {/* Image container */}
                        <div className="relative aspect-square overflow-hidden">
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

                        {/* Content */}
                        <div className="p-4 border-t border-warm-800/50">
                          <p className="text-xs uppercase tracking-wider text-warm-500 mb-1">
                            {product.brand}
                          </p>
                          <h3 className="font-serif text-lg text-warm-50">
                            {product.name}
                          </h3>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-base font-semibold text-warm-50">
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

            {/* Progress bar */}
            <div className="mt-6 max-w-[320px] sm:max-w-[400px] mx-auto h-[1px] bg-warm-800/60 relative overflow-hidden rounded-full">
              <div
                className="absolute top-0 left-0 h-full w-full bg-gold origin-left transition-transform duration-150 ease-out"
                style={{ transform: `scaleX(${scrollProgress / 100})` }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}