"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import toast from "react-hot-toast";

type FormState = { error: string | null; successAt: number | null };

const INITIAL_STATE: FormState = { error: null, successAt: null };

function isRedirectError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * Dispara el toast de éxito una sola vez al montarse (tras un envío
 * exitoso). Se desmonta al siguiente envío y vuelve a montarse —y a
 * toastear— solo si ese envío también tiene éxito.
 */
function SuccessToast({ message }: { message: string }) {
  useEffect(() => {
    toast.success(message);
  }, [message]);
  return null;
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
  successMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  /**
   * Si se indica, al resolverse la acción sin error se muestra este toast
   * de éxito. Los redirect() de éxito no toastean (navegan a otra página:
   * usa ToastOnParam allí).
   */
  successMessage?: string;
}) {
  const [state, formAction] = useFormState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      try {
        await action(formData);
        return { error: null, successAt: Date.now() };
      } catch (error) {
        if (isRedirectError(error)) throw error;
        return { error: error instanceof Error ? error.message : "Error inesperado.", successAt: null };
      }
    },
    INITIAL_STATE
  );

  if (state.successAt !== null && successMessage) {
    return (
      <form action={formAction} className={className}>
        <SuccessToast key={state.successAt} message={successMessage} />
        {children}
      </form>
    );
  }

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
