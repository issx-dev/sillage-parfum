"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Lock, Truck, Sparkles, ShieldCheck, CreditCard, ChevronDown, Tag } from "lucide-react";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getDiscountedTotal());
  const savings = useCartStore((s) => s.getSavings());
  const clearCart = useCartStore((s) => s.clearCart);

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStripeFaq, setShowStripeFaq] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);

  // Form Fields (Gymshark + Sillage Luxury Checkout)
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("España");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream/20 pt-28 sm:pt-36 pb-24">
        <div className="max-w-md mx-auto px-4 text-center py-16 bg-white border border-warm-200/80 rounded-card shadow-card">
          <h1 className="font-serif text-2xl font-semibold mb-3 text-charcoal">Tu carrito está vacío</h1>
          <p className="text-gray-mid text-sm mb-6">Añade tus fragancias Sillage para proceder con el pedido.</p>
          <Link
            href="/productos"
            className="inline-flex items-center justify-center px-6 py-3 bg-charcoal text-white font-medium text-xs uppercase tracking-widest rounded-md hover:bg-black transition-colors"
          >
            Explorar catálogo
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitCod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            email,
            country,
            firstName,
            lastName,
            company,
            address,
            additionalInfo,
            postalCode,
            city,
            province,
            deliveryPhone,
            subscribeNewsletter,
          },
          items,
          total,
          paymentMethod: "cod",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el pedido contra reembolso");

      clearCart();
      window.location.href = data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado durante la confirmación");
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customerEmail: email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al conectar con la pasarela de pago");

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error con la pasarela de pago");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream/20 font-sans text-charcoal pt-32 sm:pt-36 lg:pt-40 pb-24">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Superior & Seguridad */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-warm-200/50 pb-3">
          <Link
            href="/carrito"
            className="inline-flex items-center text-[11px] sm:text-xs font-medium uppercase tracking-wider text-gray-mid hover:text-gold-dark transition-colors whitespace-nowrap"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> <span className="hidden sm:inline">Seguir comprando</span><span className="sm:hidden">Volver</span>
          </Link>
          <h1 className="font-serif text-lg sm:text-2xl text-charcoal tracking-wide">Checkout</h1>
          <div
            className="flex items-center gap-1.5 text-xs text-gold-dark font-medium bg-gold/10 p-1.5 sm:px-3 sm:py-1 rounded-full border border-gold/20 flex-shrink-0"
            title="Pago 100% Seguro"
            aria-label="Pago 100% Seguro"
          >
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Pago 100% Seguro</span>
          </div>
        </div>

        {/* 📱 Gymshark Mobile Collapsible Order Summary Accordion (< lg screens) */}
        <div className="lg:hidden mb-6 border border-warm-200 rounded-lg bg-white overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full p-3.5 flex items-center justify-between bg-warm-50/60 cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-warm-200 rounded flex items-center justify-center relative flex-shrink-0">
                <Image
                  src={items[0]?.image || "/images/og-default.jpg"}
                  alt="Resumen"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <span className="font-serif text-sm font-semibold text-charcoal block">Total</span>
                <span className="text-xs text-gray-mid">{totalItemsCount} {totalItemsCount === 1 ? "artículo" : "artículos"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-mid font-mono">EUR</span>
              <span className="text-sm font-bold font-mono text-charcoal">{formatPrice(total)}</span>
              <ChevronDown className={`w-4 h-4 text-gray-mid transition-transform ${showMobileSummary ? "rotate-180" : ""}`} />
            </div>
          </button>

          {/* Trigger para agregar descuento rápido */}
          <div className="px-3.5 py-2 border-t border-warm-200/50 bg-white flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-warm-100/70 hover:bg-warm-100 border border-warm-200 rounded-full text-[11px] font-semibold text-charcoal uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 text-gold-dark" /> AGREGAR DESCUENTO
            </button>
            {savings > 0 && (
              <span className="text-[11px] text-gold-dark font-medium">Ahorro: -{formatPrice(savings)}</span>
            )}
          </div>

          {/* Input de cupón desplegable en móvil */}
          {showDiscountInput && (
            <div className="p-3.5 bg-warm-50/40 border-t border-warm-200 flex gap-2">
              <input
                type="text"
                placeholder="Código de descuento"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-warm-200 rounded text-xs text-charcoal placeholder:text-gray-mid focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { if (couponCode) alert(`Código ${couponCode} aplicado`); }}
                className="px-3 py-2 bg-charcoal text-white rounded text-xs font-semibold uppercase tracking-wider"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Resumen detallado expandido en móvil */}
          {showMobileSummary && (
            <div className="p-4 border-t border-warm-200 space-y-4 bg-white">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-warm-50 rounded border border-warm-200 relative flex-shrink-0 flex items-center justify-center">
                        <Image src={item.image} alt={item.name} width={32} height={32} className="object-contain p-0.5" />
                        <span className="absolute -top-1 -right-1 bg-charcoal text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-charcoal block truncate max-w-[180px]">{item.name}</span>
                        <span className="text-[10px] text-gray-mid">{item.size_ml} ml</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-warm-200/60 pt-3 space-y-1.5 text-xs text-gray-mid">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-charcoal">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span className="text-gold-dark font-medium">Gratis</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitCod} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Columna Izquierda: PAGO PRIMERO + DATOS PERSONALES */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* 1. PAGO (COLOCADO ARRIBA DEL TODO) */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-charcoal">
                Pago
              </h2>

              <div className="space-y-4">
                {/* Opción 1: Contra reembolso */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-center justify-between p-4 rounded-md border cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-charcoal bg-warm-100/50 shadow-xs"
                      : "border-warm-200 hover:border-warm-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === "cod" ? "border-charcoal bg-charcoal" : "border-warm-300"
                    }`}>
                      {paymentMethod === "cod" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="font-medium text-sm text-charcoal flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gold-dark" /> Contra reembolso
                    </span>
                  </div>
                  <span className="text-xs text-gray-mid font-light">Pago al recibir</span>
                </div>

                {/* Botón de confirmación para Contra Reembolso */}
                {paymentMethod === "cod" && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-charcoal hover:bg-black text-white font-semibold text-xs uppercase tracking-[0.18em] rounded-md shadow-md transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {loading ? "Procesando pedido..." : "PAGAR AHORA (CONTRA REEMBOLSO)"}
                  </button>
                )}

                {/* Separador - o - */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="border-t border-warm-200 w-full" />
                  <span className="absolute bg-cream/20 px-4 text-xs font-serif italic text-gray-mid">
                    o
                  </span>
                </div>

                {/* Opción 2: Pagar con Stripe */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={loading}
                    className="w-full py-4 px-6 bg-slate-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-[0.18em] rounded-md shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                  >
                    <CreditCard className="w-4.5 h-4.5 text-gold" />
                    <span>PAGAR CON STRIPE</span>
                  </button>

                  {/* FAQ / Módulo Informativo de Stripe */}
                  <div className="bg-white border border-warm-200/80 rounded-md p-4 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setShowStripeFaq(!showStripeFaq)}
                      className="w-full flex items-center justify-between text-left text-xs font-semibold text-charcoal cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-gold-dark" />
                        ¿Qué es Stripe y qué métodos de pago admite?
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-mid transition-transform ${showStripeFaq ? "rotate-180" : ""}`} />
                    </button>

                    {showStripeFaq && (
                      <div className="text-[11px] text-gray-mid leading-relaxed space-y-2 pt-2 border-t border-warm-200/50">
                        <p>
                          <strong>Stripe</strong> es la pasarela de pago oficial de máxima seguridad utilizada por marcas líderes internacionales como Amazon, Google y Shopify.
                        </p>
                        <p>
                          Permite pagar de forma instantánea con <strong>Tarjetas de crédito/débito (Visa, Mastercard, Amex)</strong>, <strong>Apple Pay</strong> y <strong>Google Pay</strong> con encriptación bancaria de extremo a extremo.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* 2. CONTACTO (DATOS PERSONALES) */}
            <div className="space-y-3 sm:space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-charcoal">
                  Contacto
                </h2>
                <Link href="/login" className="text-xs text-gold-dark hover:underline font-medium">
                  Iniciar sesión
                </Link>
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Correo electrónico *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-charcoal/80 cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="rounded border-warm-300 text-gold-dark focus:ring-gold"
                  />
                  Enviarme novedades y ofertas por correo electrónico
                </label>
              </div>
            </div>

            {/* 3. ENTREGA (DIRECCIÓN) */}
            <div className="space-y-3 sm:space-y-4 pt-1">
              <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-charcoal">
                Entrega
              </h2>

              <div className="space-y-3">
                {/* País / Región */}
                <div>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all cursor-pointer"
                  >
                    <option value="España">España</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Francia">Francia</option>
                    <option value="Italia">Italia</option>
                  </select>
                </div>

                {/* Nombre y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nombre *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Apellidos *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                  />
                </div>

                {/* Dirección */}
                <input
                  type="text"
                  required
                  placeholder="Dirección *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                />

                {/* Información adicional */}
                <input
                  type="text"
                  placeholder="Casa, apartamento, etc. (opcional)"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                />

                {/* CP, Ciudad, Provincia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Código postal *"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Ciudad *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Provincia *"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                  />
                </div>

                {/* Teléfono */}
                <input
                  type="tel"
                  required
                  placeholder="Teléfono *"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-md text-base sm:text-sm text-charcoal placeholder:text-gray-mid focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-terracotta/10 text-terracotta rounded-md text-xs border border-terracotta/20 font-medium">
                {error}
              </div>
            )}

            {/* Links legales al pie del formulario */}
            <div className="pt-6 border-t border-warm-200/50 text-center text-xs text-gray-mid space-x-3">
              <Link href="/legal/privacidad" className="hover:underline">
                Política de privacidad
              </Link>
              <span>·</span>
              <Link href="/legal/cookies" className="hover:underline">
                Política de cookies
              </Link>
              <span>·</span>
              <Link href="/legal/aviso" className="hover:underline">
                Aviso legal
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Resumen del pedido en Desktop (`lg:block`) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-warm-100/40 border border-warm-200/80 rounded-card p-6 shadow-xs sticky top-36 space-y-5">
              
              {/* Lista de productos */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1 border-b border-warm-200/60 pb-5">
                {items.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white rounded-md border border-warm-200 relative flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={item.image || "/images/og-default.jpg"}
                          alt={item.name}
                          width={52}
                          height={52}
                          className="object-contain p-1"
                        />
                        <span className="absolute -top-1.5 -right-1.5 bg-charcoal text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif text-xs font-semibold text-charcoal truncate">{item.name}</h4>
                        <p className="text-[11px] text-gray-mid font-sans">{item.size_ml} ml</p>
                      </div>
                    </div>
                    <span className="font-semibold text-charcoal text-xs font-mono">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Campo de Código de Descuento (Gymshark Style) */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código de descuento o tarjeta de regalo"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-warm-200 rounded-md text-xs text-charcoal placeholder:text-gray-mid focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (couponCode) alert(`Código ${couponCode} aplicado`);
                  }}
                  className="px-4 py-2.5 bg-warm-200 hover:bg-warm-300 text-charcoal text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </div>

              {savings > 0 && (
                <div className="flex justify-between items-center text-xs bg-gold/10 text-gold-dark p-3 rounded-md border border-gold/20 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-dark" /> Descuento Multi-compra Chogan
                  </span>
                  <span className="font-mono">-{formatPrice(savings)}</span>
                </div>
              )}

              {/* Desglose de totales Gymshark Style */}
              <div className="border-t border-warm-200/60 pt-4 space-y-2 text-xs text-gray-mid">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-charcoal font-mono">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span className="text-gold-dark font-medium">Gratis</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-warm-200 text-charcoal">
                  <div>
                    <span className="font-serif text-base font-semibold block">Total</span>
                    <span className="text-[10px] text-gray-mid font-light">Incluye impuestos</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-mid mr-1 font-mono">EUR</span>
                    <span className="text-xl font-bold font-mono text-charcoal">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
