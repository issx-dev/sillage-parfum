import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SillageToaster } from "@/components/ui/SillageToaster";

/**
 * Standalone shell for /login and /registro: no PromoBar, Navbar, Footer or
 * cookie banner. One task per screen. The storefront chrome lives in
 * `(tienda)/layout.tsx` and the back office in `(admin)/admin/layout.tsx`.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-charcoal lg:grid lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden lg:block" aria-hidden="true">
        <Image
          src="/images/hero/hero-desktop.jpg"
          alt=""
          fill
          sizes="42vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-charcoal/20" />
        <Link
          href="/"
          tabIndex={-1}
          className="absolute left-10 top-9 font-serif text-2xl tracking-[0.18em] text-cream"
        >
          SILLAGE
        </Link>
        <p className="absolute bottom-10 left-10 right-10 max-w-sm font-serif text-3xl italic leading-snug text-cream">
          La estela que deja un perfume.
        </p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link
            href="/"
            className="font-serif text-xl tracking-[0.18em] text-charcoal lg:invisible"
            aria-label="SILLAGE, ir a la tienda"
          >
            SILLAGE
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm text-gray-mid transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver a la tienda
          </Link>
        </header>

        <main className="flex flex-1 items-center px-6 pb-16 sm:px-10 lg:px-[clamp(2.5rem,8vw,7rem)]">
          <div className="mx-auto w-full max-w-[26rem] lg:mx-0">{children}</div>
        </main>

        <footer className="px-6 py-6 text-xs text-gray-mid sm:px-10 lg:px-[clamp(2.5rem,8vw,7rem)]">
          <Link href="/legal/privacidad" className="hover:text-charcoal">
            Privacidad
          </Link>
          <span aria-hidden className="mx-2">
            ·
          </span>
          <Link href="/legal/condiciones" className="hover:text-charcoal">
            Condiciones
          </Link>
        </footer>
      </div>
      <SillageToaster />
    </div>
  );
}
