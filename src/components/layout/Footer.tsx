import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { FaCcVisa, FaCcMastercard, FaCcPaypal, FaInstagram, FaTiktok, FaPinterest, FaFacebook } from "react-icons/fa6";

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
    { href: "https://instagram.com/sillage", label: "Instagram", external: true, icon: <FaInstagram className="w-4 h-4" /> },
    { href: "https://tiktok.com/@sillage", label: "TikTok", external: true, icon: <FaTiktok className="w-4 h-4" /> },
    { href: "https://pinterest.com/sillage", label: "Pinterest", external: true, icon: <FaPinterest className="w-4 h-4" /> },
    { href: "https://facebook.com/sillage", label: "Facebook", external: true, icon: <FaFacebook className="w-4 h-4" /> },
  ],
};

export function Footer() {
  return (
    <footer className="bg-black text-cream pb-[env(safe-area-inset-bottom)]">
      <Container className="py-12 lg:py-16">
        {/* Logo + tagline */}
        <div className="text-center mb-12">
          <Link href="/" className="font-serif text-3xl text-gold tracking-wider">
            SILLAGE
          </Link>
          <p className="text-cream/60 mt-2 text-sm">
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
                      className="text-sm text-cream/60 hover:text-cream transition-colors duration-200 inline-flex items-center gap-2"
                      {...((link as { external?: boolean }).external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {(link as { icon?: React.ReactNode }).icon}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* Sobre Nosotros — editorial column balancing the 4-col desktop grid */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold mb-4 text-gold">Sobre Nosotros</h3>
            <p className="text-sm text-cream/60 leading-relaxed font-sans font-light">
              Sillage es una casa de alta perfumería dedicada a la curaduría de fragancias exclusivas de autor. Cada aroma en nuestra colección es seleccionado por su estela y carácter atemporal.
            </p>
          </div>
        </div>

        {/* Payment icons */}
        <div className="flex justify-center items-center gap-6 mb-12 flex-wrap text-cream/40">
          <FaCcVisa className="w-10 h-7" role="img" aria-label="Visa" />
          <FaCcMastercard className="w-10 h-7" role="img" aria-label="Mastercard" />
          <FaCcPaypal className="w-10 h-7" role="img" aria-label="PayPal" />
          <svg viewBox="0 0 168.2 50" className="w-14 h-5" fill="currentColor" role="img" aria-label="Bizum">
            <path fillRule="evenodd" clipRule="evenodd" d="M83.1 17.8c-1.4 0-2.6 1.2-2.6 2.5v19.2c0 1.4 1.2 2.6 2.6 2.6 1.4 0 2.6-1.2 2.6-2.6V20.4c0-1.4-1.1-2.6-2.6-2.6zm0-9.5c-1.6 0-2.9 1.3-2.9 2.9 0 1.6 1.3 3 2.9 3 1.6 0 2.9-1.3 2.9-3 0-1.6-1.4-2.9-2.9-2.9zm25.4 12.1c0-1.6-1.3-2.2-2.4-2.2H93.1c-1.3 0-2.3 1-2.3 2.2 0 1.3 1 2.3 2.3 2.3h8.5L90.7 37.9c-.3.4-.5 1.1-.5 1.5 0 1.6 1.3 2.5 2.4 2.5h13.7c1.3 0 2.3-1 2.3-2.3 0-1.3-1-2.3-2.3-2.3H97l10.7-14.9c.5-.7.7-1.4.7-2zM70.5 32.4c0 3.2-1.4 5.1-4.5 5.1-3.2 0-4.5-1.9-4.5-5.1v-9.8h4.7c3.8 0 4.3 2.1 4.3 4.4v5.4zm5.2-5.5c0-5.4-2.8-8.8-9.4-8.8h-4.8v-7.2c0-1.4-1.2-2.6-2.5-2.6-1.4 0-2.6 1.2-2.6 2.6v21.6c0 5.4 2.9 9.7 9.7 9.7 6.7 0 9.7-4.4 9.7-9.7v.1zm53-14.6c-1.4 0-2.6 1.2-2.6 2.6v12c0 3.2-1.4 5.1-4.5 5.1-3.2 0-4.5-1.9-4.5-5.1v-12c0-1.4-1.2-2.6-2.5-2.6-1.4 0-2.6 1.2-2.6 2.6v12c0 5.4 2.9 9.7 9.7 9.7 6.7 0 9.7-4.4 9.7-9.7v-12c0-1.4-1.2-2.6-2.6-2.6h-.1zm39.5 9.8c0-5.4-2.5-9.7-9.2-9.7-3 0-5.2.9-6.7 2.4-1.5-1.4-3.6-2.4-6.7-2.4-6.7 0-9.2 4.4-9.2 9.7v12c0 1.4 1.2 2.6 2.5 2.6 1.4 0 2.6-1.2 2.6-2.6v-12c0-3.2 1-5.1 4.1-5.1 3.1 0 4.1 1.9 4.1 5.1v12c0 1.4 1.2 2.6 2.5 2.6 1.4 0 2.6-1.2 2.6-2.6v-12c0-3.2 1-5.1 4.1-5.1 3.1 0 4.1 1.9 4.1 5.1v12c0 1.4 1.2 2.6 2.5 2.6 1.4 0 2.6-1.2 2.6-2.6l-.1-12zM9.2 17.9c1.8 1.3 4.4.9 5.7-.9l4.8-6.6C21 8.6 20.6 6 18.8 4.7c-1.8-1.3-4.4-.9-5.7.9l-4.8 6.6C7 14 7.4 16.5 9.2 17.9zm21.8-9.3c-1.8-1.3-4.4-.9-5.7.9L6.1 35.8c-1.3 1.8-.9 4.4.9 5.7 1.8 1.3 4.4.9 5.7-.9l19.1-26.3c1.4-1.9 1-4.5-.8-5.7zM7.4 6.5c1.3-1.8.9-4.4-.9-5.7C4.7-.5 2.1-.2.8 1.7-.5 3.5-.2 6 1.7 7.4 3.5 8.7 6 8.3 7.4 6.5zm29 36.1c-1.8-1.3-4.4-.9-5.7.9-1.3 1.8-.9 4.4.9 5.7 1.8 1.3 4.4.9 5.7-.9 1.3-1.8.9-4.4-.9-5.7zm-7.5-10.4c-1.8-1.3-4.4-.9-5.7.9l-4.8 6.6c-1.3 1.8-.9 4.4.9 5.7 1.8 1.3 4.4.9 5.7-.9l4.8-6.6c1.3-1.8.9-4.4-.9-5.7z" />
          </svg>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-mid/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-cream/60">
            © 2026 SILLAGE · Todos los derechos reservados
          </p>
          <div className="flex gap-4">
            <Link href="/legal/aviso" className="text-xs text-cream/60 hover:text-cream transition-colors duration-200">Aviso legal</Link>
            <Link href="/legal/privacidad" className="text-xs text-cream/60 hover:text-cream transition-colors duration-200">Privacidad</Link>
            <Link href="/legal/cookies" className="text-xs text-cream/60 hover:text-cream transition-colors duration-200">Cookies</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}