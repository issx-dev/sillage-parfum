"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "sillage-consent";

interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.necessary !== true || typeof parsed.decidedAt !== "string") return null;
    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      decidedAt: parsed.decidedAt,
    };
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, marketing: boolean): void {
  const consent: Consent = {
    necessary: true,
    analytics,
    marketing,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* Sin almacenamiento no hay persistencia: el banner volverá a salir. */
  }
}

/**
 * CookieBanner — consentimiento RGPD/AEPD para sillage.
 *
 * La tienda solo usa cookies técnicas (sesión, carrito, lista de deseos)
 * más Stripe en el checkout. No hay analítica ni marketing de terceros
 * a día de hoy: los interruptores existen para cuando los haya, y todo
 * arranca desactivado. Rechazar es tan fácil como aceptar (mismo nivel).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (readConsent() === null) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  function decide(a: boolean, m: boolean): void {
    saveConsent(a, m);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-2xl rounded-card border border-warm-200 bg-cream p-4 shadow-2xl sm:p-5">
        <p className="font-serif text-lg font-bold text-warm-900">Tus cookies, tus reglas</p>
        <p className="mt-1 text-sm leading-relaxed text-warm-700">
          Usamos cookies técnicas para que la tienda funcione (sesión, carrito, lista de
          deseos) y Stripe para el pago seguro. Nada de rastreo.{" "}
          <Link href="/legal/cookies" className="font-medium text-gold-dark underline-offset-4 hover:underline">
            Política de cookies
          </Link>
        </p>

        {customizing ? (
          <div className="mt-3 space-y-2 rounded-card border border-warm-200 bg-white p-3">
            <label className="flex items-center justify-between gap-3 text-sm text-warm-700">
              <span>
                <strong className="block text-warm-900">Técnicas</strong>
                Sesión, carrito, deseos. Siempre activas.
              </span>
              <input type="checkbox" checked disabled aria-label="Cookies técnicas (siempre activas)" className="h-5 w-5 accent-[#8a6d2b]" />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-warm-700">
              <span>
                <strong className="block text-warm-900">Analíticas</strong>
                Actualmente no las usamos.
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                aria-label="Cookies analíticas"
                className="h-5 w-5 accent-[#8a6d2b]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-warm-700">
              <span>
                <strong className="block text-warm-900">Marketing</strong>
                Actualmente no las usamos.
              </span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                aria-label="Cookies de marketing"
                className="h-5 w-5 accent-[#8a6d2b]"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {customizing ? (
            <button
              type="button"
              onClick={() => decide(analytics, marketing)}
              className="rounded-card bg-charcoal px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-black active:scale-95"
            >
              Guardar mi elección
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="rounded-card border border-warm-300 bg-white px-4 py-2.5 text-sm font-semibold text-warm-800 transition-all duration-150 ease-out hover:border-gold active:scale-95"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={() => decide(false, false)}
                className="rounded-card border border-warm-300 bg-white px-4 py-2.5 text-sm font-semibold text-warm-800 transition-all duration-150 ease-out hover:border-gold active:scale-95"
              >
                Solo técnicas
              </button>
              <button
                type="button"
                onClick={() => decide(true, true)}
                className="rounded-card bg-charcoal px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-black active:scale-95"
              >
                Aceptar todas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
