"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
}

const inputBase =
  "h-12 w-full border bg-warm-50 px-4 text-base text-charcoal placeholder:text-gray-mid/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark/40";

/** Labelled input for the auth forms. Password fields get a show/hide toggle. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, error, hint, type = "text", className = "", ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${error ? "border-red-700" : "border-warm-500 hover:border-warm-700 focus-visible:border-gold-dark"} ${isPassword ? "pr-12" : ""} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-gray-mid transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark/40"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-gray-mid">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
