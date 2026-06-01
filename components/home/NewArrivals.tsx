"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { Product } from "@/types";

interface NewArrivalsProps {
  products: Product[];
}

export function NewArrivals({ products }: NewArrivalsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-8 lg:mb-12">
            <div className="flex-1 h-px bg-gold/30" />
            <h2 className="font-serif text-2xl sm:text-3xl text-center whitespace-nowrap">
              Recién llegados
            </h2>
            <div className="flex-1 h-px bg-gold/30" />
          </div>
        </ScrollReveal>

        <ScrollReveal stagger={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large card - left */}
            {products[0] && (
              <div className="md:col-span-1 md:row-span-2">
                <ProductCard product={products[0]} variant="large" />
              </div>
            )}

            {/* Two stacked cards - right */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.slice(1, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
