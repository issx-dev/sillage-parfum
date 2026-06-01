"use client";

import { useCartStore } from "@/store/cartStore";
import { CartDrawer } from "@/components/layout/CartDrawer";

export function CartDrawerWrapper() {
  const isCartOpen = useCartStore((s) => s.isCartOpen);
  const closeCart = useCartStore((s) => s.closeCart);

  return <CartDrawer open={isCartOpen} onOpenChange={(open) => !open && closeCart()} />;
}
