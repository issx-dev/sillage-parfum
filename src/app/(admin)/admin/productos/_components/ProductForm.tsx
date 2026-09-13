"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { ProductImagesManager } from "./ProductImagesManager";

export interface ProductFormDefaults {
  name?: string;
  brand?: string;
  family?: string;
  inspiration?: string | null;
  gender?: string;
  short_description?: string;
  badge?: string | null;
  discount_percent?: number;
  images?: string[];
  notes_top?: string[];
  notes_heart?: string[];
  notes_base?: string[];
}

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-warm-700">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-warm-500">{hint}</p> : null}
    </div>
  );
}

const inputCls =
  "h-10 rounded-card border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

/**
 * Campos de la ficha de producto. Server component: se usa dentro de un
 * <form action={...}> de nuevo o de edición. Sin JS de cliente.
 */
export function ProductFormFields({ defaults }: { defaults?: ProductFormDefaults }) {
  const d = defaults ?? {};
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field id="f-nombre" label="Nombre">
        <Input id="f-nombre" name="name" required minLength={2} defaultValue={d.name ?? ""} className="" />
      </Field>
      <p className="text-xs text-warm-500 sm:col-span-2 -mt-2">
        El slug de la URL se genera solo desde el nombre (único, con sufijo si hace falta).
      </p>
      <Field id="f-marca" label="Marca">
        <Input id="f-marca" name="brand" required defaultValue={d.brand ?? ""} className="" />
      </Field>
      <Field id="f-familia" label="Familia olfativa">
        <Input
          id="f-familia"
          name="family"
          required
          placeholder="Amaderado, Floral, Cítrico…"
          defaultValue={d.family ?? ""}
          className=""
        />
      </Field>
      <Field id="f-inspiracion" label="Inspirado en" hint="Perfume de diseñador, p. ej. Sauvage de Dior.">
        <Input
          id="f-inspiracion"
          name="inspiration"
          placeholder="Sauvage de Dior…"
          defaultValue={d.inspiration ?? ""}
          className=""
        />
      </Field>
      <Field id="f-genero" label="Género">
        <select id="f-genero" name="gender" defaultValue={d.gender ?? "unisex"} className={inputCls}>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="unisex">Unisex</option>
        </select>
      </Field>
      <Field id="f-insignia" label="Insignia">
        <select id="f-insignia" name="badge" defaultValue={d.badge ?? ""} className={inputCls}>
          <option value="">Sin insignia</option>
          <option value="nuevo">Novedad</option>
          <option value="oferta">Oferta</option>
          <option value="top_ventas">Top ventas</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field id="f-descripcion" label="Descripción corta">
          <textarea
            id="f-descripcion"
            name="short_description"
            required
            minLength={10}
            rows={3}
            defaultValue={d.short_description ?? ""}
            className="rounded-card border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
        </Field>
      </div>
      <Field id="f-descuento" label="Descuento %" hint="0 a 90.">
        <Input
          id="f-descuento"
          name="discount_percent"
          type="number"
          min={0}
          max={90}
          step={1}
          defaultValue={d.discount_percent ?? 0}
          className="tabular-nums"
        />
      </Field>
      <div className="sm:col-span-2">
        <span className="text-sm font-medium text-warm-700" id="titulo-imagenes">
          Imágenes
        </span>
        <div className="mt-1.5" role="group" aria-labelledby="titulo-imagenes">
          <ProductImagesManager defaults={d.images} />
        </div>
      </div>
      <Field id="f-salida" label="Notas de salida" hint="Separadas por comas.">
        <Input id="f-salida" name="notes_top" defaultValue={(d.notes_top ?? []).join(", ")} className="" />
      </Field>
      <Field id="f-corazon" label="Notas de corazón" hint="Separadas por comas.">
        <Input id="f-corazon" name="notes_heart" defaultValue={(d.notes_heart ?? []).join(", ")} className="" />
      </Field>
      <div className="sm:col-span-2">
        <Field id="f-fondo" label="Notas de fondo" hint="Separadas por comas.">
          <Input id="f-fondo" name="notes_base" defaultValue={(d.notes_base ?? []).join(", ")} className="" />
        </Field>
      </div>
    </div>
  );
}

export function VariantFields({ prefix }: { prefix?: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Field id={`${prefix ?? "v"}-size`} label="Tamaño (ml)">
        <Input id={`${prefix ?? "v"}-size`} name="size_ml" type="number" min={1} max={1000} step={1} required defaultValue={70} className="tabular-nums" />
      </Field>
      <Field id={`${prefix ?? "v"}-price`} label="Precio (€)">
        <Input
          id={`${prefix ?? "v"}-price`}
          name="price"
          type="number"
          min={0}
          max={100000}
          step="0.01"
          required
          defaultValue={35}
          className="tabular-nums"
        />
      </Field>
      <Field id={`${prefix ?? "v"}-stock`} label="Stock">
        <Input id={`${prefix ?? "v"}-stock`} name="stock" type="number" min={0} max={999999} step={1} required defaultValue={10} className="tabular-nums" />
      </Field>
      <Field id={`${prefix ?? "v"}-sku`} label="SKU" hint="Único.">
        <Input id={`${prefix ?? "v"}-sku`} name="sku" required maxLength={64} placeholder="CHOGAN-000-70" className="font-mono" />
      </Field>
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button type="submit" size="sm">
      {children}
    </Button>
  );
}
