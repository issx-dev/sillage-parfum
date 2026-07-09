"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Sparkles, Truck, Gift, ChevronLeft, ChevronRight, Copy } from "lucide-react";

interface PromoMessage {
  text: string;
  mobileText?: string;
  ctaText?: string;
  href?: string;
  promoCode?: string;
  icon: React.ReactNode;
}

const PROMOS: PromoMessage[] = [
  {
    text: "nueva colección sillage · descubra la alta perfumería de autor",
    mobileText: "nueva colección sillage · autor",
    ctaText: "descubrir",
    href: "/productos?badge=nuevo",
    icon: <Sparkles className="w-3.5 h-3.5 text-gold/80 shrink-0" />,
  },
  {
    text: "envío exprés de cortesía en compras superiores a 50€",
    mobileText: "envío exprés de cortesía desde 50€",
    ctaText: "comprar",
    href: "/productos",
    icon: <Truck className="w-3.5 h-3.5 text-gold/80 shrink-0" />,
  },
  {
    text: "descuento exclusivo: 10% en su selección",
    mobileText: "10% de descuento",
    ctaText: "copiar",
    promoCode: "SILLAGE2",
    href: "/productos",
    icon: <Gift className="w-3.5 h-3.5 text-gold/80 shrink-0" />,
  },
];

export function PromoBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    // handleNext is stable from useCallback; intentional omission keeps
    // the interval tied only to the lifecycle conditions we care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, prefersReducedMotion, isPaused]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPromo = PROMOS[currentIndex] ?? PROMOS[0]!;

  return (
    <div
      className="w-full bg-black border-b border-warm-900/60 min-h-8 py-1.5 sm:py-0 sm:h-8 px-4 pt-[env(safe-area-inset-top)] overflow-visible relative z-40 select-none group/bar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Visual top border styling for ultra-premium refraction */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-[1440px] mx-auto flex justify-between items-center relative h-full">
        {/* Left Arrow — invisible touch target */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex opacity-60 sm:opacity-0 sm:group-hover/bar:opacity-60 hover:!opacity-100 transition-[opacity] duration-300 text-cream/80 hover:text-gold min-w-[44px] min-h-[44px] items-center justify-start focus:outline-none"
          aria-label="Anuncio anterior"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
        </button>

        {/* Dynamic sliding promotion container */}
        <div className="flex-1 flex justify-center items-center overflow-hidden w-full">
          <div
            className={`flex items-center justify-center gap-1.5 sm:gap-2 transition-[opacity,transform] duration-300 ease-out max-w-full ${
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
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-center max-w-[calc(100vw-60px)] sm:max-w-none overflow-hidden">
              <span className="text-[10px] sm:text-xs font-sans font-light tracking-[0.06em] xs:tracking-[0.12em] sm:tracking-[0.2em] text-cream/90 uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-full block">
                {isMobile && currentPromo.mobileText ? currentPromo.mobileText : currentPromo.text}
              </span>
              {currentPromo.ctaText && (
                <>
                  <span className="text-[11px] text-gold/40 font-light hidden xs:inline">•</span>
                  {currentPromo.promoCode ? (
                    <button
                      onClick={(e) => handleCopyCode(currentPromo.promoCode!, e)}
                      className="font-sans tracking-[0.2em] text-xs uppercase text-gold hover:text-cream transition-colors cursor-pointer bg-transparent border-none relative before:absolute before:inset-y-[-14px] before:inset-x-[-10px] before:content-[''] whitespace-nowrap"
                      aria-label="Copiar código de descuento"
                    >
                      {copied ? (
                        "¡COPIADO!"
                      ) : isMobile ? (
                        <span className="inline-flex items-center gap-1">
                          SILLAGE2
                          <Copy className="w-3 h-3 text-gold/80" />
                        </span>
                      ) : (
                        "CÓDIGO: SILLAGE2"
                      )}
                    </button>
                  ) : (
                    <Link
                      href={currentPromo.href || "#"}
                      className="text-[10px] sm:text-xs font-sans font-medium tracking-[0.1em] sm:tracking-[0.25em] text-gold hover:text-cream uppercase transition-colors duration-300 relative pb-0.5 before:absolute before:inset-y-[-14px] before:inset-x-[-10px] before:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-right after:scale-x-0 after:bg-cream after:transition-transform after:duration-300 after:ease-out hover:after:origin-left hover:after:scale-x-100 whitespace-nowrap"
                    >
                      {currentPromo.ctaText}
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Arrow — invisible touch target */}
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex opacity-60 sm:opacity-0 sm:group-hover/bar:opacity-60 hover:!opacity-100 transition-[opacity] duration-300 text-cream/80 hover:text-gold min-w-[44px] min-h-[44px] items-center justify-end focus:outline-none"
          aria-label="Siguiente anuncio"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
