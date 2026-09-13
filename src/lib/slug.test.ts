import { describe, it, expect } from "vitest";

import { slugify, resolveUniqueSlug } from "./slug";

describe("slugify", () => {
  it("deriva el slug del nombre en minúsculas con guiones", () => {
    expect(slugify("Sauvage Eau de Toilette")).toBe("sauvage-eau-de-toilette");
  });

  it("elimina tildes y caracteres especiales", () => {
    expect(slugify("Éclat d'Or Nº 5")).toBe("eclat-d-or-n-5");
  });

  it("colapsa separadores y recorta guiones de borde", () => {
    expect(slugify("  A -- B  ")).toBe("a-b");
  });

  it("devuelve cadena vacía si no hay nada aprovechable", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("resolveUniqueSlug", () => {
  it("devuelve la base cuando está libre", async () => {
    await expect(resolveUniqueSlug("sauvage", async () => false)).resolves.toBe("sauvage");
  });

  it("añade sufijo -2, -3 hasta encontrar uno libre", async () => {
    const taken = new Set(["sauvage", "sauvage-2"]);
    await expect(
      resolveUniqueSlug("sauvage", async (s) => taken.has(s))
    ).resolves.toBe("sauvage-3");
  });
});
