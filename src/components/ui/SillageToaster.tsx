"use client";

import { Toaster } from "react-hot-toast";

/**
 * Toaster global SILLAGE — única instancia, montada en el shell de tienda.
 * Paleta gold/cream propia: fondo cream, texto charcoal, acento gold-dark.
 */
export function SillageToaster() {
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      toastOptions={{
        duration: 2600,
        style: {
          background: "var(--color-cream)",
          color: "var(--color-charcoal)",
          border: "1px solid var(--color-gold)",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: {
          iconTheme: { primary: "var(--color-gold-dark)", secondary: "var(--color-cream)" },
        },
        error: {
          style: {
            background: "var(--color-cream)",
            color: "var(--color-charcoal)",
            border: "1px solid var(--color-terracotta)",
            borderRadius: "12px",
            fontSize: "14px",
          },
          iconTheme: { primary: "var(--color-terracotta)", secondary: "var(--color-cream)" },
        },
      }}
    />
  );
}
