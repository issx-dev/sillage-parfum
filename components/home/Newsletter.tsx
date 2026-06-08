"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateEmail(email)) {
      setErrorMsg("Email inválido");
      return;
    }

    setStatus("loading");
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setEmail("");

    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <section className="bg-warm-50 border-t border-warm-200/60 py-16 lg:py-20">
      <ScrollReveal>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">

            {/* Label */}
            <span className="text-[11px] uppercase tracking-[0.35em] font-semibold text-gold/70">
              círculo sillage
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl text-warm-900 font-light leading-snug mt-4 tracking-wide">
              Member's Club
            </h2>

            <p className="text-sm font-light text-warm-600 mt-3 max-w-[46ch] mx-auto leading-relaxed">
              Acceso anticipado a lanzamientos exclusivos, eventos privados y beneficios reservados para miembros.
            </p>

            {/* Incentive */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full">
              <span className="text-xs font-semibold text-gold">10% OFF</span>
              <span className="text-xs text-warm-600 ml-1">en tu primera compra como miembro</span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="max-w-md mx-auto">
                <label
                  htmlFor="newsletter-email"
                  className="text-xs uppercase tracking-wider text-warm-500 mb-2 block"
                >
                  Tu email
                </label>
                <div className="flex flex-col sm:flex-row gap-0 border border-warm-300 focus-within:border-gold transition-[border-color] duration-300">
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="flex-1 px-4 py-3.5 bg-transparent text-warm-900 placeholder:text-warm-400 text-base focus:outline-none min-h-[48px]"
                    aria-label="Tu email"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading" || status === "success"}
                    className={cn(
                      "px-6 py-3.5 text-[10px] uppercase tracking-[0.25em] font-medium transition-[color,background-color] duration-300 min-h-[48px] flex items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-warm-300 active:scale-95",
                      status === "success"
                        ? "text-gold bg-warm-100"
                        : "text-warm-900 hover:text-gold hover:bg-gold/5"
                    )}
                  >
                    {status === "loading" ? (
                      <div className="w-4 h-4 border border-warm-400 border-t-gold rounded-full animate-spin" />
                    ) : status === "success" ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Listo</span>
                      </>
                    ) : (
                      "Unirme"
                    )}
                  </button>
                </div>

                {errorMsg && (
                  <p className="mt-2 text-xs text-red-600/80">{errorMsg}</p>
                )}
              </div>
            </form>

            {/* Privacy note */}
            <p className="mt-5 text-[11px] text-warm-500 max-w-[44ch] mx-auto leading-relaxed">
              Al unirte aceptas nuestra política de privacidad. Puedes darte de baja en cualquier momento.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}