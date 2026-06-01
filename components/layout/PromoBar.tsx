"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Sparkles, Truck, Gift, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";

interface PromoMessage {
  text: string;
  ctaText?: string;
  href?: string;
  promoCode?: string;
  icon: React.ReactNode;
}

const PROMOS: PromoMessage[] = [
  {
    text: "nueva colección sillage · descubra la alta perfumería de autor",
    ctaText: "descubrir",
    href: "/productos?badge=nuevo",
    icon: <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]/80 shrink-0" />,
  },
  {
    text: "envío exprés de cortesía en compras superiores a 45€",
    ctaText: "comprar",
    href: "/productos",
    icon: <Truck className="w-3.5 h-3.5 text-[#C9A96E]/80 shrink-0" />,
  },
  {
    text: "obsequio exclusivo: 2 muestras selectas · código: SILLAGE2",
    ctaText: "copiar código",
    promoCode: "SILLAGE2",
    href: "/productos",
    icon: <Gift className="w-3.5 h-3.5 text-[#C9A96E]/80 shrink-0" />,
  },
];

export function PromoBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerTransition = (nextIndex: number, nextDir: "up" | "down") => {
    if (isTransitioning) return;
    setDirection(nextDir);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsTransitioning(false);
    }, 400); // Slower, smoother transition
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % PROMOS.length;
    triggerTransition(nextIndex, "up");
  };

  const handlePrev = () => {
    const nextIndex = (currentIndex - 1 + PROMOS.length) % PROMOS.length;
    triggerTransition(nextIndex, "down");
  };

  useEffect(() => {
    if (prefersReducedMotion || isPaused) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      return;
    }

    rotationTimerRef.current = setInterval(() => {
      handleNext();
    }, 6000); // 6 seconds for comfortable reading and luxury pacing

    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [currentIndex, prefersReducedMotion, isPaused]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPromo = PROMOS[currentIndex];

  return (
    <div
      className="w-full bg-[#0B0A08] border-b border-warm-900/60 py-2 px-4 overflow-hidden relative z-50 select-none group/bar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Visual top border styling for ultra-premium refraction */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/20 to-transparent" />

      <div className="max-w-[1440px] mx-auto flex justify-between items-center relative min-h-[16px]">
        {/* Left Arrow - subtle premium fade in */}
        <button
          onClick={handlePrev}
          className="opacity-0 group-hover/bar:opacity-60 hover:!opacity-100 transition-[opacity] duration-300 text-[#FAF7F2]/80 hover:text-gold min-w-[32px] min-h-[32px] flex items-center justify-start focus:outline-none"
          aria-label="Anuncio anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[1.5]" />
        </button>

        {/* Dynamic sliding promotion container */}
        <div className="flex-1 flex justify-center items-center overflow-hidden py-0.5">
          <div
            className={`flex items-center justify-center gap-2 transition-[opacity,transform] duration-300 ease-out ${
              prefersReducedMotion
                ? "opacity-100"
                : isTransitioning
                ? direction === "up"
                  ? "opacity-0 -translate-y-2"
                  : "opacity-0 translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
          >
            {currentPromo.icon}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-center">
              <span className="text-xs sm:text-sm font-sans font-light tracking-[0.2em] text-[#FAF7F2]/90 uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] sm:max-w-none">
                {currentPromo.text}
              </span>
              {currentPromo.ctaText && (
                <>
                  <span className="text-[9px] text-[#C9A96E]/40 font-light hidden sm:inline">•</span>
                  {currentPromo.promoCode ? (
                    <button
                      onClick={(e) => handleCopyCode(currentPromo.promoCode!, e)}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-sans font-medium tracking-[0.25em] text-[#C9A96E] hover:text-[#FAF7F2] uppercase transition-colors duration-300 relative pb-0.5 border-b border-[#C9A96E]/30 hover:border-[#FAF7F2]/40 min-h-[32px] sm:min-h-[44px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-[#C9A96E]" />
                          <span>copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>{currentPromo.ctaText}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={currentPromo.href || "#"}
                      className="text-[10px] sm:text-xs font-sans font-medium tracking-[0.25em] text-[#C9A96E] hover:text-[#FAF7F2] uppercase transition-colors duration-300 relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-right after:scale-x-0 after:bg-[#FAF7F2] after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100"
                    >
                      {currentPromo.ctaText}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Arrow - subtle premium fade in */}
        <button
          onClick={handleNext}
          className="opacity-0 group-hover/bar:opacity-60 hover:!opacity-100 transition-[opacity] duration-300 text-[#FAF7F2]/80 hover:text-gold min-w-[32px] min-h-[32px] flex items-center justify-end focus:outline-none"
          aria-label="Siguiente anuncio"
        >
          <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
