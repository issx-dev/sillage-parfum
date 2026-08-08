"use client";

import { useCartStore } from "@/store/cartStore";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Skeleton } from "@/components/ui/Skeleton";
import { useState, useEffect } from "react";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const cartHydrated = useCartStore((s) => s._hasHydrated);

  // Prevent hydration mismatch: only render cart content after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const total = getTotal();
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const shippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showClose={false}
        className="w-full sm:w-[420px] p-0 pb-[env(safe-area-inset-bottom)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-white border-l border-warm-200/80 shadow-2xl"
      >
        <div className="flex flex-col h-full text-charcoal">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-warm-200/60 bg-cream/30">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold-dark" />
              <h2 className="font-serif text-xl tracking-wide">Tu carrito</h2>
              {items.length > 0 && (
                <span className="text-xs bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full font-sans font-semibold">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </div>
            <DialogPrimitive.Close aria-label="Cerrar carrito" className="p-2 min-w-[36px] min-h-[36px] rounded-full hover:bg-warm-100 flex items-center justify-center text-charcoal/70 hover:text-charcoal transition-colors">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto overscroll-y-contain p-5 space-y-4">
            {!mounted || !cartHydrated ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3.5 bg-cream/20 border border-warm-200/60 rounded-card">
                    <Skeleton className="w-16 h-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <ShoppingBag className="w-12 h-12 text-warm-300 mb-4" />
                <p className="font-serif text-lg text-charcoal mb-2">Tu carrito está vacío</p>
                <p className="text-xs text-gray-mid mb-6 max-w-[240px]">
                  Descubre nuestras fragancias de alta perfumería con un 30% Extrait de Parfum.
                </p>
                <Link
                  href="/productos"
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-3 bg-charcoal text-white hover:bg-black text-xs font-semibold uppercase tracking-[0.18em] rounded-md transition-colors shadow-sm"
                >
                  Explorar fragancias
                </Link>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {items.map((item) => (
                  <li
                    key={item.variantId}
                    className="flex gap-3.5 p-3.5 bg-white border border-warm-200/70 rounded-card shadow-xs items-center relative group"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-cream/40 rounded border border-warm-200/50 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full bg-warm-100" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-serif text-sm font-semibold truncate text-charcoal">{item.name}</h3>
                      {item.inspiration ? (
                        <p className="text-[10px] text-gold-dark font-medium truncate">Inspirado en {item.inspiration}</p>
                      ) : (
                        <p className="text-[11px] uppercase tracking-wider text-gray-mid mt-0.5">{item.brand}</p>
                      )}
                      <p className="text-[11px] text-gray-mid font-mono">{item.size_ml} ml</p>
                      
                      {/* Quantity Controls & Price */}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        {/* Compact Plus/Minus Buttons */}
                        <div className="flex items-center gap-1.5 border border-warm-200 rounded px-1 py-0.5 bg-cream/30">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-charcoal/80 hover:text-charcoal hover:bg-warm-100 active:scale-90 rounded transition-all cursor-pointer"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold w-5 text-center font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-charcoal/80 hover:text-charcoal hover:bg-warm-100 active:scale-90 rounded transition-all cursor-pointer"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price (NO Overflow del símbolo €) */}
                        <p className="text-sm font-semibold font-mono text-charcoal whitespace-nowrap text-right flex-shrink-0 min-w-[75px]">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-terracotta transition-colors rounded"
                      aria-label="Eliminar producto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {mounted && cartHydrated && items.length > 0 && (
            <div className="p-5 border-t border-warm-200/80 bg-cream/40 space-y-4">
              {/* Free shipping progress bar */}
              {freeShippingRemaining > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-charcoal/80 mb-1.5 font-medium">
                    <span>Faltan <strong className="font-mono text-gold-dark">{formatPrice(freeShippingRemaining)}</strong> para envío gratis</span>
                  </div>
                  <div className="h-1.5 bg-warm-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-dark origin-left transition-transform duration-500 ease-out"
                      style={{ transform: `scaleX(${Math.min(shippingProgress / 100, 1)})` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-1 bg-gold/10 border border-gold/20 rounded">
                  <p className="text-xs text-gold-dark font-semibold uppercase tracking-wider">¡Envío gratis aplicado!</p>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-serif text-base text-charcoal">Subtotal</span>
                <span className="text-xl font-bold font-mono text-charcoal">{formatPrice(total)}</span>
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-charcoal text-white hover:bg-black font-semibold text-xs uppercase tracking-[0.18em] py-3.5 rounded-md transition-all shadow-md flex items-center justify-center"
                >
                  Finalizar compra
                </Link>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-center py-2 text-xs uppercase tracking-wider text-gray-mid hover:text-charcoal transition-colors cursor-pointer"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}