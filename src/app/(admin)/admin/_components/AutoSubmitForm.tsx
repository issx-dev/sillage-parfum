"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * AutoSubmitForm — filtros admin que filtran solos, con debounce,
 * SIN recargar la página: actualiza solo los searchParams por navegación
 * de cliente (router.replace). El layout y el sidebar ni se inmutan;
 * únicamente la región <Suspense> del listado se re-renderiza.
 *
 * Los <select> disparan al instante, el texto espera `debounceMs` tras
 * la última tecla y Enter aplica de inmediato. Al cambiar filtros la
 * página vuelve a 1. Los valores vacíos se omiten (URLs limpias).
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
  const router = useRouter();
  const pathname = usePathname();
  const zoneRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function collect(): URLSearchParams {
    const params = new URLSearchParams();
    zoneRef.current
      ?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]")
      .forEach((el) => {
        if (el.value.trim() !== "") params.set(el.name, el.value.trim());
      });
    return params;
  }

  function apply(): void {
    const query = collect().toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function scheduleApply(): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(apply, debounceMs);
  }

  return (
    <div
      ref={zoneRef}
      role="search"
      className={className}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) {
          if (timer.current) clearTimeout(timer.current);
          apply();
        }
      }}
      onInput={(event) => {
        if (event.target instanceof HTMLInputElement) scheduleApply();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          if (timer.current) clearTimeout(timer.current);
          apply();
        }
      }}
    >
      {children}
    </div>
  );
}
