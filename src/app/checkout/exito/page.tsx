"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "COD-ORD-EX";

  return (
    <div className="pt-28 sm:pt-32 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl border border-gray-100">
          
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 bg-gold/10 text-gold-dark text-xs font-semibold uppercase tracking-wider rounded-full mb-2">
            ¡Pedido Confirmado con Éxito!
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Gracias por tu compra
          </h1>

          <p className="text-sm text-gray-600 mb-6">
            Hemos registrado tu pedido <strong className="text-gray-900 font-mono">#{orderId}</strong>.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <Truck className="w-4 h-4 text-gold" /> Pago Contra Reembolso
            </div>
            <p>
              Tu pedido ha entrado en preparación. Recibirás tu paquete en un plazo estimado de 24-48 horas.
            </p>
            <p className="font-semibold pt-1">
              💡 Recuerda tener preparado el importe exacto en efectivo para entregárselo al repartidor.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/productos">
              <Button className="w-full py-3 bg-black hover:bg-charcoal text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
                Seguir explorando perfumes <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
