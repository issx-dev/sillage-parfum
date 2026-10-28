import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "../../_lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "../../_components/ActionForm";
import { CouponFormFields, SubmitButton } from "../_components/CouponForm";
import { createCouponAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo cupón | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NuevoCuponPage() {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/cupones"
          className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
        >
          ← Volver a cupones
        </Link>
        <h2 className="mt-2 font-serif text-3xl font-bold text-warm-900">Nuevo cupón</h2>
        <p className="mt-1 text-sm text-warm-500">
          Activo desde que lo creas, en Stripe y contra reembolso.
        </p>
      </div>
      <ActionForm action={createCouponAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Código y descuento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CouponFormFields />
            <SubmitButton>Crear cupón</SubmitButton>
          </CardContent>
        </Card>
      </ActionForm>
    </div>
  );
}
