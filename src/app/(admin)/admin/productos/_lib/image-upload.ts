/**
 * Ayudas puras para las imágenes de la ficha de producto.
 *
 * Sin dependencias de servidor: las usan tanto el gestor visual
 * (`ProductImagesManager`, cliente) como la Server Action de subida.
 * Los límites replican el bucket `product-images` (público, 5 MB,
 * solo imágenes).
 */

/** Límite del bucket `product-images`: 5 MB por archivo. */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

/** Bucket de Supabase Storage donde viven las fotos de producto. */
export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Solo imágenes (el bucket rechaza el resto por policy MIME). */
export function isAllowedProductImageType(mime: string): boolean {
  return mime.startsWith("image/");
}

/** Tamaño dentro del límite del bucket. */
export function isAllowedProductImageSize(bytes: number): boolean {
  return Number.isFinite(bytes) && bytes >= 0 && bytes <= MAX_PRODUCT_IMAGE_BYTES;
}

/**
 * Líneas de URLs crudas del textarea (rutas `/images/…` o `http(s)://…`).
 * La primera URL es la portada.
 */
export function parseImageLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://"));
}

/** Clave de objeto en el bucket, saneada y sin espacios ni mayúsculas. */
export function buildProductImageKey(productScope: string, originalName: string): string {
  const scope = productScope
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "producto";
  const dot = originalName.lastIndexOf(".");
  const ext = dot >= 0 ? originalName.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const stem =
    (dot >= 0 ? originalName.slice(0, dot) : originalName)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "imagen";
  return `${scope}/${Date.now().toString(36)}-${stem}${ext}`;
}
