import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "./_lib/admin-auth";
import { AdminSidebar, AdminTopbar } from "./_components/AdminNav";

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
 * Patrón sidebar clásico: navegación fija en oscuro (marca + secciones +
 * salida a tienda/logout), contenido en claro. En móvil, topbar compacta
 * con las mismas secciones — sin barra lateral.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-warm-100">
      <div className="sticky top-0 h-screen shrink-0">
        <Suspense>
          <AdminSidebar email={admin.email} />
        </Suspense>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense>
          <AdminTopbar email={admin.email} title="Administración" />
        </Suspense>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
