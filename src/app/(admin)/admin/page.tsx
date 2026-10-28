import { redirect } from "next/navigation";
import { getAdminUser } from "./_lib/admin-auth";

/** Defensa en profundidad (H4): no redirigir a /admin/pedidos sin rol admin. */
export default async function AdminIndexPage() {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }
  redirect("/admin/resumen");
}
