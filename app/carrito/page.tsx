"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const freeShippingRemaining = useCartStore((s) => s.getFreeShippingRemaining());
  const cartHydrated = useCartStore((s) => s._hasHydrated);

  if (!cartHydrated) {
    return (
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-card shadow-card">
                <Skeleton className="w-24 h-24" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-10 h-10" />
                    <Skeleton className="w-8 h-4" />
                    <Skeleton className="w-10 h-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-mid mx-auto mb-4" />
            <h1 className="font-serif text-2xl mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-mid mb-8">
              Explora nuestros productos y encuentra tu perfume ideal
            </p>
            <Link href="/productos">
              <Button>Ver productos</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-8">Tu carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 p-4 bg-white rounded-card shadow-card"
              >
                <div className="w-24 h-24 bg-gray-light rounded relative overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-mid">{item.brand}</p>
                  <p className="text-sm text-gray-mid">{item.size_ml}ml</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-2 border border-gray-light rounded hover:bg-gray-light active:scale-95 transition-transform duration-150 min-w-[40px] min-h-[40px]"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-2 border border-gray-light rounded hover:bg-gray-light active:scale-95 transition-transform duration-150 min-w-[40px] min-h-[40px]"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="p-2 text-gray-mid hover:text-gold-dark active:scale-95 transition-transform duration-150 min-w-[40px] min-h-[40px]"
                  aria-label="Eliminar producto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-card shadow-card p-6 sticky top-24">
              <h2 className="font-serif text-xl mb-4">Resumen del pedido</h2>

              {/* Free shipping bar */}
              {freeShippingRemaining > 0 ? (
                <div className="mb-4">
                  <div className="text-xs text-gray-mid mb-1">
                    Te faltan {formatPrice(freeShippingRemaining)} para envío gratis
                  </div>
                  <div className="h-1 bg-gray-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold origin-left transition-transform duration-300"
                      style={{ transform: `scaleX(${total / 50})` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gold mb-4">¡Envío gratis aplicado!</p>
              )}

              <div className="flex justify-between py-4 border-t border-gray-light">
                <span>Subtotal</span>
                <span className="font-serif text-xl">{formatPrice(total)}</span>
              </div>

              <Link href="/checkout">
                <Button className="w-full mt-4">Ir al checkout</Button>
              </Link>
              <Link
                href="/productos"
                className="block text-center mt-4 text-sm text-gray-mid hover:text-black active:scale-95 transition-transform duration-150"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
