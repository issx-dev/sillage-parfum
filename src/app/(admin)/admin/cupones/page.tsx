import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Plus, TicketPercent } from "lucide-react";
import { getAdminUser } from "../_lib/admin-auth";
import { listCoupons } from "@/lib/coupon-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToastOnParam } from "../_components/ToastOnParam";
import { ActionForm } from "../_components/ActionForm";
import { toggleCouponAction } from "./actions";

export const metadata: Metadata = {
  title: "Cupones | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "warning"}>{active ? "Activo" : "Inactivo"}</Badge>;
}

export default async function CuponesPage() {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  let coupons: Awaited<ReturnType<typeof listCoupons>> | null = null;
  let loadError: string | null = null;
  try {
    coupons = await listCoupons();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "No se pudieron cargar los cupones.";
  }

  return (
    <div className="space-y-6">
      <Suspense>
        <ToastOnParam />
      </Suspense>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-warm-900">Cupones</h2>
          <p className="mt-1 text-sm tabular-nums text-warm-500">
            Válidos en Stripe y contra reembolso — sin deploy
          </p>
        </div>
        <Link href="/admin/cupones/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden /> Nuevo cupón
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Códigos de descuento</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
              No se pudieron cargar los cupones: {loadError}
            </p>
          ) : (coupons ?? []).length === 0 ? (
            <p className="p-4 text-sm text-warm-500">
              Todavía no hay cupones. Crea el primero con el botón de arriba.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Descuento</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(coupons ?? []).map((coupon) => (
                  <TableRow key={coupon.code}>
                    <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {coupon.percentOff}%
                    </TableCell>
                    <TableCell>
                      {coupon.firstOrderOnly ? (
                        <span className="inline-flex items-center gap-1 text-sm text-warm-700">
                          <TicketPercent className="h-4 w-4" aria-hidden /> Primer pedido
                        </span>
                      ) : (
                        <span className="text-sm text-warm-500">Sin condición</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={coupon.active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionForm
                          action={toggleCouponAction}
                          successMessage={coupon.active ? "Cupón desactivado." : "Cupón activado."}
                        >
                          <input type="hidden" name="code" value={coupon.code} />
                          <input type="hidden" name="active" value={coupon.active ? "false" : "true"} />
                          <Button type="submit" size="sm" variant="outline">
                            {coupon.active ? "Desactivar" : "Activar"}
                          </Button>
                        </ActionForm>
                        <Link
                          href={`/admin/cupones/${coupon.code}`}
                          className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
                        >
                          Editar
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
