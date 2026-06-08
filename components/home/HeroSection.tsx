"use client";

import Link from "next/link";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ChevronDown, Star, ArrowUpRight } from "lucide-react";

export function HeroSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-black text-cream">
      {/* Background Media */}
      {reducedMotion ? (
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            src="/images/hero/hero-desktop.jpg"
            alt="Sillage Cinematic Campaign Background"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
        </div>
      ) : (
        <Image
          src="/images/hero/hero-desktop.jpg"
          alt="Sillage Cinematic Campaign Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50 z-0"
        />
      )}

      {/* Cinematic Vignette Overlay */}
      <div
        className="absolute inset-0 z-[1] select-none pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(26, 26, 26, 0.4) 0%, rgba(26, 26, 26, 0.6) 70%, rgba(26, 26, 26, 0.9) 100%), radial-gradient(circle at center, transparent 30%, rgba(26, 26, 26, 0.7) 100%)",
        }}
      />

      {/* Content - premium asymmetric layout */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left: Text content */}
          <div className="text-left lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 w-fit mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-xs font-sans tracking-[0.15em] uppercase text-gold">Alta Perfumería de Autor</span>
            </div>

            <h1 className="font-serif text-[2.6rem] sm:text-5xl md:text-7xl font-normal leading-[1.08] tracking-tight">
              El arte de la <br />
              <span className="italic font-light text-gold">estela atemporal</span>.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-cream/70 max-w-xl font-sans tracking-wide leading-relaxed font-light">
              Descubra fragancias icónicas elaboradas por los maestros perfumistas más prestigiosos del mundo. Diseñadas para perdurar en la memoria.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-start gap-6 sm:gap-10">
              {/* Primary CTA — solid gold underline */}
              <Link
                href="/productos"
                className="group relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-medium text-cream hover:text-gold transition-colors duration-300 pb-2
                           after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:bg-gold after:origin-right after:scale-x-100"
              >
                Descubrir colección
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </Link>

              {/* Secondary CTA — sliding underline */}
              <Link
                href="/productos"
                className="group relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-light text-cream/60 hover:text-cream transition-colors duration-300 pb-2
                           after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:bg-cream/40
                           after:origin-right after:scale-x-0
                           after:transition-transform after:duration-500 after:ease-out
                           hover:after:origin-left hover:after:scale-x-100"
              >
                Guía de fragancias
              </Link>
            </div>

            {/* Premium Stat Overlay */}
            <div className="mt-12 inline-block backdrop-blur-md bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-card p-4 sm:p-5 w-fit hover:border-gold/30 transition-[border-color,box-shadow] duration-500">
              <p className="text-sm sm:text-base flex items-center gap-3 text-cream/90 font-sans tracking-wide">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="font-semibold text-gold">4.9/5</span>
                <span className="text-cream/40">|</span>
                <span>12.847 firmas de aroma entregadas</span>
              </p>
            </div>
          </div>

          {/* Right: Premium Glassmorphism Card */}
          <div className="hidden lg:flex items-center justify-end lg:col-span-5 xl:col-span-4 pr-4">
            <div className="relative w-full max-w-[350px] aspect-[3/4] rounded-card backdrop-blur-md bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_24px_48px_rgba(0,0,0,0.5)] p-8 flex flex-col justify-between overflow-hidden group hover:border-gold/30 transition-[border-color] duration-700">
              {/* Subtle animated background glow */}
              <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-gold/10 blur-3xl group-hover:bg-gold/20 transition-[background-color] duration-700" />

              <div>
                <span className="font-serif text-xs uppercase tracking-[0.25em] text-gold block mb-2">Colección Privada</span>
                <h2 className="font-serif text-3xl text-cream leading-tight">
                  Sillage <br />
                  <span className="italic font-light text-2xl text-cream/80">Signature</span>
                </h2>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-xs text-cream/70 leading-relaxed font-sans uppercase tracking-[0.12em] space-y-1">
                  Salida: Bergamota & Pimienta Rosa <br />
                  Corazón: Jazmín & Rosa de Mayo <br />
                  Fondo: Ámbar, Sándalo & Vainilla
                </p>
                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-sm font-serif text-gold">100ml EDP</span>
                  <Link href="/productos">
                    <span className="text-xs uppercase tracking-wider text-cream/90 hover:text-gold transition-colors duration-300 flex items-center gap-1.5 cursor-pointer">
                      Ver aroma <span className="text-gold text-sm">→</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      {!reducedMotion && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10 pointer-events-none" style={{ animationDuration: "2s" }}>
          <ChevronDown className="w-8 h-8 text-gold opacity-80" />
        </div>
      )}
    </section>
  );
}