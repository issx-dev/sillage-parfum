"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      router.push("/cuenta");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 sm:pt-36 pb-24 min-h-screen bg-cream/30 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white border border-warm-200/80 p-8 sm:p-10 shadow-card">
          
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold-dark font-medium block mb-2">
              Maison de Parfum
            </span>
            <h1 className="font-serif text-3xl font-normal text-charcoal tracking-tight">Iniciar Sesión</h1>
            <div className="w-12 h-[1px] bg-gold mx-auto my-3" />
            <p className="text-xs text-gray-mid tracking-wide">Accede a tu colección privada y seguimiento de pedidos</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50/60 border border-red-200/80 text-red-700 text-xs tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-[10px] font-medium tracking-[0.15em] text-charcoal uppercase mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-warm-200 bg-warm-50/20 text-charcoal text-xs tracking-wide focus:outline-none focus:border-gold transition-colors placeholder:text-gray-400"
                />
                <Mail className="w-4 h-4 text-warm-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[10px] font-medium tracking-[0.15em] text-charcoal uppercase mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-warm-200 bg-warm-50/20 text-charcoal text-xs tracking-wide focus:outline-none focus:border-gold transition-colors placeholder:text-gray-400"
                />
                <Lock className="w-4 h-4 text-warm-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-gold hover:text-black text-white font-sans text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading ? "Verificando..." : "Acceder a mi cuenta"} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-mid border-t border-warm-200/50 pt-5 tracking-wide">
            ¿Aún no tienes cuenta?{" "}
            <Link href="/registro" className="text-gold-dark font-medium hover:underline uppercase text-[11px] tracking-wider ml-1">
              Crear cuenta
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
