"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { Brand } from "@/types";

interface BrandCarouselProps {
  brands: Brand[];
}

const brandLogos: Record<string, string> = {
  Chanel: "CHANEL",
  Dior: "DIOR",
  YSL: "YSL",
  "Tom Ford": "TOM FORD",
  Armani: "ARBUR",
  Lancôme: "LANCOME",
  Prada: "PRADA",
  Gucci: "GUCCI",
  Hermès: "HERMES",
  "Calvin Klein": "C.K.",
  Versace: "VERSACE",
  Givenchy: "GIVENCHY",
  Valentino: "VALENTINO",
  Bulgari: "BVLGERI",
  "Hugo Boss": "BOSS",
};

export function BrandCarousel({ brands }: BrandCarouselProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="py-12 lg:py-16 bg-cream overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-8 lg:mb-12">
            Casas de perfumería de referencia
          </h2>
        </ScrollReveal>

        <div className="relative group">
          <div
            className={`flex gap-12 lg:gap-16 ${reducedMotion ? "overflow-x-auto" : "animate-scroll"}`}
            style={
              reducedMotion
                ? { scrollSnapType: "x mandatory" }
                : undefined
            }
          >
            {/* Duplicate for seamless loop */}
            {[...brands, ...brands].map((brand, idx) => (
              <div
                key={`${brand.id}-${idx}`}
                className="flex-shrink-0 snap-center"
                style={reducedMotion ? { scrollSnapAlign: "center" } : undefined}
              >
                <div className="w-24 h-12 flex items-center justify-center grayscale hover:grayscale-0 hover:text-gold transition-[filter,color,opacity] duration-300 cursor-pointer">
                  <span className="font-serif text-lg tracking-wider text-gray-mid hover:text-gold">
                    {brandLogos[brand.name] || brand.name.slice(0, 6).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
