import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "../../_lib/admin-auth";
import { listCoupons } from "@/lib/coupon-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "../../_components/ActionForm";
import { CouponFormFields, SubmitButton } from "../_components/CouponForm";
import { updateCouponAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar cupón | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface EditarCuponPageProps {
  params: { code: string };
}

export default async function EditarCuponPage({ params }: EditarCuponPageProps) {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  const code = decodeURIComponent(params.code).trim().toUpperCase();
  let coupon: Awaited<ReturnType<typeof listCoupons>>[number] | null = null;
  try {
    coupon = (await listCoupons()).find((c) => c.code === code) ?? null;
  } catch {
    coupon = null;
  }
  if (!coupon) {
    notFound();
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
        <h2 className="mt-2 font-serif text-3xl font-bold text-warm-900">
          Editar <span className="font-mono">{coupon.code}</span>
        </h2>
        <p className="mt-1 text-sm text-warm-500">
          El cambio aplica al siguiente pedido que use el código.
        </p>
      </div>
      <ActionForm action={updateCouponAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Descuento y estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CouponFormFields
              initial={{
                code: coupon.code,
                percentOff: coupon.percentOff,
                firstOrderOnly: Boolean(coupon.firstOrderOnly),
                active: coupon.active,
              }}
            />
            <SubmitButton>Guardar cambios</SubmitButton>
          </CardContent>
        </Card>
      </ActionForm>
    </div>
  );
}
