import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { Container } from "@/components/layout/Container";

const footerLinks = {
  Categorías: [
    { href: "/productos?family=Floral", label: "Mujer" },
    { href: "/productos?family=Amaderado", label: "Hombre" },
    { href: "/productos?family=Oriental", label: "Unisex" },
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
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4 text-gold/70">{title}</h3>
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
      </Container>
    </footer>
  );
}