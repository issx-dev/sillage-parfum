"use client";

import { useState } from "react";
import type { Product, Variant } from "@/types";
import { cn, formatPrice, applyDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { SizeSelector } from "./SizeSelector";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBag, Zap, Truck, RotateCcw, ShieldCheck } from "lucide-react";

interface Props {
  product: Product;
  firstVariant: Variant;
  hasDiscount: boolean;
}

export function AddToCartWrapper({ product, firstVariant, hasDiscount }: Props) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<Variant>(firstVariant);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const currentPrice = applyDiscount(selectedVariant.price, product.discount_percent);

  // Dynamic calculations per quantity option
  const isEligibleMultibuy = selectedVariant.size_ml === 70 && Math.round(currentPrice) === 35;

  const getOptionPricing = (qty: number) => {
    if (qty === 1) {
      return { total: currentPrice, original: null, discountPercent: 0, saving: 0 };
    }
    if (qty === 2) {
      const original = currentPrice * 2;
      const total = isEligibleMultibuy ? 63 : Math.round(original * 0.90 * 100) / 100;
      const saving = Math.max(0, original - total);
      const discountPercent = 10;
      return { total, original, discountPercent, saving };
    }
    // qty === 3
    const original = currentPrice * 3;
    const total = isEligibleMultibuy ? 84 : Math.round(original * 0.80 * 100) / 100;
    const saving = Math.max(0, original - total);
    const discountPercent = 20;
    return { total, original, discountPercent, saving };
  };

  const opt1 = getOptionPricing(1);
  const opt2 = getOptionPricing(2);
  const opt3 = getOptionPricing(3);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? "",
      size_ml: selectedVariant.size_ml,
      price: currentPrice,
      quantity: selectedQty,
      inspiration: product.inspiration,
      officialCode: product.officialCode,
    });
    setTimeout(() => {
      setIsAdding(false);
      openCart();
      toast.success(`${selectedQty}x ${product.name} (${selectedVariant.size_ml}ml) añadido al carrito`);
    }, 200);
  };

  const handleBuyNow = () => {
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? "",
      size_ml: selectedVariant.size_ml,
      price: currentPrice,
      quantity: selectedQty,
      inspiration: product.inspiration,
      officialCode: product.officialCode,
    });
    router.push("/checkout");
  };

  return (
    <div className="space-y-6 text-charcoal">
      {/* Badges superiores armónicos Sillage (sin dots pulse ni verdes chillones) */}
      <div className="flex items-center gap-2.5 flex-wrap text-xs font-sans">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-warm-100/80 border border-warm-200 text-charcoal font-medium">
          <Truck className="w-4 h-4 text-gold-dark" /> Contra entrega disponible
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gold/10 border border-gold/30 text-gold-dark font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-dark" /> En stock
        </span>
      </div>

      {/* Selector de Tamaño */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs uppercase tracking-wider text-charcoal font-bold">
            Tamaño
          </span>
          {hasDiscount && (
            <span className="text-xs text-terracotta font-medium">
              -{product.discount_percent}% de descuento
            </span>
          )}
        </div>
        <SizeSelector
          variants={product.variants}
          selectedVariant={selectedVariant}
          onSelect={setSelectedVariant}
        />
      </div>

      {/* Compra Más & Ahorra - Estilo Sillage Sutil */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-widest text-charcoal font-bold">
            Compra más & ahorra
          </span>
          <span className="text-xs sm:text-sm font-semibold text-gold-dark font-sans tracking-wide">
            Acumulable con envío gratis
          </span>
        </div>

        <div className="space-y-3">
          {/* Opción 1: 1 unidad */}
          <label
            onClick={() => setSelectedQty(1)}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer select-none",
              selectedQty === 1
                ? "border-charcoal bg-warm-100/50 shadow-xs"
                : "border-warm-200 hover:border-warm-300 bg-white"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors",
                  selectedQty === 1 ? "border-charcoal bg-charcoal" : "border-warm-300"
                )}
              >
                {selectedQty === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-sm font-medium text-charcoal">1 unidad</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-charcoal">{formatPrice(opt1.total)}</span>
            </div>
          </label>

          {/* Opción 2: 2 unidades (Popular) */}
          <label
            onClick={() => setSelectedQty(2)}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer select-none relative",
              selectedQty === 2
                ? "border-gold-dark bg-warm-100/70 shadow-xs ring-1 ring-gold-dark/30"
                : "border-warm-200 hover:border-warm-300 bg-white"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors",
                  selectedQty === 2 ? "border-gold-dark bg-gold-dark" : "border-warm-300"
                )}
              >
                {selectedQty === 2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-charcoal">2 unidades</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark bg-gold/20 px-2 py-0.5 rounded">
                  POPULAR
                </span>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              {opt2.original && opt2.saving > 0 && (
                <span className="text-xs text-gray-mid line-through font-light">{formatPrice(opt2.original)}</span>
              )}
              <span className="text-sm font-semibold text-charcoal">{formatPrice(opt2.total)}</span>
              {opt2.discountPercent > 0 && (
                <span className="text-xs font-semibold text-gold-dark font-mono">(-{opt2.discountPercent}%)</span>
              )}
            </div>
          </label>

          {/* Opción 3: 3 unidades */}
          <label
            onClick={() => setSelectedQty(3)}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer select-none",
              selectedQty === 3
                ? "border-charcoal bg-warm-100/50 shadow-xs"
                : "border-warm-200 hover:border-warm-300 bg-white"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors",
                  selectedQty === 3 ? "border-charcoal bg-charcoal" : "border-warm-300"
                )}
              >
                {selectedQty === 3 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-charcoal">3 unidades</span>
              </div>
            </div>
            <div className="text-right flex items-center gap-2">
              {opt3.original && opt3.saving > 0 && (
                <span className="text-xs text-gray-mid line-through font-light">{formatPrice(opt3.original)}</span>
              )}
              <span className="text-sm font-semibold text-charcoal">{formatPrice(opt3.total)}</span>
              {opt3.discountPercent > 0 && (
                <span className="text-xs font-semibold text-gold-dark font-mono">(-{opt3.discountPercent}%)</span>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Botones de acción principales — Paddings y proporciones Sillage */}
      <div className="space-y-3.5 pt-3">
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={selectedVariant.stock === 0 || isAdding}
            className="flex-1 h-13 sm:h-14 border border-charcoal/80 bg-white hover:bg-warm-100/60 text-charcoal font-semibold text-xs uppercase tracking-[0.18em] rounded-md flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] shadow-xs px-4"
          >
            <ShoppingBag className="w-4.5 h-4.5 text-charcoal" />
            {isAdding ? "Añadiendo..." : "Añadir al carrito"}
          </button>

          <WishlistButton
            productId={product.id}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-md border border-warm-200 text-charcoal hover:border-gold hover:text-gold transition-colors flex-shrink-0"
          />
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={selectedVariant.stock === 0}
          className="w-full h-13 sm:h-14 bg-charcoal hover:bg-black text-white font-semibold text-xs uppercase tracking-[0.18em] rounded-md flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] shadow-md"
        >
          <Zap className="w-4.5 h-4.5 text-gold" />
          Comprar ahora
        </button>
      </div>

      {/* Métodos de Pago aceptados */}
      <div className="pt-3 border-t border-warm-200/60">
        <span className="text-[11px] uppercase tracking-widest text-gray-mid block mb-2.5 font-semibold text-center">
          Métodos de pago aceptados
        </span>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 bg-warm-100/70 rounded text-charcoal border border-warm-200 font-medium">
            🚚 Contra entrega
          </span>
          <span className="text-xs px-3 py-1.5 bg-warm-100/70 rounded text-charcoal border border-warm-200 font-medium">
            💳 Tarjeta
          </span>
          <span className="text-xs px-3 py-1.5 bg-warm-100/70 rounded text-charcoal border border-warm-200 font-medium">
            📱 Bizum
          </span>
        </div>
      </div>

      {/* Garantías Sillage en desktop (tamaños legibles) */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-warm-200/60 text-center">
        <div className="p-2 space-y-1">
          <Truck className="w-5 h-5 text-gold-dark mx-auto mb-1" />
          <span className="text-xs sm:text-sm font-medium text-charcoal block leading-tight">Envío 24–72 h</span>
          <span className="text-[11px] sm:text-xs text-gray-mid block font-light">A toda España</span>
        </div>
        <div className="p-2 space-y-1">
          <RotateCcw className="w-5 h-5 text-gold-dark mx-auto mb-1" />
          <span className="text-xs sm:text-sm font-medium text-charcoal block leading-tight">Devolución 14 días</span>
          <span className="text-[11px] sm:text-xs text-gray-mid block font-light">Sin preguntas</span>
        </div>
        <div className="p-2 space-y-1">
          <ShieldCheck className="w-5 h-5 text-gold-dark mx-auto mb-1" />
          <span className="text-xs sm:text-sm font-medium text-charcoal block leading-tight">100% Original</span>
          <span className="text-[11px] sm:text-xs text-gray-mid block font-light">Extrait de Parfum</span>
        </div>
      </div>
    </div>
  );
}
