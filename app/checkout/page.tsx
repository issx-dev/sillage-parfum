"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ShoppingBag, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="pt-20 pb-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-mid mx-auto mb-4" />
            <h1 className="font-serif text-2xl mb-4">Tu carrito está vacío</h1>
            <Link href="/productos" className="text-gold hover:text-gold-dark underline">
              Ver productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al conectar con Stripe");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-8">Checkout</h1>

        <div className="max-w-lg mx-auto">
          {/* Cart summary */}
          <div className="bg-white rounded-card shadow-card p-6 mb-8">
            <h2 className="font-serif text-xl mb-4">Resumen del pedido</h2>
            <ul className="space-y-3 mb-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex justify-between text-sm">
                  <span>
                    {item.name} ({item.size_ml}ml) × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-light pt-4 flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-serif text-xl">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Test card info */}
          <div className="bg-gray-light rounded-card p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Modo test</span>
            </div>
            <p className="text-xs text-gray-mid font-mono">
              4242 4242 4242 4242 · Exp: 12/34 · CVC: 123
            </p>
          </div>

          {error && (
            <div className="bg-gold-dark/10 text-gold-dark rounded-card p-4 mb-8">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Pay button */}
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full min-h-[48px] bg-gold hover:bg-gold-dark text-black"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "Pagar con Stripe"
            )}
          </Button>

          <p className="text-xs text-gray-mid text-center mt-4">
            Al hacer clic en "Pagar con Stripe" serás redirigido a la pasarela de pago segura de Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
