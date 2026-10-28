"use client";

/**
 * Gestor visual de imágenes de la ficha (nuevo + edición).
 *
 * Patrón adaptado del Dropzone oficial de Supabase a las primitivas del
 * repo (sin dependencias nuevas): cuadrícula de miniaturas con × para
 * quitar y baldosa + para añadir — por subida de archivo (Server Action
 * `uploadProductImage` → bucket `product-images`) o por URL directa.
 * La primera imagen es la portada. Detrás queda el textarea de URLs
 * crudas (`name="images"`, una por línea) sincronizado: es lo que lee la
 * action de guardar y el fallback sin JS.
 */
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  isAllowedProductImageSize,
  isAllowedProductImageType,
} from "../_lib/image-upload";
import { uploadProductImage } from "../actions";

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProductImagesManager({ defaults }: { defaults?: string[] }) {
  const [images, setImages] = useState<string[]>(defaults ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    setError(null);
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (!isAllowedProductImageType(file.type)) {
        setError(`«${file.name}» no es una imagen.`);
        continue;
      }
      if (!isAllowedProductImageSize(file.size)) {
        setError(`«${file.name}» supera los ${formatMB(MAX_PRODUCT_IMAGE_BYTES)}.`);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of accepted) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadProductImage(formData);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          break;
        }
        uploaded.push(result.url);
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
        setError(null);
        toast.success(
          uploaded.length === 1 ? "Imagen subida." : `${uploaded.length} imágenes subidas.`
        );
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Imágenes del producto">
          {images.map((src, index) => (
            <li
              key={`${src}-${index}`}
              className="relative overflow-hidden rounded-lg border border-warm-200 bg-warm-100"
            >
              <SafeImage
                src={src}
                alt={index === 0 ? "Portada del producto" : `Imagen ${index + 1} del producto`}
                width={160}
                height={160}
                className="aspect-square h-auto w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Portada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => [prev[index]!, ...prev.filter((_, i) => i !== index)])
                  }
                  aria-label={`Hacer portada la imagen ${index + 1}`}
                  title="Hacer portada"
                  className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white transition-all duration-150 ease-out hover:bg-gold-dark active:scale-95"
                >
                  Hacer portada
                </button>
              )}
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                aria-label={`Quitar imagen ${index + 1}`}
                title="Quitar imagen"
                className="absolute right-1 top-1 inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                ×
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Añadir imágenes"
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-warm-300 bg-white text-2xl text-warm-500 transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-50"
            >
              <span aria-hidden>+</span>
              <span className="text-xs font-medium">{uploading ? "Subiendo…" : "Añadir"}</span>
            </button>
          </li>
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-warm-300 bg-white px-4 py-8 text-warm-500 transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-50"
        >
          <span aria-hidden className="text-3xl">
            +
          </span>
          <span className="text-sm font-medium">
            {uploading ? "Subiendo…" : "Arrastra o pulsa para subir imágenes"}
          </span>
          <span className="text-xs">PNG, JPG o WebP · máx. {formatMB(MAX_PRODUCT_IMAGE_BYTES)}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="Subir archivos de imagen"
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      {/* Contrato con la action de guardar: una URL por línea, la primera
          es la portada. Oculto: el grid de arriba es la única UI. */}
      <input type="hidden" name="images" value={images.join("\n")} />
    </div>
  );
}
