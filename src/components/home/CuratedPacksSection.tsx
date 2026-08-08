"use client";

import React from "react";
import { CURATED_PACKS, PerfumePack } from "@/lib/data/packs";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { Package, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CuratedPacksSection() {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const handleAddPack = (pack: PerfumePack) => {
    // Add representative item or custom pack item to cart
    addItem({
      variantId: `pack-var-${pack.id}`,
      productId: pack.id,
      slug: pack.id,
      name: pack.name,
      brand: "Chogan Packs",
      image: pack.image,
      size_ml: 70,
      price: pack.price,
      quantity: 1,
    });
    openCart();
  };

  return (
    <section className="py-16 bg-cream/40 border-y border-warm-200/40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold-dark rounded-full text-xs font-semibold uppercase tracking-widest mb-3 border border-gold/20">
            <Package className="w-3.5 h-3.5" /> Ofertas Exclusivas
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Packs Curados de Perfumes
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Combinaciones seleccionadas por nuestros expertos para regalar o renovar tu colección con un ahorro extra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CURATED_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 border border-warm-200/50 flex flex-col justify-between relative group"
            >
              <div className="absolute top-4 right-4 bg-gold text-black font-semibold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                {pack.badge}
              </div>

              <div>
                <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider block mb-1">
                  {pack.subtitle}
                </span>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
                <p className="text-xs text-gray-600 mb-6 leading-relaxed">{pack.description}</p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 border border-gray-100">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-2">
                    <Sparkles className="w-3 h-3 text-gold" /> Incluye {pack.itemsCount} perfumes:
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-600" /> Selección de frascos de alta fijación
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-600" /> Presentación en frasco oficial Chogan
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-serif text-2xl font-bold text-gray-900">
                    {formatPrice(pack.price)}
                  </span>
                  {pack.originalPrice > pack.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(pack.originalPrice)}
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => handleAddPack(pack)}
                  className="w-full py-3 bg-black hover:bg-gold hover:text-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Añadir Pack al Carrito
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
