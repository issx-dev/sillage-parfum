import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "../../_lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductFormFields, SubmitButton, VariantFields } from "../_components/ProductForm";
import { ActionForm } from "../../_components/ActionForm";
import { createProductAction } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo producto | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
        >
          ← Volver a productos
        </Link>
        <h2 className="mt-2 font-serif text-3xl font-bold text-warm-900">Nuevo producto</h2>
        <p className="mt-1 text-sm text-warm-500">
          Se crea con una primera variante; después puedes añadir más tamaños.
        </p>
      </div>
      <ActionForm action={createProductAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ficha</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductFormFields />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Primera variante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VariantFields prefix="nv" />
            <SubmitButton>Crear producto</SubmitButton>
          </CardContent>
        </Card>
      </ActionForm>
    </div>
  );
}
