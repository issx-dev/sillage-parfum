"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, safeNext, type LoginInput } from "@/lib/auth-schemas";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [showPassword, setShowPassword] = useState(false);
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

  const inputCls = (invalid: boolean) =>
    `w-full pl-10 pr-4 py-3 border bg-warm-50/20 text-charcoal text-xs tracking-wide focus:outline-none transition-colors placeholder:text-gray-400 ${
      invalid
        ? "border-red-400 focus:border-red-500"
        : "border-warm-200 focus:border-gold"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div
          role="alert"
          className="p-3 bg-red-50/60 border border-red-200/80 text-red-700 text-xs tracking-wide"
        >
          {serverError}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-[10px] font-medium tracking-[0.15em] text-charcoal uppercase mb-1.5"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
            className={inputCls(!!errors.email)}
          />
          <Mail className="w-4 h-4 text-warm-400 absolute left-3.5 top-3.5 pointer-events-none" />
        </div>
        {errors.email && (
          <p id="login-email-error" role="alert" className="mt-1.5 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block text-[10px] font-medium tracking-[0.15em] text-charcoal uppercase mb-1.5"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
            className={`${inputCls(!!errors.password)} pr-11`}
          />
          <Lock className="w-4 h-4 text-warm-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            className="absolute right-3 top-3 text-warm-400 hover:text-gold-dark transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" role="alert" className="mt-1.5 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full py-3.5 bg-black hover:bg-gold hover:text-black text-white font-sans text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Verificando...
          </>
        ) : (
          <>
            Acceder a mi cuenta <ArrowRight className="w-4 h-4" aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-24 min-h-screen bg-cream/30">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid overflow-hidden bg-white border border-warm-200/80 shadow-card lg:grid-cols-2">
          {/* Split panel: desktop only */}
          <div className="relative hidden lg:block min-h-[560px]">
            <Image
              src="/images/hero/hero-desktop.jpg"
              alt="Botella de perfume Sillage sobre fondo cálido"
              fill
              sizes="(max-width: 1024px) 0vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-10 text-cream">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold mb-2">
                Maison de Parfum
              </p>
              <p className="font-serif text-2xl leading-snug">
                Tu colección privada te espera.
              </p>
            </div>
          </div>

          {/* Form column: centered on mobile */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold-dark font-medium block mb-2">
                Maison de Parfum
              </span>
              <h1 className="font-serif text-3xl font-normal text-charcoal tracking-tight">
                Iniciar Sesión
              </h1>
              <div className="w-12 h-[1px] bg-gold mx-auto my-3" />
              <p className="text-xs text-gray-mid tracking-wide">
                Accede a tu colección privada y seguimiento de pedidos
              </p>
            </div>

            <Suspense>
              <LoginForm />
            </Suspense>

            <div className="mt-8 text-center text-xs text-gray-mid border-t border-warm-200/50 pt-5 tracking-wide">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/registro"
                className="text-gold-dark font-medium hover:underline uppercase text-[11px] tracking-wider ml-1"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
