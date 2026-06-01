"use client";

import type { CartItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

interface AddToCartButtonProps {
  item: CartItem;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({ item, disabled, className }: AddToCartButtonProps) {
  const [pulse, setPulse] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const handleClick = () => {
    if (disabled) return;
    addItem(item);
    openCart();
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full transition-transform duration-200 ${pulse ? "scale-95" : ""} ${className || ""}`}
    >
      {disabled ? "Agotado" : "Añadir al carrito"}
    </Button>
  );
}
