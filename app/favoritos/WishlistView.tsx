"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface WishlistViewProps {
  allProducts: Product[];
}

export function WishlistView({ allProducts }: WishlistViewProps) {
  const productIds = useWishlistStore((s) => s.productIds);
  const hasHydrated = useWishlistStore((s) => s._hasHydrated);
  const toggle = useWishlistStore((s) => s.toggle);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch: render nothing until client-side store is ready
  if (!mounted || !hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[400px] rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  const wishlistProducts = allProducts.filter((p) => productIds.includes(p.id));

  // Empty state
  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <Heart className="w-12 h-12 text-warm-300 mb-6 stroke-[1]" />
        <h2 className="font-serif text-2xl sm:text-3xl text-warm-800 font-light mb-3">
          Tu lista de deseos está vacía
        </h2>
        <p className="text-sm text-warm-500 max-w-[40ch] leading-relaxed mb-8">
          Guarda las fragancias que te interesan para encontrarlas fácilmente cuando estés listo.
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium text-charcoal hover:text-gold transition-colors duration-300 pb-1.5 border-b border-charcoal/30 hover:border-gold"
        >
          Explorar fragancias
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <ScrollReveal>
        <p className="text-sm text-warm-500 mb-8">
          {wishlistProducts.length} {wishlistProducts.length === 1 ? "fragancia guardada" : "fragancias guardadas"}
        </p>
      </ScrollReveal>

      <ScrollReveal stagger={60}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {wishlistProducts.map((product) => {
            const primaryVariant =
              product.variants.find((v) => v.stock > 0) || product.variants[0];
            const hasDiscount = product.discount_percent > 0;
            const currentPrice = hasDiscount
              ? primaryVariant.price * (1 - product.discount_percent / 100)
              : primaryVariant.price;

            return (
              <div key={product.id} className="relative group">
                {/* Remove from wishlist */}
                <button
                  onClick={() => toggle(product.id)}
                  className="absolute top-3 right-3 z-10 p-2 bg-cream/90 rounded-full text-gold hover:text-charcoal transition-colors duration-200 active:scale-95 shadow-sm"
                  aria-label={`Eliminar ${product.name} de favoritos`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                <Link href={`/productos/${product.slug}`} className="block">
                  <div className="bg-white border border-warm-200/60 rounded-card overflow-hidden transition-[transform,box-shadow] duration-300 group-hover:shadow-md group-hover:scale-[1.01]">
                    {/* Image */}
                    <div className="relative aspect-square bg-cream p-4">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4 border-t border-warm-100">
                      <p className="text-[10px] uppercase tracking-wider text-warm-400 mb-0.5">
                        {product.brand}
                      </p>
                      <h3 className="font-serif text-sm sm:text-base text-warm-900 leading-snug">
                        {product.name}
                      </h3>
                      <div className={cn("mt-2 flex items-center gap-2")}>
                        <span className="text-sm font-medium text-warm-900">
                          {formatPrice(currentPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-warm-400 line-through">
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
      </ScrollReveal>
    </div>
  );
}
