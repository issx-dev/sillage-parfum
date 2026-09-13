"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Boxes, Store, LogOut, ShoppingBag } from "lucide-react";

const ITEMS = [
  { href: "/admin/resumen", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/productos", label: "Productos", icon: ShoppingBag },
  { href: "/admin/stock", label: "Stock", icon: Boxes },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin/resumen" && pathname.startsWith(href));
}

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col bg-warm-900 text-cream lg:flex">
      <div className="px-6 pb-6 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Sillage · Backoffice</p>
        <p className="mt-1 truncate text-sm text-cream/60">{email}</p>
      </div>
      <nav aria-label="Secciones de administración" className="flex flex-1 flex-col gap-1 px-3">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg bg-cream/10 px-4 py-2.5 text-sm font-semibold text-cream shadow-[inset_2px_0_0_0_var(--color-gold)]"
                  : "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-cream/60 transition-colors hover:bg-cream/5 hover:text-cream"
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1 border-t border-cream/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-cream/60 transition-colors hover:bg-cream/5 hover:text-cream"
        >
          <Store className="h-4 w-4" aria-hidden />
          Ver tienda
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-cream/60 transition-colors hover:bg-cream/5 hover:text-cream"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export function AdminTopbar({ email, title }: { email: string; title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-30 border-b border-warm-200 bg-cream/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-dark">Sillage · Backoffice</p>
          <p className="font-serif text-lg font-bold text-warm-900">{title}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-warm-700 hover:bg-warm-200/60"
        >
          <LogOut className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <nav aria-label="Secciones de administración" className="flex gap-1 overflow-x-auto px-4 pb-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-2 rounded-full bg-warm-900 px-4 py-2 text-sm font-semibold text-cream"
                  : "flex items-center gap-2 rounded-full bg-warm-200/50 px-4 py-2 text-sm font-medium text-warm-700"
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 px-4 pb-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-warm-200/50 px-4 py-2 text-sm font-medium text-warm-700"
        >
          <Store className="h-4 w-4" aria-hidden />
          Tienda
        </Link>
        <span className="truncate text-xs text-warm-500">{email}</span>
      </div>
      <p className="sr-only">{email}</p>
    </div>
  );
}
