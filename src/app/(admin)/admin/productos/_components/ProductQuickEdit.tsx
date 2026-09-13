"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { ProductFormFields } from "./ProductForm";
import { Button } from "@/components/ui/Button";
import { getProductForEdit, updateProductAction } from "../actions";
import type { AdminProductDetail } from "../../_lib/queries";

/**
 * ProductQuickEdit — pulsar en el producto abre su ficha en modal
 * en vez de navegar a otra página. Cubre los campos de la ficha
 * (nombre, marca, familia, inspiración, género, descripción, insignia,
 * descuento, imágenes, notas); variantes y precios viven en la
 * edición completa.
 *
 * Motion (Emil): el modal entra desde scale(0.95) + opacidad con
 * ease-out fuerte en 220ms, sale en 150ms; centrado siempre.
 */
export function ProductQuickEdit({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenChange(next: boolean): Promise<void> {
    setOpen(next);
    if (!next) {
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProductForEdit(productId);
      if (!data) {
        setError("El producto ya no existe. Recarga el listado.");
        return;
      }
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la ficha.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(formData: FormData): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await updateProductAction(formData);
      toast.success(`«${productName}» guardado.`);
      setOpen(false);
      setDetail(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => void handleOpenChange(next)}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          title={`Editar ${productName} (edición rápida)`}
          className="block max-w-full truncate text-left font-medium text-warm-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {productName}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:transition-none" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-warm-200 bg-cream p-5 shadow-2xl duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 motion-reduce:transition-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-serif text-2xl font-bold text-warm-900">
                Edición rápida
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Edita los campos de la ficha del producto sin salir del listado.
              </Dialog.Description>
              <p className="mt-0.5 text-sm text-warm-500">
                {productName} ·{" "}
                <Link
                  href={`/admin/productos/${productId}`}
                  className="font-medium text-gold-dark underline-offset-4 hover:underline"
                >
                  Edición completa (imágenes, variantes, precios)
                </Link>
              </p>
            </div>
            <Dialog.Close
              aria-label="Cerrar edición rápida"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-warm-500 transition-all duration-150 ease-out hover:bg-warm-100 active:scale-95"
            >
              <X className="h-4 w-4" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="space-y-2" aria-busy="true" aria-label="Cargando ficha">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-warm-100" />
                ))}
              </div>
            ) : detail ? (
              <form action={handleSave} className="space-y-4">
                <input type="hidden" name="productId" value={productId} />
                <ProductFormFields
                  defaults={{
                    name: detail.name,
                    brand: detail.brand,
                    family: detail.family,
                    inspiration: detail.inspiration,
                    gender: detail.gender,
                    short_description: detail.short_description,
                    badge: detail.badge,
                    discount_percent: detail.discount_percent,
                    images: detail.images,
                    notes_top: detail.notes_top,
                    notes_heart: detail.notes_heart,
                    notes_base: detail.notes_base,
                  }}
                />
                {error ? (
                  <p role="alert" className="rounded-card bg-red-50 p-3 text-sm text-red-800">
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center justify-end gap-2">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" size="sm">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Guardando…" : "Guardar ficha"}
                  </Button>
                </div>
              </form>
            ) : (
              <p role="alert" className="rounded-card bg-red-50 p-4 text-sm text-red-800">
                {error ?? "No se pudo cargar la ficha."}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
