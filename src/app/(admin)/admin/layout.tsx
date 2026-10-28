import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "./_lib/admin-auth";
import { AdminSidebar, AdminTopbar, AdminSidebarStateProvider } from "./_components/AdminNav";
import { SillageToaster } from "@/components/ui/SillageToaster";

export const metadata: Metadata = {
  title: "Administración | SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Shell del backoffice. Defensa en profundidad (H4): el middleware es el
 * gate principal, pero el layout revalida el rol aquí y redirige a /login
 * si no hay sesión admin, para no pintar PII sin control propio.
 *
 * Patrón sidebar-07 de shadcn (blocks, MIT) adaptado a tokens gold/cream:
 * sidebar colapsable con grupos de sección + footer (Ver tienda/Salir),
 * header con trigger + breadcrumb, drawer en móvil. Solo chrome: las rutas
 * y Server Actions viven en cada página y no se tocan aquí.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-warm-100">
      <AdminSidebarStateProvider>
        <Suspense>
          <AdminSidebar email={admin.email} />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense>
            <AdminTopbar email={admin.email} />
          </Suspense>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
        {/* Toaster del backoffice: sin esto los toast.* del admin no se ven. */}
        <SillageToaster />
      </AdminSidebarStateProvider>
    </div>
  );
}
