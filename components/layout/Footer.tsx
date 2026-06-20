import Link from "next/link";
import { Container } from "@/components/layout/Container";

const footerLinks = {
  Categorías: [
    { href: "/productos?gender=femenino", label: "Mujer" },
    { href: "/productos?gender=masculino", label: "Hombre" },
    { href: "/productos?gender=unisex", label: "Unisex" },
    { href: "/productos?badge=nuevo", label: "Novedades" },
    { href: "/productos", label: "Todas" },
  ],
  Información: [
    { href: "/legal/aviso", label: "Aviso Legal" },
    { href: "/legal/privacidad", label: "Privacidad" },
    { href: "/legal/cookies", label: "Cookies" },
  ],
  Síguenos: [
    { href: "https://instagram.com/sillage", label: "Instagram", external: true },
    { href: "https://tiktok.com/@sillage", label: "TikTok", external: true },
    { href: "https://pinterest.com/sillage", label: "Pinterest", external: true },
    { href: "https://facebook.com/sillage", label: "Facebook", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="bg-black text-cream">
      <Container className="py-12 lg:py-16">
        {/* Logo + tagline */}
        <div className="text-center mb-12">
          <Link href="/" className="font-serif text-3xl text-gold tracking-wider">
            SILLAGE
          </Link>
          <p className="text-gray-mid mt-2 text-sm">
            El arte del perfume, redescubierto.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4 text-gold">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-mid hover:text-cream transition-colors duration-200"
                      {...((link as { external?: boolean }).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment icons */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {/* Visa */}
          <div className="w-14 h-9 flex items-center justify-center" aria-label="Visa">
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="48" height="32" rx="4" fill="currentColor" className="text-cream/10" />
              <path d="M19.5 21.5h-3l1.9-11h3l-1.9 11zm12.7-10.7c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.7 0 1.6 1.5 2.5 2.6 3.1 1.2.6 1.6.9 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.2-3-.7l-.4-.2-.5 2.7c.8.3 2.2.7 3.7.7 3.2 0 5.2-1.5 5.2-3.8 0-1.3-.8-2.2-2.5-3-1-.5-1.7-.9-1.7-1.5 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.5-2.4zm8 0h-2.3c-.7 0-1.3.2-1.6.9l-4.5 10.7h3.2l.6-1.7h3.9l.4 1.7h2.8l-2.5-11.6zm-3.7 7.5l1.2-3.1.4-1.2.3 1.1.7 3.2h-2.6zm-17.5-7.5l-3 7.5-.3-1.5c-.5-1.8-2.2-3.7-4-4.6l2.7 10.4h3.3l4.9-11 .2-.8h-3.8z" fill="currentColor" className="text-cream/60" />
              <path d="M13.7 10.5H8.6l0 .2c3.9 1 6.5 3.3 7.6 6.2l-1.1-5.4c-.2-.8-.8-1-1.4-1z" fill="currentColor" className="text-cream/60" />
            </svg>
          </div>
          {/* Mastercard */}
          <div className="w-14 h-9 flex items-center justify-center" aria-label="Mastercard">
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="48" height="32" rx="4" fill="currentColor" className="text-cream/10" />
              <circle cx="19" cy="16" r="7" fill="currentColor" className="text-cream/50" />
              <circle cx="29" cy="16" r="7" fill="currentColor" className="text-cream/50" />
              <path d="M24 11.5a7 7 0 0 0 0 9 7 7 0 0 0 0-9z" fill="currentColor" className="text-cream/30" />
            </svg>
          </div>
          {/* PayPal */}
          <div className="w-14 h-9 flex items-center justify-center" aria-label="PayPal">
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="48" height="32" rx="4" fill="currentColor" className="text-cream/10" />
              <path d="M26.5 10h-5.2c-.4 0-.7.3-.8.7L18.5 22c0 .3.2.5.5.5h2.5c.4 0 .7-.3.8-.7l.5-3.4c.1-.4.4-.7.8-.7h1.7c3.5 0 5.5-1.7 6-5 .2-1.5-.5-3-3.2-3zm.5 4.8c-.3 2-1.8 2-3.2 2h-.8l.6-3.5c0-.2.2-.4.5-.4h.4c1 0 1.9 0 2.4.6.3.3.3.8.1 1.3z" fill="currentColor" className="text-cream/60" />
              <path d="M17 10h-5c-.3 0-.6.2-.6.5L10 22c0 .3.2.5.5.5h2.4c.4 0 .7-.3.8-.7l.5-3.2c.1-.4.4-.7.8-.7h1.6c3.3 0 5.2-1.6 5.7-5 .2-1.4-.1-2.6-1-3.1-.6-.5-1.5-.7-2.7-.7z" fill="currentColor" className="text-cream/60" />
            </svg>
          </div>
          {/* Bizum */}
          <div className="w-14 h-9 flex items-center justify-center" aria-label="Bizum">
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="48" height="32" rx="4" fill="currentColor" className="text-cream/10" />
              <path
                d="M17.5 16.5c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6zm6 4c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"
                fill="currentColor"
                className="text-cream/60"
              />
              <path
                d="M23.5 11c-1.5-2.5.5-4 2.5-4s3.5 2 3.5 4.5S27 16 25 17.5"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                className="text-cream/60"
              />
              <path
                d="M24.5 22c1.5 2.5-.5 4-2.5 4s-3.5-2-3.5-4.5 2.5-4.5 4.5-6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                className="text-cream/60"
              />
            </svg>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-mid/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-mid">
            © 2025 SILLAGE · Todos los derechos reservados
          </p>
          <div className="flex gap-4">
            <Link href="/legal/aviso" className="text-xs text-gray-mid hover:text-cream transition-colors duration-200">Aviso legal</Link>
            <Link href="/legal/privacidad" className="text-xs text-gray-mid hover:text-cream transition-colors duration-200">Privacidad</Link>
            <Link href="/legal/cookies" className="text-xs text-gray-mid hover:text-cream transition-colors duration-200">Cookies</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}