"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Package, LogOut, Gift, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
      })
      .then((data) => {
        if (data.user) setUser(data.user);
        else router.push("/login");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-24 sm:pt-28 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Profile Box */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gold/10 text-gold rounded-full flex items-center justify-center text-xl font-bold border border-gold/30">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-xs text-red-600 hover:bg-red-50 border-red-200 flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Orders Box */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 md:col-span-2">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-gold" /> Mis Pedidos Reientes
              </h2>
            </div>

            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Aún no has realizado ningún pedido</p>
              <p className="text-xs text-gray-400 mt-1">Tus compras de perfumes Chogan aparecerán aquí.</p>
            </div>
          </div>

          {/* User Benefits Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-serif text-base font-bold flex items-center gap-2 border-b border-gray-100 pb-2">
                <Gift className="w-4 h-4 text-gold" /> Cupón de Club
              </h3>
              <div className="p-3 bg-gold/10 text-gold-dark rounded-xl text-center border border-gold/20">
                <span className="text-xs uppercase font-semibold block text-gray-600 mb-1">Código de Bienvenida</span>
                <span className="font-mono text-base font-bold">BIENVENIDA10</span>
                <span className="text-[10px] block text-gray-500 mt-1">10% DTO en tu primera compra</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-3">
              <h3 className="font-serif text-base font-bold flex items-center gap-2 border-b border-gray-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-green-600" /> Beneficios VIP
              </h3>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-center gap-2">✓ Envíos prioritarios 24-48h</li>
                <li className="flex items-center gap-2">✓ Opción de Pago Contra Reembolso</li>
                <li className="flex items-center gap-2">✓ Acceso anticipado a promociones 2x63€</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
