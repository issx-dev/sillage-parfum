"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

const footerLinks = {
  Empresa: [
    { href: "/sobre-nosotros", label: "Sobre nosotros", placeholder: true },
    { href: "/sostenibilidad", label: "Sostenibilidad", placeholder: true },
    { href: "/trabaja-con-nosotros", label: "Trabaja con nosotros", placeholder: true },
  ],
  Ayuda: [
    { href: "/ayuda/envios", label: "Envíos y devoluciones", placeholder: true },
    { href: "/ayuda/guia-fragancias", label: "Guía de fragancias", placeholder: true },
    { href: "/ayuda/faq", label: "FAQ", placeholder: true },
    { href: "/contacto", label: "Contacto", placeholder: true },
  ],
  Categorías: [
    { href: "/productos?family=Floral", label: "Mujer" },
    { href: "/productos?family=Amaderado", label: "Hombre" },
    { href: "/productos?family=Oriental", label: "Unisex" },
    { href: "/productos?badge=nuevo", label: "Novedades" },
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
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
              <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-4 text-[#C9A96E]/70">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {"placeholder" in link && link.placeholder ? (
                      <button
                        aria-disabled="true"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm text-gray-mid/60 opacity-60 hover:text-cream transition-colors duration-200 cursor-default"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-mid hover:text-cream transition-colors duration-200"
                        {...((link as { external?: boolean }).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social icons */}
          <div className="flex justify-center gap-6 mb-12">
          <Link
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-mid hover:text-gold transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </Link>
          <Link
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-mid hover:text-gold transition-colors"
            aria-label="TikTok"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
            </svg>
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-mid hover:text-gold transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </Link>
          <Link
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-mid hover:text-gold transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </Link>
        </div>

        {/* Payment icons */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          <div className="w-12 h-8 bg-cream/10 rounded flex items-center justify-center">
            <span className="text-xs font-bold">VISA</span>
          </div>
          <div className="w-12 h-8 bg-cream/10 rounded flex items-center justify-center">
            <span className="text-xs font-bold">MC</span>
          </div>
          <div className="w-12 h-8 bg-cream/10 rounded flex items-center justify-center">
            <span className="text-xs font-bold">PayPal</span>
          </div>
          <div className="w-12 h-8 bg-cream/10 rounded flex items-center justify-center">
            <span className="text-xs font-bold">Bizum</span>
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
      </div>
    </footer>
  );
}
