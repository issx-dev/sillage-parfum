import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SafeImage } from "./SafeImage";

// Regression: una URL remota de host no configurado (p. ej. admin pega
// una CDN cualquiera en la ficha de producto) tumbaba la página con
// `next-image-unconfigured-host`. SafeImage debe degradar a <img>.

describe("SafeImage", () => {
  it("usa next/image para src local", () => {
    const { container } = render(
      <SafeImage src="/images/products/x.png" alt="x" fill sizes="50vw" />
    );
    const img = container.querySelector("img")!;
    expect(img).not.toBeNull();
    expect(img.hasAttribute("data-nimg")).toBe(true);
  });

  it("degrada a <img> nativo con host remoto no configurado (sin crash)", () => {
    const { container } = render(
      <SafeImage
        src="https://cdn.tienda-ejemplo.com/fotos/img.jpg?scaleWidth=750"
        alt="cdn cualquiera"
        fill
        sizes="50vw"
        className="object-contain"
      />
    );
    const img = container.querySelector("img")!;
    expect(img).not.toBeNull();
    expect(img.hasAttribute("data-nimg")).toBe(false);
    expect(img.getAttribute("src")).toContain("cdn.tienda-ejemplo.com");
  });

  it("usa next/image para host remoto en allowlist", () => {
    const { container } = render(
      <SafeImage src="https://images.unsplash.com/x.jpg" alt="u" width={100} height={100} />
    );
    expect(container.querySelector("img")!.hasAttribute("data-nimg")).toBe(true);
  });
});
