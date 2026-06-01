"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

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
    <section className="bg-[#0B0A08] border-t border-warm-900/60 py-16 lg:py-20">
      <ScrollReveal>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">

            {/* Label */}
            <span className="text-[10px] uppercase tracking-[0.35em] font-semibold text-[#C9A96E]/70">
              novedades exclusivas
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F2] font-light leading-snug mt-4 tracking-wide">
              Suscríbete para recibir novedades de Sillage
            </h2>

            <p className="text-sm font-light text-warm-400 mt-3 max-w-[46ch] mx-auto leading-relaxed">
              Nuevas colecciones, lanzamientos exclusivos y acceso anticipado a ediciones limitadas.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="max-w-md mx-auto">
                <label
                  htmlFor="newsletter-email"
                  className="text-xs uppercase tracking-wider text-gray-mid mb-2 block"
                >
                  Tu email
                </label>
                <p className="text-xs text-gray-mid mt-1 h-4">Sin spam, solo novedades de Sillage.</p>
                <div className="flex flex-col sm:flex-row gap-0 border border-warm-700 focus-within:border-[#C9A96E] transition-[border-color] duration-300">
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-3.5 bg-transparent text-[#FAF7F2] placeholder:text-warm-600 text-sm focus:outline-none min-h-[48px]"
                  aria-label="Tu email"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className={cn(
                    "px-6 py-3.5 text-[10px] uppercase tracking-[0.25em] font-medium transition-[color,background-color] duration-300 min-h-[48px] flex items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-warm-700 active:scale-95 transition-transform duration-150",
                    status === "success"
                      ? "text-[#C9A96E] bg-transparent"
                      : "text-[#FAF7F2] hover:text-[#C9A96E] bg-transparent hover:bg-[#C9A96E]/5"
                  )}
                >
                  {status === "loading" ? (
                    <div className="w-4 h-4 border border-warm-500 border-t-[#C9A96E] rounded-full animate-spin" />
                  ) : status === "success" ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Listo</span>
                    </>
                  ) : (
                    "Suscribirme"
                  )}
                </button>
              </div>

              {errorMsg && (
                <p className="mt-2 text-xs text-red-400/80">{errorMsg}</p>
              )}
              </div>
            </form>

            {/* Privacy note */}
            <p className="mt-5 text-[11px] text-warm-600 max-w-[44ch] mx-auto leading-relaxed">
              Al suscribirte aceptas nuestra política de privacidad. Podés darte de baja en cualquier momento.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
