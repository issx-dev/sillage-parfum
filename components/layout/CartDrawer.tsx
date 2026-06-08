"use client";

import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Skeleton } from "@/components/ui/Skeleton";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartHydrated = useCartStore((s) => s._hasHydrated);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  const shippingProgress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showClose={false} className="w-full sm:w-96 p-0 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-light">
          <h2 className="font-serif text-xl">Tu carrito</h2>
          <DialogPrimitive.Close className="min-w-[44px] min-h-[44px] flex items-center justify-center text-warm-500 hover:text-warm-900 transition-colors">
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {!cartHydrated ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 bg-white rounded-card">
                  <Skeleton className="w-16 h-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-12 h-12 text-gray-mid mb-4" />
              <p className="text-gray-mid mb-4">Tu carrito está vacío</p>
              <Link
                href="/productos"
                onClick={() => onOpenChange(false)}
                className="text-sm text-gold hover:text-gold-dark transition-colors underline"
              >
                Explorar productos
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 p-3 bg-white rounded-card">
                  <div className="w-16 h-16 bg-gray-light rounded flex-shrink-0 relative overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-mid">{item.brand}</p>
                    <p className="text-xs text-gray-mid">{item.size_ml}ml</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-light rounded hover:bg-gray-light active:scale-95 transition-transform duration-150"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-light rounded hover:bg-gray-light active:scale-95 transition-transform duration-150"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-mid hover:text-gold-dark transition-colors"
                    aria-label="Eliminar producto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-light bg-cream">
            {/* Free shipping bar */}
            {freeShippingRemaining > 0 ? (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-mid mb-1">
                  <span>Te faltan {formatPrice(freeShippingRemaining)} para envío gratis</span>
                  <span>{formatPrice(total)} / {formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
                </div>
                <div className="h-1 bg-gray-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold origin-left transition-transform duration-300"
                    style={{ transform: `scaleX(${Math.min(shippingProgress / 100, 1)})` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4 text-center">
                <p className="text-sm text-gold font-medium">¡Envío gratis aplicado!</p>
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-mid">Subtotal</span>
              <span className="text-xl font-serif font-semibold">{formatPrice(total)}</span>
            </div>

            {/* CTA */}
            <Link
              href="/checkout"
              onClick={() => onOpenChange(false)}
              className="block w-full bg-black text-cream text-center py-3 rounded font-medium hover:bg-gray-mid transition-colors min-h-[44px] flex items-center justify-center"
            >
              Finalizar compra
            </Link>
            <Link
              href="/productos"
              onClick={() => onOpenChange(false)}
              className="block w-full text-center py-3 mt-2 text-sm text-gray-mid hover:text-black transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        )}
      </div>
      </SheetContent>
    </Sheet>
  );
}
