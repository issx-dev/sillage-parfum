"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  LogOut,
  Gift,
  ShieldCheck,
  Copy,
  Check,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
  size_ml?: number;
}

interface MineOrder {
  id: string;
  total: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  couponCode: string | null;
  paymentMethod: string | null;
  items: OrderItem[];
  createdAt: string;
}

const PAYMENT_LABELS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Pagado", cls: "bg-green-50 text-green-700 border-green-200" },
  pending: { label: "Pendiente de pago", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  refunded: { label: "Reembolsado", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  failed: { label: "Fallido", cls: "bg-red-50 text-red-600 border-red-200" },
};

const FULFILLMENT_LABELS: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-warm-100 text-charcoal border-warm-200" },
  en_preparacion: { label: "En preparación", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  enviado: { label: "Enviado", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  recibido: { label: "Recibido", cls: "bg-green-50 text-green-700 border-green-200" },
};

function StatusBadge({ value, map }: { value: string; map: Record<string, { label: string; cls: string }> }) {
  const entry = map[value] ?? { label: value, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function CouponCard({
  code,
  description,
  highlight,
  onCopied,
  copied,
}: {
  code: string;
  description: string;
  highlight?: boolean;
  copied: boolean;
  onCopied: (code: string) => void;
}) {
  return (
    <div
      className={`p-4 rounded-xl border text-center ${
        highlight ? "bg-gold/10 border-gold/30" : "bg-warm-50 border-warm-200"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-1">
        {description}
      </span>
      <span className="font-mono text-lg font-bold text-charcoal">{code}</span>
      <button
        type="button"
        onClick={() => onCopied(code)}
        aria-label={`Copiar cupón ${code}`}
        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-gold-dark hover:underline"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "¡Copiado!" : "Copiar código"}
      </button>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<MineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/auth/me"), fetch("/api/orders/mine")])
      .then(async ([meRes, ordersRes]) => {
        if (!meRes.ok) throw new Error("No autenticado");
        const me = await meRes.json();
        if (!me.user) throw new Error("No autenticado");
        setUser(me.user);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* portapapeles no disponible: el código sigue visible para copiar a mano */
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
  };

  if (loading) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-cream/30 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const totalSpent = orders.reduce((acc, o) => acc + o.total, 0);
  const hasOrders = orders.length > 0;
  const initial = user.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="pt-24 sm:pt-28 pb-16 min-h-screen bg-cream/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold-dark font-medium mb-2">
          Maison de Parfum · Mi cuenta
        </p>

        {/* Header perfil */}
        <div className="bg-white p-6 sm:p-8 shadow-card border border-warm-200/80 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gold/10 text-gold-dark rounded-full flex items-center justify-center text-xl font-serif font-bold border border-gold/30">
              {initial}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-charcoal">{user.name}</h1>
              <p className="text-xs text-gray-mid tracking-wide">{user.email}</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-warm-200/80 shadow-card p-5 flex items-center gap-4">
            <ShoppingBag className="w-6 h-6 text-gold" />
            <div>
              <p className="font-serif text-2xl text-charcoal">{orders.length}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-mid">
                {orders.length === 1 ? "Pedido" : "Pedidos"}
              </p>
            </div>
          </div>
          <div className="bg-white border border-warm-200/80 shadow-card p-5 flex items-center gap-4">
            <Wallet className="w-6 h-6 text-gold" />
            <div>
              <p className="font-serif text-2xl text-charcoal">
                {totalSpent.toFixed(2).replace(".", ",")} €
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-mid">Total gastado</p>
            </div>
          </div>
          <div className="bg-white border border-warm-200/80 shadow-card p-5 flex items-center gap-4">
            <Gift className="w-6 h-6 text-gold" />
            <div>
              <p className="font-serif text-2xl text-charcoal">{hasOrders ? 1 : 2}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-mid">
                {hasOrders ? "Cupón disponible" : "Cupones disponibles"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pedidos */}
          <section className="bg-white p-6 shadow-card border border-warm-200/80 lg:col-span-2">
            <div className="flex items-center justify-between mb-5 border-b border-warm-200/60 pb-3">
              <h2 className="font-serif text-lg text-charcoal flex items-center gap-2">
                <Package className="w-5 h-5 text-gold" /> Mis pedidos
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-mid">
                {orders.length} en total
              </span>
            </div>

            {!hasOrders ? (
              <div className="text-center py-10 bg-cream/40 border border-dashed border-warm-200">
                <Package className="w-10 h-10 text-warm-300 mx-auto mb-2" />
                <p className="text-sm text-charcoal font-medium">Aún no has realizado ningún pedido</p>
                <p className="text-xs text-gray-mid mt-1 mb-5">
                  Tus compras aparecerán aquí con su estado de pago y envío.
                </p>
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-black transition-colors"
                >
                  Explorar catálogo
                </Link>
              </div>
            ) : (
              <ol className="space-y-4">
                {orders.map((order) => (
                  <li key={order.id} className="border border-warm-200/80 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-xs font-mono text-gray-mid">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-gray-mid">
                          {new Date(order.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <p className="font-serif text-xl text-charcoal">
                        {order.total.toFixed(2).replace(".", ",")} €
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <StatusBadge value={order.paymentStatus} map={PAYMENT_LABELS} />
                      <StatusBadge value={order.fulfillmentStatus} map={FULFILLMENT_LABELS} />
                      {order.paymentMethod && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full bg-gray-100 text-gray-600 border-gray-200">
                          {order.paymentMethod === "cod" ? "Contrareembolso" : order.paymentMethod}
                        </span>
                      )}
                      {order.couponCode && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded-full bg-gold/10 text-gold-dark border-gold/30">
                          Cupón {order.couponCode}
                        </span>
                      )}
                    </div>
                    {order.items.length > 0 && (
                      <ul className="text-xs text-gray-mid space-y-1 border-t border-warm-200/60 pt-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between gap-2">
                            <span>
                              {item.quantity ?? 1}× {item.name ?? "Fragancia"}
                              {item.size_ml ? ` (${item.size_ml} ml)` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white p-6 shadow-card border border-warm-200/80">
              <h3 className="font-serif text-base text-charcoal flex items-center gap-2 border-b border-warm-200/60 pb-2 mb-4">
                <Gift className="w-4 h-4 text-gold" /> Mis cupones
              </h3>
              <div className="space-y-3">
                {!hasOrders && (
                  <CouponCard
                    code="BIENVENIDA10"
                    description="Bienvenida · −10% primer pedido"
                    highlight
                    copied={copiedCode === "BIENVENIDA10"}
                    onCopied={handleCopy}
                  />
                )}
                <CouponCard
                  code="SILLAGE2"
                  description="Club · −10% siempre"
                  copied={copiedCode === "SILLAGE2"}
                  onCopied={handleCopy}
                />
                {hasOrders && (
                  <p className="text-[11px] text-gray-mid leading-relaxed">
                    BIENVENIDA10 ya se aplicó a tu primer pedido — por eso solo ves los cupones
                    activos de tu cuenta.
                  </p>
                )}
              </div>
            </section>

            <section className="bg-white p-6 shadow-card border border-warm-200/80">
              <h3 className="font-serif text-base text-charcoal flex items-center gap-2 border-b border-warm-200/60 pb-2 mb-4">
                <User className="w-4 h-4 text-gold" /> Mis datos
              </h3>
              <dl className="text-xs space-y-3">
                <div>
                  <dt className="uppercase tracking-[0.2em] text-[10px] text-gray-mid mb-0.5">Nombre</dt>
                  <dd className="text-charcoal font-medium">{user.name}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em] text-[10px] text-gray-mid mb-0.5">Email</dt>
                  <dd className="text-charcoal font-medium break-all">{user.email}</dd>
                </div>
              </dl>
            </section>

            <section className="bg-black text-cream p-6">
              <h3 className="font-serif text-base flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-gold" /> Beneficios VIP
              </h3>
              <ul className="text-xs space-y-2 text-cream/80">
                <li>✓ Envíos prioritarios 24-48h</li>
                <li>✓ Opción de pago contra reembolso</li>
                <li>✓ Acceso anticipado a promociones 2×63€</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
