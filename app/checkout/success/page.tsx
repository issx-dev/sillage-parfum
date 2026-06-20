"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/Button";
import { formatSessionId } from "@/lib/utils";

interface SessionInfo {
  paymentStatus: string;
  customerEmail: string | null;
  amountTotal: number;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const clearCart = useCartStore((s) => s.clearCart);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError("No se pudo recuperar el pedido");
      setLoading(false);
      return;
    }

    async function retrieveSession() {
      try {
        const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch session");
        }
        const data = await response.json();
        setSession({
          paymentStatus: data.payment_status,
          amountTotal: data.amount_total ?? 0,
          customerEmail: data.customer_email ?? null,
        });
        clearCart();
      } catch {
        setError("No se pudo recuperar el pedido");
      } finally {
        setLoading(false);
      }
    }

    retrieveSession();
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="skeleton h-[300px] w-full max-w-lg mx-auto rounded-card" />
      </div>
    );
  }

  if (error || !sessionId || !session) {
    return (
      <div className="text-center py-16">
        <h1 className="font-serif text-2xl mb-4">Error</h1>
        <p className="text-gray-mid mb-8">{error || "Sesión no encontrada"}</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4 flex justify-center">
        <CheckCircle2 className="w-16 h-16 text-gold" />
      </div>
      <h1 className="font-serif text-3xl mb-2">¡Pedido confirmado!</h1>
      <p className="text-gray-mid mb-8">
        Gracias por tu compra. Recibirás un email de confirmación en breve.
      </p>

      <div className="bg-white rounded-card shadow-card p-6 max-w-md mx-auto mb-8">
        <div className="text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-mid">Número de pedido</span>
            <span className="font-mono text-sm">{formatSessionId(sessionId)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-mid">Email</span>
            <span className="text-sm">{session.customerEmail}</span>
          </div>
        </div>
      </div>

      <Link href="/productos">
        <Button>Seguir comprando</Button>
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="pt-28 sm:pt-32 pb-16 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="skeleton h-[300px] w-full max-w-lg mx-auto rounded-card" /></div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}