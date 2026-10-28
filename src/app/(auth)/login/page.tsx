"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthField } from "@/components/auth/AuthField";
import { loginSchema, safeNext, type LoginInput } from "@/lib/auth-schemas";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
      router.push(next);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div
          role="alert"
          className="border border-red-700/40 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {serverError}
        </div>
      )}

      <AuthField
        id="login-email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <AuthField
        id="login-password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 bg-charcoal text-sm font-medium tracking-wide text-cream transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Verificando...
          </>
        ) : (
          <>
            Acceder a mi cuenta <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <h1 className="font-serif text-4xl leading-tight text-charcoal">Bienvenido de nuevo</h1>
      <p className="mb-8 mt-2 text-base text-gray-mid">
        Entra para seguir tus pedidos y guardar tus favoritos.
      </p>

      <Suspense>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-sm text-gray-mid">
        ¿Primera vez aquí?{" "}
        <Link
          href="/registro"
          className="font-medium text-gold-dark underline underline-offset-4 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark"
        >
          Crear una cuenta
        </Link>
      </p>
    </>
  );
}
