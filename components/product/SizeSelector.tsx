"use client";

import type { Variant } from "@/types";
import { cn } from "@/lib/utils";

interface SizeSelectorProps {
  variants: Variant[];
  selectedId?: string;
  onSelect: (variant: Variant) => void;
}

export function SizeSelector({ variants, selectedId, onSelect }: SizeSelectorProps) {
  return (
    <div className="flex gap-2">
      {variants.map((v) => {
        const isSelected = v.id === selectedId;
        const isDisabled = v.stock === 0;

        return (
          <button
            key={v.id}
            onClick={() => !isDisabled && onSelect(v)}
            disabled={isDisabled}
            className={cn(
              "px-3 py-1.5 text-sm border rounded transition-[background-color,color,border-color,transform] duration-200 min-w-[50px] min-h-[44px]",
              isSelected
                ? "border-gold bg-black text-cream"
                : "border-gray-light text-gray-mid hover:border-gold",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            title={isDisabled ? "Agotado" : undefined}
          >
            {v.size_ml}ml
          </button>
        );
      })}
    </div>
  );
}
