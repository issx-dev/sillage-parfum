"use client";

import React, { useState, useEffect } from "react";
import { X, Gift, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmailLeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or submitted lead modal
    const hasSeenModal = localStorage.getItem("chogan_lead_dismissed");
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // Trigger after 5 seconds of browsing
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("chogan_lead_dismissed", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate lead capture save (can be connected to email service later)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      localStorage.setItem("chogan_lead_dismissed", "true");
      localStorage.setItem("chogan_discount_code", "BIENVENIDA10");
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-card shadow-2xl overflow-hidden border border-gold/30">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-black rounded-full bg-gray-100 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 text-center">
          {!submitted ? (
            <>
              <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
                <Gift className="w-6 h-6" />
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                <Sparkles className="w-3 h-3" /> Regalo de Bienvenida
              </span>

              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">
                Consigue un <span className="text-gold">10% DTO</span> en tu primer pedido
              </h3>

              <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                Únete a nuestro club privado de perfumería. Recibe ofertas exclusivas y tu cupón de descuento inmediato.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Tu correo electrónico..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gold hover:bg-gold-dark text-black font-semibold text-sm rounded-lg transition-all shadow-md"
                >
                  {loading ? "Generando cupón..." : "Obtener mi 10% de Descuento"}
                </Button>
              </form>

              <p className="text-[10px] text-gray-400 mt-4">
                No enviamos spam. Puedes darte de baja en cualquier momento con 1 clic.
              </p>
            </>
          ) : (
            <div className="py-4">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3 animate-bounce" />
              <h3 className="font-serif text-xl font-bold mb-2">¡Cupón Activado!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Usa el código <strong className="text-gold font-mono text-base bg-gold/10 px-2 py-1 rounded">BIENVENIDA10</strong> en el proceso de pago.
              </p>
              <Button
                onClick={handleClose}
                className="w-full py-2.5 bg-black text-white hover:bg-charcoal text-sm rounded-lg"
              >
                Empezar a comprar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
