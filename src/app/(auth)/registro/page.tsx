"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { AuthField } from "@/components/auth/AuthField";
import { registerSchema, type RegisterInput } from "@/lib/auth-schemas";

function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al crear la cuenta");
      toast.success(`¡Bienvenido/a, ${values.name.split(" ")[0]}! Descubre el catálogo.`);
      router.push("/productos");
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
        id="reg-name"
        label="Nombre completo"
        autoComplete="name"
        placeholder="Tu nombre"
        error={errors.name?.message}
        {...register("name")}
      />

      <AuthField
        id="reg-email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <AuthField
        id="reg-password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 6 caracteres."
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
            Creando...
          </>
        ) : (
          <>
            Registrarme <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>

      <p className="text-xs text-gray-mid">
        Al registrarte aceptas la{" "}
        <Link href="/legal/privacidad" className="underline underline-offset-2 hover:text-charcoal">
          política de privacidad
        </Link>
        .
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-serif text-4xl leading-tight text-charcoal">Crea tu cuenta</h1>
      <p className="mb-8 mt-2 text-base text-gray-mid">
        Sigue tus pedidos y guarda tus perfumes favoritos.
      </p>

      <Suspense>
        <RegisterForm />
      </Suspense>

      <p className="mt-8 text-sm text-gray-mid">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-gold-dark underline underline-offset-4 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark"
        >
          Iniciar sesión
        </Link>
      </p>
    </>
  );
}
