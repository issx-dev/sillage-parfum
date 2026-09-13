/**
 * Slug automático desde el nombre del producto.
 *
 * El admin ya no pide el slug: se deriva aquí y la unicidad se resuelve
 * con sufijo (`base`, `base-2`, `base-3`, …) en `resolveUniqueSlug`.
 */

/** Normaliza un nombre a slug URL (`Sauvage EDT` → `sauvage-edt`). */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Devuelve el primer slug libre probando `base`, `base-2`, `base-3`, …
 * `exists` consulta la tienda (p. ej. `slugExists`); así la unicidad vive
 * en una sola función testeable en vez de repetida en cada action.
 */
export async function resolveUniqueSlug(
  base: string,
  exists: (slug: string) => boolean | Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) return base;
  let n = 2;
  for (;;) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
    n += 1;
  }
}
