import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "../../_lib/admin-auth";
import { readProductAdmin } from "../../_lib/queries";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormFields, SubmitButton, VariantFields } from "../_components/ProductForm";
import { ActionForm } from "../../_components/ActionForm";
import {
  createVariantAction,
  deleteProductAction,
  deleteVariantAction,
  updateProductAction,
  updateVariantAction,
} from "../actions";

export const metadata: Metadata = {
  title: "Editar producto | Administración SILLAGE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const inputCls =
  "h-9 rounded-card border border-warm-300 bg-white px-2 py-1 text-sm tabular-nums text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

interface EditarPageProps {
  params: { id: string };
}

export default async function EditarProductoPage({ params }: EditarPageProps) {
  const admin = await getAdminUser();
  if (!admin || admin.role !== "admin") {
    redirect("/login");
  }

  let product: Awaited<ReturnType<typeof readProductAdmin>>;
  try {
    product = await readProductAdmin(params.id);
  } catch {
    product = null;
  }
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="text-sm font-medium text-gold-dark underline-offset-4 hover:underline"
        >
          ← Volver a productos
        </Link>
        <h2 className="mt-2 font-serif text-3xl font-bold text-warm-900">{product.name}</h2>
        <p className="mt-1 text-sm tabular-nums text-warm-500">
          <Link href={`/productos/${product.slug}`} className="underline-offset-4 hover:underline">
            Ver en la tienda →
          </Link>
        </p>
      </div>

      <ActionForm action={updateProductAction} className="space-y-4">
        <input type="hidden" name="productId" value={product.product_id} />
        <Card>
          <CardHeader>
            <CardTitle>Ficha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProductFormFields
              defaults={{
                name: product.name,
                brand: product.brand,
                family: product.family,
                inspiration: product.inspiration,
                gender: product.gender,
                short_description: product.short_description,
                badge: product.badge,
                discount_percent: product.discount_percent,
                images: product.images,
                notes_top: product.notes_top,
                notes_heart: product.notes_heart,
                notes_base: product.notes_base,
              }}
            />
            <SubmitButton>Guardar ficha</SubmitButton>
          </CardContent>
        </Card>
      </ActionForm>

      <Card>
        <CardHeader>
          <CardTitle>Variantes ({product.variants.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Tamaño</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((v) => (
                <TableRow key={v.variant_id}>
                  <TableCell colSpan={5} className="!p-0">
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <ActionForm
                        action={updateVariantAction}
                        className="flex flex-wrap items-center gap-2"
                      >
                      <input type="hidden" name="variantId" value={v.variant_id} />
                      <label className="sr-only" htmlFor={`size-${v.variant_id}`}>
                        Tamaño en ml
                      </label>
                      <input
                        id={`size-${v.variant_id}`}
                        name="size_ml"
                        type="number"
                        min={1}
                        max={1000}
                        required
                        defaultValue={v.size_ml}
                        className={`${inputCls} w-20 text-right`}
                      />
                      <span className="text-xs text-warm-500">ml</span>
                      <label className="sr-only" htmlFor={`price-${v.variant_id}`}>
                        Precio en euros
                      </label>
                      <input
                        id={`price-${v.variant_id}`}
                        name="price"
                        type="number"
                        min={0}
                        max={100000}
                        step="0.01"
                        required
                        defaultValue={v.price}
                        className={`${inputCls} w-24 text-right`}
                      />
                      <span className="text-xs text-warm-500">€ · actual {formatPrice(v.price)}</span>
                      <label className="sr-only" htmlFor={`stock-${v.variant_id}`}>
                        Stock
                      </label>
                      <input
                        id={`stock-${v.variant_id}`}
                        name="stock"
                        type="number"
                        min={0}
                        max={999999}
                        required
                        defaultValue={v.stock}
                        className={`${inputCls} w-20 text-right`}
                      />
                      <label className="sr-only" htmlFor={`sku-${v.variant_id}`}>
                        SKU
                      </label>
                      <input
                        id={`sku-${v.variant_id}`}
                        name="sku"
                        required
                        maxLength={64}
                        defaultValue={v.sku}
                        className={`${inputCls} w-36 font-mono text-xs`}
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Guardar
                      </Button>
                      </ActionForm>
                      <ActionForm action={deleteVariantAction}>
                        <input type="hidden" name="variantId" value={v.variant_id} />
                        <button
                          type="submit"
                          title="Borrar variante"
                          aria-label={`Borrar variante ${v.size_ml} ml`}
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Borrar
                        </button>
                      </ActionForm>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <details className="rounded-card border border-warm-200 bg-warm-100/50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-warm-800">
              Añadir variante
            </summary>
            <ActionForm action={createVariantAction} className="mt-4 space-y-4">
              <input type="hidden" name="productId" value={product.product_id} />
              <VariantFields prefix="add" />
              <SubmitButton>Añadir variante</SubmitButton>
            </ActionForm>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={deleteProductAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="productId" value={product.product_id} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-delete" className="text-sm font-medium text-warm-700">
                Escribe ELIMINAR para borrar «{product.name}» y sus {product.variants.length}{" "}
                {product.variants.length === 1 ? "variante" : "variantes"}.
              </label>
              <Input id="confirm-delete" name="confirm" placeholder="ELIMINAR" className="sm:max-w-xs" />
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-red-700 text-white hover:bg-red-800"
            >
              Borrar producto
            </Button>
          </ActionForm>
          <p className="mt-3 text-xs text-warm-500">
            <Badge variant="warning">Irreversible</Badge> El producto desaparece de la tienda de inmediato.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
