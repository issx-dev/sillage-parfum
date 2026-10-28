import { describe, it, expect } from "vitest";

import {
  MAX_PRODUCT_IMAGE_BYTES,
  isAllowedProductImageType,
  isAllowedProductImageSize,
  parseImageLines,
  buildProductImageKey,
} from "./image-upload";

describe("image-upload (ficha de producto)", () => {
  it("límite de 5 MB", () => {
    expect(MAX_PRODUCT_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("acepta solo imágenes", () => {
    expect(isAllowedProductImageType("image/jpeg")).toBe(true);
    expect(isAllowedProductImageType("image/webp")).toBe(true);
    expect(isAllowedProductImageType("application/pdf")).toBe(false);
    expect(isAllowedProductImageType("video/mp4")).toBe(false);
  });

  it("rechaza archivos mayores de 5 MB", () => {
    expect(isAllowedProductImageSize(1024)).toBe(true);
    expect(isAllowedProductImageSize(5 * 1024 * 1024)).toBe(true);
    expect(isAllowedProductImageSize(5 * 1024 * 1024 + 1)).toBe(false);
  });

  it("parsea líneas de URLs crudas (rutas y http[s])", () => {
    expect(parseImageLines("/images/a.jpg\nhttps://x.test/b.png\nnota\n")).toEqual([
      "/images/a.jpg",
      "https://x.test/b.png",
    ]);
  });

  it("genera clave de Storage saneada", () => {
    const key = buildProductImageKey("prod_abc", "Mi Foto 1.JPG");
    expect(key.startsWith("prod-abc/")).toBe(true);
    expect(key).not.toMatch(/[A-Z ]/);
    expect(key.endsWith(".jpg")).toBe(true);
  });
});
