"use client";

import type { Variant } from "@/types";
import { cn } from "@/lib/utils";

interface SizeSelectorProps {
  variants: Variant[];
  selectedVariant?: Variant;
  onSelect?: (variant: Variant) => void;
}

export function SizeSelector({ variants, selectedVariant, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {variants.map((v) => {
        const isSelected = selectedVariant?.id === v.id;
        const isDisabled = v.stock === 0;

        return (
          <button
            key={v.id}
            onClick={() => !isDisabled && onSelect?.(v)}
            disabled={isDisabled}
            className={cn(
              "px-4 py-2 text-xs sm:text-sm border transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-300 min-w-[64px] min-h-[44px] rounded-md font-sans tracking-wide cursor-pointer",
              isSelected
                ? "border-charcoal text-charcoal font-semibold bg-warm-100/50 shadow-xs scale-102"
                : "border-warm-300 text-gray-mid bg-transparent hover:border-charcoal hover:text-charcoal",
              isDisabled && "opacity-30 cursor-not-allowed line-through hover:border-warm-300 hover:text-gray-mid"
            )}
            title={isDisabled ? "Agotado" : undefined}
          >
            {v.size_ml} ml
          </button>
        );
      })}
    </div>
  );
}
