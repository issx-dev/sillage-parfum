"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "p-2 min-w-[44px] min-h-[44px] rounded-full bg-cream/80 backdrop-blur-sm flex items-center justify-center transition-[transform,opacity] duration-200 hover:scale-110",
        className
      )}
      aria-label={isWishlisted ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-[color,transform] duration-200",
          isWishlisted ? "fill-gold-dark text-gold-dark" : "text-gray-mid"
        )}
      />
    </button>
  );
}
