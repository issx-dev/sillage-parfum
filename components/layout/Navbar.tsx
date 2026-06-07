"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/types/client";
import { cn } from "@/lib/utils";
import { SCROLL_THRESHOLD } from "@/lib/constants";
import { Container } from "@/components/layout/Container";

// Lazy-load the search overlay — it pulls in Radix Dialog + icons, only needed
// on user interaction. Drops ~30KB from the initial Navbar bundle.
const SearchOverlay = dynamic(
  () => import("@/components/layout/SearchOverlay").then((m) => m.SearchOverlay),
  { ssr: false }
);

const navLinks = [
  { href: "/productos?family=Floral", label: "Mujer" },
  { href: "/productos?family=Amaderado", label: "Hombre" },
  { href: "/productos", label: "Unisex" },
  { href: "/productos?badge=nuevo", label: "Novedades" },
  { href: "/productos", label: "Marcas" },
  { href: "/productos?badge=oferta", label: "Ofertas" },
];

export interface NavbarProps {
  /** Pre-fetched recommended products from the server, fed into SearchOverlay on first open. */
  recommendedProducts?: Product[];
}

export function Navbar({ recommendedProducts = [] }: NavbarProps) {
  const pathname = usePathname();
  const isHeroPage = pathname === "/";

  const scrollY = useScrollPosition();
  const reducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openCart = useCartStore((s) => s.openCart);
  const itemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const cartHydrated = useCartStore((s) => s._hasHydrated);
  const wishlistHydrated = useWishlistStore((s) => s._hasHydrated);

  const scrolled = scrollY > 10;
  const isSolid = scrolled || !isHeroPage;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Separate open/visible state so the exit animation can play before unmounting
  const openMobileMenu = useCallback(() => {
    setMobileOpen(true);
    // Small rAF delay ensures the element is mounted before the CSS transition starts
    requestAnimationFrame(() => setMobileVisible(true));
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileVisible(false);
    // Wait for the transition to finish (300ms) before unmounting
    const timer = setTimeout(() => setMobileOpen(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300",
        isSolid
          ? "bg-cream/95 backdrop-blur-md shadow-card border-b border-warm-200/20"
          : "bg-transparent border-b border-transparent shadow-none"
      )}
    >
      <Container>
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-300 active:scale-95",
              isSolid ? "text-charcoal" : "text-cream"
            )}
            onClick={openMobileMenu}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
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
                    ? "text-charcoal/80 hover:text-gold"
                    : "text-cream/80 hover:text-gold"
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
                "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-300 active:scale-95",
                isSolid
                  ? "text-charcoal/80 hover:text-gold"
                  : "text-cream/80 hover:text-gold"
              )}
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist — real link to /favoritos page */}
            <Link
              href="/favoritos"
              className={cn(
                "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center relative transition-colors duration-300 active:scale-95",
                isSolid
                  ? "text-charcoal/80 hover:text-gold"
                  : "text-cream/80 hover:text-gold"
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
                "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center relative transition-colors duration-300 active:scale-95",
                isSolid
                  ? "text-charcoal/80 hover:text-gold"
                  : "text-cream/80 hover:text-gold"
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
      </Container>

      {/* Mobile menu — CSS-driven slide animation, no mount/unmount flicker */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
              mobileVisible ? "opacity-100" : "opacity-0"
            )}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Panel — slides in from right; full-width on small screens, fixed 320px ≥ sm */}
          <div
            className={cn(
              "absolute top-0 right-0 bottom-0 w-full sm:w-[320px] max-w-sm bg-cream shadow-2xl flex flex-col",
              "transition-transform duration-300 ease-out",
              reducedMotion
                ? "translate-x-0"
                : mobileVisible
                ? "translate-x-0"
                : "translate-x-full"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-6 pb-4">
              <span className="font-serif text-2xl text-gold tracking-wider">SILLAGE</span>
              <button
                onClick={closeMobileMenu}
                aria-label="Cerrar menu"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-charcoal hover:text-gold transition-colors active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 flex-1 overflow-y-auto px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="text-base font-sans text-charcoal/80 hover:text-gold active:text-gold transition-colors py-3 px-4 border-b border-gray-light/50 active:bg-warm-100/50"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/favoritos"
                onClick={closeMobileMenu}
                className="text-base font-sans text-charcoal/80 hover:text-gold active:text-gold transition-colors py-3 px-4 border-b border-gray-light/50 active:bg-warm-100/50"
              >
                Lista de deseos
                {mounted && wishlistHydrated && wishlistCount > 0 && (
                  <span className="ml-2 bg-gold-dark text-cream text-xs px-1.5 py-0.5 rounded-full font-medium">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Footer */}
            <div className="px-6 py-6 border-t border-gray-light/50">
              <p className="text-xs text-charcoal/40 uppercase tracking-wider">Envío gratis desde 50€</p>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Search Overlay — lazy-loaded, server-recommended products pre-fetched */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        recommended={recommendedProducts}
      />
    </nav>
  );
}
