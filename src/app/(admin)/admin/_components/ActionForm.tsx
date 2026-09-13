"use client";

import { useFormState } from "react-dom";

type FormState = { error: string | null };

const INITIAL_STATE: FormState = { error: null };

function isRedirectError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * ActionForm — <form> para Server Actions del backoffice con error inline.
 *
 * Sin esto, cualquier throw de la acción (slug duplicado, SKU duplicado,
 * confirmación incorrecta) cae en el error boundary de página completa
 * ("Algo salió mal"). Con esto, el error aparece sobre el formulario y el
 * admin conserva lo escrito.
 *
 * El redirect() de éxito se re-lanza (es un throw de control de Next).
 */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useFormState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      try {
        await action(formData);
        return INITIAL_STATE;
      } catch (error) {
        if (isRedirectError(error)) throw error;
        return { error: error instanceof Error ? error.message : "Error inesperado." };
      }
    },
    INITIAL_STATE
  );

  return (
    <form action={formAction} className={className}>
      {state.error && (
        <div
          role="alert"
          className="rounded-card border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {state.error}
        </div>
      )}
      {children}
    </form>
  );
}
