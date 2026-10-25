"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { syncCart } from "@/lib/cart-sync";

const SYNC_INTERVAL_MS = 30_000;

/** Keeps the persisted cart aligned with the database while the tab is visible. */
export function CartSync() {
  const hydrated = useCartStore((s) => s._hasHydrated);
  const isCartOpen = useCartStore((s) => s.isCartOpen);

  useEffect(() => {
    if (!hydrated) return;
    void syncCart();

    const onVisible = () => {
      if (document.visibilityState === "visible") void syncCart();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, SYNC_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && isCartOpen) void syncCart();
  }, [hydrated, isCartOpen]);

  return null;
}
