"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import productsData from "@/lib/data/products.json";
import type { Product } from "@/types/client";
import { formatPrice, cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACEHOLDER_CYCLE = [
  "Sauvage · Dior",
  "notas de ámbar",
  "familia amaderada",
  "Tom Ford",
  "bergamota & vetiver",
];

const SUGGESTED_TERMS = ["Floral", "Amaderado", "Chanel", "Tom Ford", "Fresco", "Aldehidos"];

const RECOMMENDED_SLUGS = [
  "sauvage-dior-edt",
  "chanel-5-edp",
  "bleu-de-chanel-edp",
  "black-orchid-edp",
];

// ---------------------------------------------------------------------------
// Typewriter hook — animates placeholder text cycling
// ---------------------------------------------------------------------------

function usePlaceholderCycle(items: string[], interval = 3200): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, interval);
    return () => clearInterval(id);
  }, [items, interval]);

  return items[index];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SuggestedChip({
  term,
  onClick,
}: {
  term: string;
  onClick: (t: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(term)}
      className="px-3.5 py-1.5 text-[10px] tracking-[0.2em] uppercase font-light text-warm-300 border border-warm-700 hover:border-[#C9A96E]/60 hover:text-[#FAF7F2] hover:bg-[#C9A96E]/8 transition-[color,border-color,background-color] duration-300 rounded-none"
    >
      {term}
    </button>
  );
}

function RecommendedCard({
  product,
  featured,
  onClose,
}: {
  product: Product;
  featured?: boolean;
  onClose: () => void;
}) {
  const defaultVariant = product.variants[0];

  if (featured) {
    return (
      <Link
        href={`/productos/${product.slug}`}
        onClick={onClose}
        className="group relative flex flex-col bg-warm-900/50 border border-warm-700/50 hover:border-[#C9A96E]/40 transition-[border-color] duration-500 overflow-hidden"
      >
        {/* Image */}
        <div className="relative aspect-[4/5] bg-white/8 flex items-center justify-center overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-6 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
          {/* Arrow icon */}
          <span className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight className="w-4 h-4 text-[#C9A96E]" />
          </span>
        </div>
        {/* Meta */}
        <div className="px-4 py-4 border-t border-warm-700/40">
          <span className="block text-[9px] uppercase tracking-[0.3em] text-warm-400 mb-1">
            {product.brand}
          </span>
          <span className="block text-sm font-serif text-[#FAF7F2] group-hover:text-[#C9A96E] transition-colors duration-300 truncate leading-snug">
            {product.name}
          </span>
          <span className="block text-[10px] text-warm-400 mt-1.5">
            desde {formatPrice(defaultVariant.price)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/productos/${product.slug}`}
      onClick={onClose}
      className="group flex items-center gap-3 py-3.5 border-b border-warm-700/30 last:border-0 transition-colors duration-300"
    >
      <div className="relative w-12 h-12 bg-white/8 flex-shrink-0 flex items-center justify-center overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="48px"
          className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[9px] uppercase tracking-[0.2em] text-warm-400">
          {product.brand}
        </span>
        <span className="block text-xs text-[#FAF7F2] truncate group-hover:text-[#C9A96E] transition-colors duration-300 mt-0.5 font-serif">
          {product.name}
        </span>
      </div>
      <span className="text-[11px] text-warm-300 flex-shrink-0">
        {formatPrice(defaultVariant.price)}
      </span>
    </Link>
  );
}

function ResultRow({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const defaultVariant = product.variants[0];
  const hasDiscount = product.discount_percent > 0;
  const currentPrice = hasDiscount
    ? defaultVariant.price * (1 - product.discount_percent / 100)
    : defaultVariant.price;

  return (
    <Link
      href={`/productos/${product.slug}`}
      onClick={onClose}
      className="group flex items-center gap-4 py-4 border-b border-warm-700/30 last:border-0 transition-colors duration-300"
    >
      <div className="relative w-14 h-14 bg-white/8 flex-shrink-0 overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="56px"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[9px] uppercase tracking-[0.25em] text-warm-400 mb-0.5">
          {product.brand}
        </span>
        <span className="block text-sm font-serif text-[#FAF7F2] truncate group-hover:text-[#C9A96E] transition-colors duration-300">
          {product.name}
        </span>
        <span className="block text-[10px] text-warm-400 mt-0.5 italic">
          {product.family}
        </span>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="block text-sm text-[#FAF7F2] font-light">
          {formatPrice(currentPrice)}
        </span>
        {hasDiscount && (
          <span className="block text-[10px] text-warm-500 line-through">
            {formatPrice(defaultVariant.price)}
          </span>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = usePlaceholderCycle(PLACEHOLDER_CYCLE);

  // Filter products
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase().trim();
    setResults(
      (productsData as Product[]).filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.family.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.notes.top.some((n) => n.toLowerCase().includes(q)) ||
          p.notes.heart.some((n) => n.toLowerCase().includes(q)) ||
          p.notes.base.some((n) => n.toLowerCase().includes(q))
        );
      })
    );
  }, [query]);

  // Scroll lock + focus
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(id);
    };
  }, [isOpen]);

  // ESC to close
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!isOpen) return null;

  const recommendedProducts = (productsData as Product[]).filter((p) =>
    RECOMMENDED_SLUGS.includes(p.slug)
  );
  const [featured, ...secondary] = recommendedProducts;
  const hasQuery = query.trim() !== "";

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#0B0A08] animate-overlay-in overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda de fragancias"
    >
      {/* Click-outside-to-close layer — sits behind the panel */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel — relative so it sits above the click layer */}
      <div className="relative z-10 flex flex-col h-full max-w-[860px] mx-auto w-full px-6 md:px-12 py-8 md:py-12">

        {/* Header */}
        <header className="flex items-center justify-between mb-10 md:mb-14">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-[#C9A96E]/50" />
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#C9A96E]/80 font-light">
              Sillage · Búsqueda
            </span>
          </div>
          <button
            onClick={onClose}
            className="group flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-warm-300 hover:text-[#FAF7F2] transition-colors duration-300"
            aria-label="Cerrar búsqueda"
          >
            <span className="hidden sm:inline">Cerrar</span>
            <X className="w-4 h-4 stroke-[1.5] group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </header>

        {/* Search Input */}
        <div className="relative mb-10 md:mb-14 group/input">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${placeholder}...`}
            className={cn(
              "w-full bg-transparent py-4 pr-10 text-2xl sm:text-3xl md:text-4xl",
              "text-[#FAF7F2] placeholder-warm-500 font-serif font-light",
              "border-b border-warm-700 focus:border-[#C9A96E]",
              "focus:outline-none transition-colors duration-500",
              "tracking-wide leading-tight"
            )}
          />
          <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500 group-focus-within/input:text-[#C9A96E] transition-colors duration-300" />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.15em] text-warm-600 hover:text-warm-300 transition-colors duration-200"
              aria-label="Limpiar"
            >
              ×
            </button>
          )}

          {/* Gold underline accent on focus */}
          <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#C9A96E] group-focus-within/input:w-full transition-[width] duration-700 ease-out" />
        </div>

        {/* Dynamic content */}
        <div className="flex-1 overflow-y-auto scrollbar-dark -mx-1 px-1">
          {!hasQuery ? (
            // ── Idle state: suggestions + recommendations ──────────────────
            <div className="space-y-10">

              {/* Suggested terms */}
              <section>
                <p className="text-[9px] uppercase tracking-[0.3em] text-warm-400 mb-4">
                  Búsquedas frecuentes
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TERMS.map((term) => (
                    <SuggestedChip key={term} term={term} onClick={setQuery} />
                  ))}
                </div>
              </section>

              {/* Recommended — asymmetric layout */}
              <section>
                <p className="text-[9px] uppercase tracking-[0.3em] text-warm-400 mb-6">
                  Las más buscadas
                </p>

                <div className="grid grid-cols-2 md:grid-cols-[1fr_1.6fr] gap-4 md:gap-6">
                  {/* Left: featured card (tall) */}
                  {featured && (
                    <RecommendedCard
                      product={featured}
                      featured
                      onClose={onClose}
                    />
                  )}

                  {/* Right: secondary list */}
                  <div className="flex flex-col justify-between">
                    {secondary.slice(0, 3).map((p) => (
                      <RecommendedCard key={p.id} product={p} onClose={onClose} />
                    ))}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            // ── Results state ──────────────────────────────────────────────
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-warm-400">
                  Resultados
                </p>
                <span className="text-[10px] text-warm-400">
                  {results.length} {results.length === 1 ? "fragancia" : "fragancias"}
                </span>
              </div>

              {results.length > 0 ? (
                <div>
                  {results.map((p) => (
                    <ResultRow key={p.id} product={p} onClose={onClose} />
                  ))}
                </div>
              ) : (
                // Empty state — editorial
                <div className="flex flex-col items-start pt-4 pb-16">
                  <div className="h-[1px] w-full bg-warm-800/60 mb-10" />
                  <p className="text-[9px] uppercase tracking-[0.3em] text-warm-400 mb-4">
                    Sin coincidencias
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl text-[#FAF7F2]/80 font-light leading-snug max-w-[28ch] mb-6">
                    &ldquo;{query}&rdquo; no pertenece a nuestra colección.
                  </h3>
                  <p className="text-xs text-warm-400 max-w-[44ch] leading-relaxed mb-8">
                    Pruebe con una nota olfativa (ámbar, bergamota), una familia (Floral, Amaderado) o el nombre exacto de la firma.
                  </p>
                  <button
                    onClick={() => setQuery("")}
                    className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] hover:text-[#FAF7F2] transition-colors duration-300 pb-0.5 border-b border-[#C9A96E]/40 hover:border-[#FAF7F2]/40"
                  >
                    Restablecer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — keyboard hint */}
        <footer className="mt-6 pt-4 border-t border-warm-800/40 flex items-center justify-between">
          <span className="text-[9px] text-warm-400 uppercase tracking-[0.2em]">
            esc para cerrar
          </span>
          <Link
            href="/productos"
            onClick={onClose}
            className="text-[9px] uppercase tracking-[0.2em] text-warm-400 hover:text-[#C9A96E] transition-colors duration-300 flex items-center gap-1.5"
          >
            Ver catálogo completo
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
