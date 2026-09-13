"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

/**
 * ToastOnParam — toast de éxito tras un redirect de Server Action.
 *
 * Las actions que navegan (crear → ficha, borrar → listado) no pueden
 * toastear antes de redirigir: añaden `?toast=<clave>` a la URL destino
 * y este componente, montado en la página de aterrizaje, muestra el toast
 * una vez y limpia el parámetro sin recargar.
 */
const MESSAGES: Record<string, string> = {
  creado: "Producto creado. Completa su ficha.",
  eliminado: "Producto eliminado.",
};

export function ToastOnParam() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key) return;
    const message = MESSAGES[key];
    if (message) toast.success(message);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const query = params.toString();
    router.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname, {
      scroll: false,
    });
    // Se dispara una vez por montaje con ?toast=: el replace limpia el
    // parámetro y el efecto no vuelve a encontrarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
