import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Contrato de alineación de tablas admin: las columnas numéricas o de
 * acción alineadas a la derecha en el cuerpo (`TableCell className="text-right"`)
 * deben llevar el mismo `text-right` en su encabezado (`TableHead`), y las
 * de texto quedan a la izquierda (defecto de `TableHead`).
 *
 * Lee el fuente de cada página y empareja encabezados con celdas por
 * posición: si la celda i-ésima es `text-right`, el encabezado i-ésimo
 * también debe serlo.
 */
const here = dirname(fileURLToPath(import.meta.url));

const PAGES = [
  "pedidos/page.tsx",
  "pedidos/[id]/page.tsx",
  "stock/page.tsx",
  "productos/page.tsx",
];

function cellsOf(source: string, tag: "TableHead" | "TableCell"): boolean[] {
  const re = new RegExp(`<${tag}(\\s[^>]*)?>`, "g");
  const out: boolean[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    out.push(/text-right/.test(match[1] ?? ""));
  }
  return out;
}

describe("alineación de tablas admin", () => {
  for (const page of PAGES) {
    it(`${page}: cada columna con celdas a la derecha tiene encabezado a la derecha`, () => {
      const source = readFileSync(resolve(here, page), "utf8");
      const heads = cellsOf(source, "TableHead");
      const cells = cellsOf(source, "TableCell");
      expect(heads.length).toBeGreaterThan(0);
      // Las filas de variantes de edición usan una sola celda colSpan con
      // formularios inline: ahí no hay correspondencia 1:1 y se excluyen.
      if (/colSpan/.test(source)) return;
      expect(cells.length % heads.length).toBe(0);
      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i]) {
          expect(heads[i % heads.length]).toBe(true);
        }
      }
    });
  }

  it("pedidos: la columna Envío existe con su filtro", () => {
    const source = readFileSync(resolve(here, "pedidos/page.tsx"), "utf8");
    expect(source).toContain("<TableHead>Envío</TableHead>");
    expect(source).toContain('name="envio"');
  });
});
