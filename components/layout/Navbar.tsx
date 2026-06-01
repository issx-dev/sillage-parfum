"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { SCROLL_THRESHOLD } from "@/lib/constants";

const navLinks = [
  { href: "/productos?family=Floral", label: "Mujer" },
  { href: "/productos?family=Amaderado", label: "Hombre" },
  { href: "/productos", label: "Unisex" },
  { href: "/productos?badge=nuevo", label: "Novedades" },
  { href: "/productos", label: "Marcas" },
  { href: "/productos?badge=oferta", label: "Ofertas" },
];

export function Navbar() {
  const pathname = usePathname();
  const isHeroPage = pathname === "/";

  const scrollY = useScrollPosition();
  const reducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openCart = useCartStore((s) => s.openCart);
  const itemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const cartHydrated = useCartStore((s) => s._hasHydrated);
  const wishlistHydrated = useWishlistStore((s) => s._hasHydrated);

  const scrolled = scrollY > SCROLL_THRESHOLD;
  const isSolid = scrolled || !isHeroPage;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        !isHeroPage
          ? "top-0 bg-[#FAF7F2]/95 backdrop-blur-md shadow-card border-b border-warm-200/20"
          : "top-[37px] bg-transparent"
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-300 active:scale-95 transition-transform duration-150",
              isSolid ? "text-[#1A1A1A]" : "text-[#FAF7F2]"
            )}
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-xl sm:text-2xl text-gold tracking-wider py-2"
          >
            SILLAGE
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-sans tracking-wide transition-colors duration-300",
                  isSolid
                    ? "text-[#1A1A1A]/80 hover:text-gold"
                    : "text-[#FAF7F2]/80 hover:text-gold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-300 active:scale-95 transition-transform duration-150",
                isSolid
                  ? "text-[#1A1A1A]/80 hover:text-gold"
                  : "text-[#FAF7F2]/80 hover:text-gold"
              )}
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/favoritos"
              className={cn(
                "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center relative transition-colors duration-300",
                isSolid
                  ? "text-[#1A1A1A]/80 hover:text-gold"
                  : "text-[#FAF7F2]/80 hover:text-gold"
              )}
              aria-label="Lista de deseos"
            >
              <Heart className="w-5 h-5" />
              {mounted && wishlistHydrated && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-dark text-cream text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={openCart}
              className={cn(
                "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center relative transition-colors duration-300",
                isSolid
                  ? "text-[#1A1A1A]/80 hover:text-gold"
                  : "text-[#FAF7F2]/80 hover:text-gold"
              )}
              aria-label="Carrito de compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && cartHydrated && itemCount > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium transition-colors duration-300",
                  isSolid ? "bg-black text-cream" : "bg-gold text-black"
                )}>
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div
            className="absolute inset-0 bg-[#0B0A08]/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-[#FAF7F2] shadow-2xl p-6 flex flex-col transform transition-transform duration-300 ease-out">
            {/* Close button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menu"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1A1A1A] hover:text-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Logo */}
            <div className="mb-8">
              <span className="font-serif text-2xl text-gold tracking-wider">SILLAGE</span>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-sans text-[#1A1A1A]/80 hover:text-gold transition-colors py-3 px-4 border-b border-gray-light/50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-light/50">
              <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-wider">Envío gratis desde 50€</p>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
