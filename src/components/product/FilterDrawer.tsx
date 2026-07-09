"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";

const familyFilters = [
  { label: "Todos", value: undefined },
  { label: "Floral", value: "Floral" },
  { label: "Amaderado", value: "Amaderado" },
  { label: "Oriental", value: "Oriental" },
  { label: "Fresco", value: "Fresco" },
  { label: "Gourmand", value: "Gourmand" },
  { label: "Chipre", value: "Chipre" },
];

const genderFilters = [
  { label: "Todos", value: undefined },
  { label: "Masculino", value: "masculino" },
  { label: "Femenino", value: "femenino" },
  { label: "Unisex", value: "unisex" },
];

const badgeFilters = [
  { label: "Todos", value: undefined },
  { label: "Novedades", value: "nuevo" },
  { label: "Ofertas", value: "oferta" },
  { label: "Top Ventas", value: "top_ventas" },
];

interface FilterDrawerProps {
  gender?: string;
  family?: string;
  badge?: string;
  activeFiltersCount: number;
}

export function FilterDrawer({ gender, family, badge, activeFiltersCount }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  // Auto-close drawer whenever filters update (navigation happens)
  useEffect(() => {
    setOpen(false);
  }, [gender, family, badge]);

  const buildHref = (overrides: { family?: string; gender?: string; badge?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(overrides).forEach(([key, val]) => {
      if (val === undefined) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    
    const qs = params.toString();
    return qs ? `/productos?${qs}` : "/productos";
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center justify-center gap-2 border border-warm-200 bg-white hover:bg-warm-50 text-charcoal px-5 h-11 rounded-full hover:border-gold transition-colors duration-300 text-[11px] uppercase tracking-[0.15em] font-sans font-medium shadow-sm cursor-pointer">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gold-dark" />
          Filtrar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-overlay-fade" />
        <Dialog.Content aria-modal="true" className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[400px] bg-cream border-l border-warm-200/50 p-6 shadow-2xl flex flex-col justify-between animate-drawer-slide">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-warm-200/30 pb-4 mb-6 shrink-0">
              <Dialog.Title className="font-serif text-xl tracking-wide">Filtros</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 -mr-2 text-gray-mid hover:text-black transition-colors cursor-pointer" aria-label="Cerrar filtros">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-6 overflow-y-auto overscroll-y-contain flex-1 pr-1 pb-6 scrollbar-dark">
              {/* Género */}
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                  Género
                </span>
                <div className="flex flex-wrap gap-2 pb-2">
                  {genderFilters.map((filter) => {
                    const isActive =
                      filter.value === gender || (filter.value === undefined && !gender);
                    return (
                      <Link
                        key={filter.label}
                        href={buildHref({ gender: filter.value })}
                        className={`px-4 py-1.5 rounded-full text-xs font-sans transition-[background-color,color,border-color] duration-200 min-h-[44px] flex items-center border ${
                          isActive
                            ? "bg-black text-cream border-black font-medium"
                            : "border-gray-light bg-white/50 text-charcoal/80 hover:border-gold hover:bg-black hover:text-cream"
                        }`}
                      >
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Colección */}
              <div className="pt-5 border-t border-warm-200/30">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                  Colección
                </span>
                <div className="flex flex-wrap gap-2 pb-2">
                  {badgeFilters.map((filter) => {
                    const isActive =
                      filter.value === badge || (filter.value === undefined && !badge);
                    return (
                      <Link
                        key={filter.label}
                        href={buildHref({ badge: filter.value })}
                        className={`px-4 py-1.5 rounded-full text-xs font-sans transition-[background-color,color,border-color] duration-200 min-h-[44px] flex items-center border ${
                          isActive
                            ? "bg-black text-cream border-black font-medium"
                            : "border-gray-light bg-white/50 text-charcoal/80 hover:border-gold hover:bg-black hover:text-cream"
                        }`}
                      >
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Familia Olfativa */}
              <div className="pt-5 border-t border-warm-200/30">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                  Familia Olfativa
                </span>
                <div className="flex flex-wrap gap-2 pb-2">
                  {familyFilters.map((filter) => {
                    const isActive =
                      filter.value === family || (filter.value === undefined && !family);
                    return (
                      <Link
                        key={filter.label}
                        href={buildHref({ family: filter.value })}
                        className={`px-4 py-1.5 rounded-full text-xs font-sans transition-[background-color,color,border-color] duration-200 min-h-[44px] flex items-center border ${
                          isActive
                            ? "bg-black text-cream border-black font-medium"
                            : "border-gray-light bg-white/50 text-charcoal/80 hover:border-gold hover:bg-black hover:text-cream"
                        }`}
                      >
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
