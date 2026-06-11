"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import type { Product } from "@/types";
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

const SUGGESTED_TERMS = ["Floral", "Amaderado", "Chanel", "Tom Ford", "Fresco", "Aldehídos"];

const RECOMMENDED_SLUGS = [
  "sauvage-dior-edt",
  "chanel-5-edp",
  "bleu-de-chanel-edp",
  "black-orchid-edp",
];

// Recommended products are shipped as initial props from the server (Navbar)
// to avoid an extra round-trip on first open.
const INITIAL_RECOMMENDED: Product[] = [];

// ---------------------------------------------------------------------------
// Hooks
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

/**
 * Debounced server-side search.
 * - 250ms idle debounce
 * - Aborts in-flight request on new keystroke
 * - Falls back gracefully on network error
 */
function useSearchQuery(query: string) {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { results: Product[] };
        setResults(data.results);
        setError(false);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  return { results, loading, error };
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
      className="px-3.5 py-1.5 text-[10px] tracking-[0.2em] uppercase font-light text-warm-600 border border-warm-300 hover:border-gold/60 hover:text-gold hover:bg-gold/5 transition-[color,border-color,background-color] duration-300 rounded-none"
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
        className="group relative flex flex-col bg-warm-50/60 border border-warm-200/60 hover:border-gold/40 transition-[border-color] duration-500 overflow-hidden"
      >
        <div className="relative aspect-[4/5] bg-warm-100 flex items-center justify-center overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-6 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
          <span className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight className="w-4 h-4 text-gold" />
          </span>
        </div>
        <div className="px-4 py-4 border-t border-warm-200/60">
          <span className="block text-[9px] uppercase tracking-[0.3em] text-warm-600 mb-1">
            {product.brand}
          </span>
          <span className="block text-sm font-serif text-warm-900 group-hover:text-gold transition-colors duration-300 truncate leading-snug">
            {product.name}
          </span>
          <span className="block text-[10px] text-warm-600 mt-1.5">
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
      className="group flex items-center gap-3 py-3.5 border-b border-warm-200/60 last:border-0 transition-colors duration-300"
    >
      <div className="relative w-12 h-12 bg-warm-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="48px"
          className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[9px] uppercase tracking-[0.2em] text-warm-600">
          {product.brand}
        </span>
        <span className="block text-xs text-warm-900 truncate group-hover:text-gold transition-colors duration-300 mt-0.5 font-serif">
          {product.name}
        </span>
      </div>
      <span className="text-[11px] text-warm-600 flex-shrink-0">
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
      className="group flex items-center gap-4 py-4 border-b border-warm-200/60 last:border-0 transition-colors duration-300"
    >
<div className="relative w-14 h-14 bg-warm-100 flex-shrink-0 overflow-hidden">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="56px"
              className="object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            />
      </div>
      <div className="flex-1 min-w-0">
<span className="block text-[9px] uppercase tracking-[0.25em] text-warm-600 mb-0.5">
            {product.brand}
          </span>
          <span className="block text-sm font-serif text-warm-900 truncate group-hover:text-gold transition-colors duration-300">
            {product.name}
          </span>
          <span className="block text-[10px] text-warm-600 mt-0.5 italic">
            {product.family}
          </span>
      </div>
      <div className="text-right flex-shrink-0">
<span className="block text-sm text-warm-900 font-light">
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

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fetched recommended products from the server, filtered by RECOMMENDED_SLUGS. */
  recommended?: Product[];
}

export function SearchOverlay({
  isOpen,
  onClose,
  recommended = INITIAL_RECOMMENDED,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = usePlaceholderCycle(PLACEHOLDER_CYCLE);
  const { results, loading, error } = useSearchQuery(query);

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

  const [featured, ...secondary] = recommended;
  const hasQuery = query.trim() !== "";

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-cream/98 animate-overlay-in" />
        <DialogPrimitive.Content className="fixed inset-0 z-[60] flex flex-col h-full max-w-[860px] mx-auto w-full px-4 sm:px-6 md:px-12 py-6 md:py-12 overflow-hidden">
          <DialogPrimitive.Title>
            <VisuallyHidden>Búsqueda de fragancias</VisuallyHidden>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description>
            <VisuallyHidden>Busca fragancias por nombre, marca o familia olfativa</VisuallyHidden>
          </DialogPrimitive.Description>

          <div className="absolute inset-0 -z-10" onClick={onClose} />

          <div className="relative z-10 flex flex-col h-full max-w-[860px] mx-auto w-full px-4 sm:px-6 md:px-12 py-6 md:py-12">
            <header className="flex items-center justify-between mb-10 md:mb-14">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-gold/50" />
                <span className="text-[9px] uppercase tracking-[0.35em] text-gold/80 font-light">
                  Sillage · Búsqueda
                </span>
              </div>
              <button
                onClick={onClose}
                className="group flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-warm-600 hover:text-gold transition-colors duration-300"
                aria-label="Cerrar búsqueda"
              >
                <span className="hidden sm:inline">Cerrar</span>
                <X className="w-4 h-4 stroke-[1.5] group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </header>

            <div className="relative mb-10 md:mb-14 group/input">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar ${placeholder}...`}
                className={cn(
                  "w-full bg-transparent py-3 pr-10 text-xl sm:text-2xl md:text-4xl",
                  "text-charcoal placeholder-warm-400 font-serif font-light",
                  "border-b border-warm-300 focus:border-gold",
                  "focus:outline-none transition-colors duration-500",
                  "tracking-wide leading-tight"
                )}
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400 group-focus-within/input:text-gold transition-colors duration-300" />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.15em] text-warm-400 hover:text-warm-600 transition-colors duration-200"
                  aria-label="Limpiar"
                >
                  ×
                </button>
              )}

              <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-gold group-focus-within/input:w-full transition-[width] duration-700 ease-out" />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-dark -mx-1 px-1 pb-20">
              {!hasQuery ? (
                <div className="space-y-6 md:space-y-10">
                  <section>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-warm-600 mb-4">
                      Búsquedas frecuentes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_TERMS.map((term) => (
                        <SuggestedChip key={term} term={term} onClick={setQuery} />
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-warm-600 mb-4 md:mb-6">
                      Las más buscadas
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-[1fr_1.6fr] gap-4 md:gap-6">
                      {featured && (
                        <RecommendedCard
                          product={featured}
                          featured
                          onClose={onClose}
                        />
                      )}

                      <div className="flex flex-col justify-between">
                        {secondary.slice(0, 3).map((p) => (
                          <RecommendedCard key={p.id} product={p} onClose={onClose} />
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between mb-6">
<p className="text-[9px] uppercase tracking-[0.3em] text-warm-600">
                        Resultados
                      </p>
                      <span className="text-[10px] text-warm-600" aria-live="polite">
                      {loading
                        ? "buscando…"
                        : error
                          ? "error de búsqueda"
                          : `${results.length} ${results.length === 1 ? "fragancia" : "fragancias"}`}
                    </span>
                  </div>

                  {error ? (
                    <div className="flex flex-col items-start pt-4 pb-16">
                      <div className="h-[1px] w-full bg-warm-200/60 mb-10" />
                      <p className="text-[9px] uppercase tracking-[0.3em] text-warm-600 mb-4">
                        Error de búsqueda
                      </p>
                      <h3 className="font-serif text-2xl md:text-3xl text-warm-900 font-light leading-snug max-w-[28ch] mb-6">
                        No se pudo completar la búsqueda.
                      </h3>
                      <p className="text-xs text-warm-600 max-w-[44ch] leading-relaxed">
                        Inténtelo de nuevo en unos instantes.
                      </p>
                    </div>
                  ) : results.length > 0 ? (
                    <div>
                      {results.map((p) => (
                        <ResultRow key={p.id} product={p} onClose={onClose} />
                      ))}
                    </div>
                  ) : !loading ? (
                    <div className="flex flex-col items-start pt-4 pb-16">
                      <div className="h-[1px] w-full bg-warm-200/60 mb-10" />
                      <p className="text-[9px] uppercase tracking-[0.3em] text-warm-600 mb-4">
                        Sin coincidencias
                      </p>
                      <h3 className="font-serif text-2xl md:text-3xl text-warm-900 font-light leading-snug max-w-[28ch] mb-6">
                        &ldquo;{query}&rdquo; no pertenece a nuestra colección.
                      </h3>
                      <p className="text-xs text-warm-600 max-w-[44ch] leading-relaxed mb-8">
                        Pruebe con una nota olfativa (ámbar, bergamota), una familia (Floral, Amaderado) o el nombre exacto de la firma.
                      </p>
                      <button
                        onClick={() => setQuery("")}
                        className="text-[10px] uppercase tracking-[0.2em] text-gold hover:text-warm-900 transition-colors duration-300 pb-0.5 border-b border-gold/40 hover:border-warm-900/40"
                      >
                        Restablecer
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <footer className="mt-6 pt-4 border-t border-warm-200/60 flex items-center justify-between">
              <span className="text-[9px] text-warm-600 uppercase tracking-[0.2em]">
                esc para cerrar
              </span>
              <Link
                href="/productos"
                onClick={onClose}
                className="text-[9px] uppercase tracking-[0.2em] text-warm-600 hover:text-gold transition-colors duration-300 flex items-center gap-1.5"
              >
                Ver catálogo completo
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </footer>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
