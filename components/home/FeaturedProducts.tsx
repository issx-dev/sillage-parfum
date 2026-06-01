"use client";

import { useRef, useState, useEffect } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { Product } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
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
    
    // Check again after a short delay to account for dynamic content mounting
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
    const walk = (x - dragStart.current) * 1.5; // scroll speed multiplier
    scrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-[#FAF7F2] overflow-hidden border-t border-gray-light/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetrical elegant header */}
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 lg:mb-16 gap-6">
            <div className="max-w-xl text-left">
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#C9A96E]">
                la selección
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#1A1A1A] tracking-wide mt-2">
                los esenciales de sillage
              </h2>
              <p className="text-sm font-light text-[#5A5A5A] mt-4 leading-relaxed max-w-[50ch]">
                nuestra exclusiva antología de fragancias icónicas. best-sellers elegidos minuciosamente por su carácter y persistencia excepcional.
              </p>
            </div>
            
            {/* Custom arrow navigation controllers with reactive state */}
            <div className="flex gap-3 w-fit self-end sm:self-auto">
              <button
                onClick={() => handleScroll("left")}
                disabled={isAtStart}
                className={cn(
                  "w-12 h-12 rounded-full border border-[#E8E4DE] flex items-center justify-center text-[#5A5A5A] transition-[color,border-color] duration-300 bg-white shadow-sm active:scale-95",
                  isAtStart 
                    ? "opacity-30 cursor-not-allowed pointer-events-none" 
                    : "hover:text-[#C9A96E] hover:border-[#C9A96E]"
                )}
                aria-label="Anterior"
              >
                <ChevronLeft className="w-5 h-5 stroke-[1.2]" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                disabled={isAtEnd}
                className={cn(
                  "w-12 h-12 rounded-full border border-[#E8E4DE] flex items-center justify-center text-[#5A5A5A] transition-[color,border-color] duration-300 bg-white shadow-sm active:scale-95",
                  isAtEnd 
                    ? "opacity-30 cursor-not-allowed pointer-events-none" 
                    : "hover:text-[#C9A96E] hover:border-[#C9A96E]"
                )}
                aria-label="Siguiente"
              >
                <ChevronRight className="w-5 h-5 stroke-[1.2]" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Horizontal scrollable Product Carousel with Drag scroll */}
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
              {products.map((product) => (
                <div
                  key={product.id}
                  className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start pointer-events-none sm:pointer-events-auto"
                >
                  {/* Outer card wrapping is protected from native image dragging */}
                  <div className="pointer-events-auto">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>

            {/* Custom high-end linear progress bar indicator */}
            <div className="mt-6 max-w-[320px] sm:max-w-[400px] mx-auto h-[1px] bg-warm-200/60 relative overflow-hidden rounded-full">
              <div
                className="absolute top-0 left-0 h-full w-full bg-[#C9A96E] origin-left transition-transform duration-150 ease-out"
                style={{ transform: `scaleX(${scrollProgress / 100})` }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
