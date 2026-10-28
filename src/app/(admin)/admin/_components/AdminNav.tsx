"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Store,
  LogOut,
  ShoppingBag,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/Sheet";

/**
 * Backoffice SILLAGE — patrón sidebar-07 de shadcn (blocks, MIT) adaptado a
 * tokens gold/cream propios:
 * - Sidebar colapsable (expandida ↔ solo iconos) con grupos de sección y
 *   footer (Ver tienda / Salir).
 * - Header con trigger de colapso + breadcrumb derivado de la ruta.
 * - Responsive: en móvil (<lg) el sidebar vive en un drawer (Sheet) y el
 *   header muestra botón de menú + breadcrumb compacto.
 *
 * Solo chrome: no toca rutas ni Server Actions.
 */

const STORAGE_KEY = "sillage:admin-sidebar-collapsed";

interface Section {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface SectionGroup {
  label: string;
  items: Section[];
}

const GROUPS: SectionGroup[] = [
  {
    label: "General",
    items: [{ href: "/admin/resumen", label: "Resumen", icon: LayoutDashboard }],
  },
  {
    label: "Gestión",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: Package },
      { href: "/admin/productos", label: "Productos", icon: ShoppingBag },
      { href: "/admin/stock", label: "Stock", icon: Boxes },
      { href: "/admin/cupones", label: "Cupones", icon: TicketPercent },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin/resumen" && pathname.startsWith(href));
}

function readCollapsed(): boolean {
  try {
    return window.localStorage?.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// ─── Estado compartido sidebar/header ────────────────────────────────────────

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

function useSidebarState(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("AdminNav debe usarse dentro de AdminSidebarStateProvider");
  return ctx;
}

export function AdminSidebarStateProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    typeof window === "undefined" ? false : readCollapsed()
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage?.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* sin persistencia: la sidebar sigue funcionando en memoria */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggle, mobileOpen, setMobileOpen }),
    [collapsed, toggle, mobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

// ─── Logout ──────────────────────────────────────────────────────────────────

function useLogout() {
  const router = useRouter();
  return useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);
}

// ─── Contenido de navegación (reutilizado en aside + drawer) ─────────────────

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("px-5 pb-5 pt-7", collapsed && "px-0 pt-7 text-center")}>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.25em] text-gold",
          collapsed && "sr-only"
        )}
      >
        Sillage · Backoffice
      </p>
      <p aria-hidden={collapsed} className={cn("font-serif text-xl font-bold text-cream", collapsed && "text-base")}>
        {collapsed ? "S" : "SILLAGE"}
      </p>
    </div>
  );
}

function SidebarGroups({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p
            className={cn(
              "mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/40",
              collapsed && "sr-only"
            )}
          >
            {group.label}
          </p>
          <ul className="flex flex-col gap-1 px-3">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-cream/10 font-semibold text-cream shadow-[inset_2px_0_0_0_var(--color-gold)]"
                        : "font-medium text-cream/60 hover:bg-cream/5 hover:text-cream"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className={cn(collapsed && "sr-only")}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function SidebarFooter({
  email,
  collapsed,
  onNavigate,
}: {
  email: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const logout = useLogout();
  const initial = (email.trim()[0] ?? "A").toUpperCase();
  return (
    <div className="flex flex-col gap-1 border-t border-cream/10 p-3">
      <Link
        href="/"
        title={collapsed ? "Ver tienda" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-cream/60 transition-colors hover:bg-cream/5 hover:text-cream",
          collapsed && "justify-center px-0"
        )}
      >
        <Store className="h-4 w-4 shrink-0" aria-hidden />
        <span className={cn(collapsed && "sr-only")}>Ver tienda</span>
      </Link>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-2.5",
          collapsed && "justify-center px-0"
        )}
      >
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 font-serif text-sm font-bold text-gold"
        >
          {initial}
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-xs text-cream/60", collapsed && "sr-only")}>
          {email}
        </span>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void logout();
          }}
          title={collapsed ? "Salir" : undefined}
          aria-label="Cerrar sesión"
          className={cn(
            "flex items-center gap-2 rounded-md text-sm font-medium text-cream/60 transition-colors hover:text-cream",
            collapsed ? "justify-center" : "shrink-0"
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className={cn(collapsed && "sr-only")}>Salir</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar desktop + drawer móvil ──────────────────────────────────────────

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarState();

  return (
    <>
      <aside
        aria-label="Barra lateral de administración"
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col bg-warm-900 text-cream transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        <nav aria-label="Secciones de administración" className="flex flex-1 flex-col overflow-y-auto">
          <SidebarGroups pathname={pathname} collapsed={collapsed} />
        </nav>
        <SidebarFooter email={email} collapsed={collapsed} />
      </aside>

      {/* Drawer móvil (patrón sidebar-07: Sheet a la izquierda en pantallas sm) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-72 flex-col border-r border-cream/10 bg-warm-900 p-0 text-cream"
        >
          <DialogPrimitive.Title className="sr-only">
            Secciones de administración
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Navegación del panel de administración SILLAGE.
          </DialogPrimitive.Description>
          <SidebarBrand collapsed={false} />
          <nav
            aria-label="Secciones de administración"
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <SidebarGroups
              pathname={pathname}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </nav>
          <SidebarFooter
            email={email}
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  resumen: "Resumen",
  pedidos: "Pedidos",
  productos: "Productos",
  stock: "Stock",
  cupones: "Cupones",
};

export function AdminBreadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean).slice(1); // sin "admin"
  const section = segments[0];
  const detail = segments.slice(1).join("/");

  let detailLabel: string | null = null;
  if (detail === "nuevo") {
    detailLabel = "Nuevo";
  } else if (detail) {
    detailLabel = section === "pedidos" ? `Pedido ${detail.slice(0, 8)}` : "Detalle";
  }

  return (
    <nav aria-label="Miga de pan">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="hidden shrink-0 sm:list-item">
          <Link
            href="/admin/resumen"
            className="font-medium text-warm-500 transition-colors hover:text-warm-900"
          >
            Administración
          </Link>
        </li>
        <li aria-hidden className="hidden shrink-0 text-warm-300 sm:list-item">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        {section && SECTION_LABELS[section] ? (
          <li className="flex min-w-0 items-center gap-1.5">
            {detailLabel ? (
              <Link
                href={`/admin/${section}`}
                className="shrink-0 font-medium text-warm-500 transition-colors hover:text-warm-900"
              >
                {SECTION_LABELS[section]}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-semibold text-warm-900">
                {SECTION_LABELS[section]}
              </span>
            )}
            {detailLabel ? (
              <>
                <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-warm-300" />
                <span aria-current="page" className="truncate font-semibold text-warm-900">
                  {detailLabel}
                </span>
              </>
            ) : null}
          </li>
        ) : (
          <li>
            <span aria-current="page" className="truncate font-semibold text-warm-900">
              Administración
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}

// ─── Header con trigger + breadcrumb (responsive) ────────────────────────────

export function AdminTopbar({ email, title }: { email: string; title?: string }) {
  const pathname = usePathname();
  const { collapsed, toggle, setMobileOpen } = useSidebarState();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 border-b border-warm-200 bg-cream/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-2 px-4 sm:px-6">
        {/* Móvil: abre el drawer */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú de administración"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-warm-700 transition-colors hover:bg-warm-200/60 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        {/* Desktop: colapsa el sidebar (patrón sidebar-07 SidebarTrigger) */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          aria-expanded={!collapsed}
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-warm-700 transition-colors hover:bg-warm-200/60 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </button>
        <span aria-hidden className="hidden h-5 w-px bg-warm-200 sm:block" />
        <div className="min-w-0 flex-1">
          {title ? <span className="sr-only">{title}</span> : null}
          <AdminBreadcrumb pathname={pathname} />
        </div>
        <span className="hidden max-w-56 truncate text-xs text-warm-500 md:block">{email}</span>
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-warm-700 transition-colors hover:bg-warm-200/60"
        >
          <LogOut className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </header>
  );
}
