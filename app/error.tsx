"use client";

import { useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="pt-20 pb-16 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="font-serif text-3xl mb-4">Algo salió mal</h1>
        <p className="text-gray-mid mb-8">
          Lo sentimos, hemos encontrado un error inesperado.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-black text-cream rounded hover:bg-gray-mid transition-colors min-h-[44px]"
        >
          Intentar de nuevo
        </button>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-mid underline"
            >
              {showDetails ? "Ocultar detalles" : "Mostrar detalles"}
            </button>
            {showDetails && (
              <pre className="mt-2 p-4 bg-gray-light rounded text-xs overflow-auto max-w-full">
                {error.message}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
