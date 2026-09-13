"use client";

import { useRef } from "react";

/**
 * AutoSubmitForm — filtros admin que filtran solos, con debounce.
 *
 * Envuelve el <form method="get"> de filtros: los <select> disparan al
 * instante y el texto espera `debounceMs` tras la última tecla para no
 * acribillar al servidor en cada pulsación. Al cambiar filtros la página
 * vuelve a 1 (el form no incluye `page`, el servidor lo asume).
 */
export function AutoSubmitForm({
  children,
  className,
  debounceMs = 400,
}: {
  children: React.ReactNode;
  className?: string;
  debounceMs?: number;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSubmit(form: HTMLFormElement): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      form.requestSubmit();
    }, debounceMs);
  }

  return (
    <form
      method="get"
      className={className}
      onChange={(event) => {
        const target = event.target as HTMLElement;
        if (target instanceof HTMLSelectElement) {
          if (timer.current) clearTimeout(timer.current);
          event.currentTarget.requestSubmit();
        }
      }}
      onInput={(event) => {
        const target = event.target as HTMLElement;
        if (target instanceof HTMLInputElement) {
          scheduleSubmit(event.currentTarget);
        }
      }}
    >
      {children}
    </form>
  );
}
