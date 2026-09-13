import "server-only";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

/**
 * Lee el usuario admin desde la cookie `auth_token`.
 *
 * El gate de rol (redirect a /login o /cuenta) lo aplica el middleware
 * (`src/middleware.ts`); esta función solo expone la identidad para pintar
 * el shell y para la comprobación de defensa en profundidad de las
 * Server Actions. Nunca redirige: devuelve `null` si no hay sesión válida.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const token = cookies().get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return payload as AdminUser;
}

/**
 * Comprobación de defensa en profundidad para Server Actions de /admin.
 * El middleware ya bloquea a no-admins; esto evita mutaciones si una
 * acción se invocara fuera del gate.
 *
 * H8 — fail-closed: exige `role === "admin"` de forma estricta. Cualquier
 * otro caso (sin sesión, sin claim `role` como tokens pre-migración, o rol
 * distinto) lanza. Nunca se permite por defecto.
 */
export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user || user.role !== "admin") {
    throw new Error("No autorizado: se requiere sesión de administrador.");
  }
  return user;
}
