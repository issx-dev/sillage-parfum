import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("Footer component accessibility", () => {
  it("verifies payment icon wrapper divs do NOT have aria-label, and SVGs have role='img' and aria-label", () => {
    render(<Footer />);
    
    // We expect the SVGs to have role="img" and aria-label
    // Currently, this will fail because the label is on the wrapper div, and the svg has no role or aria-label
    const visaSvg = screen.getByLabelText("Visa");
    expect(visaSvg.tagName.toLowerCase()).toBe("svg");
    expect(visaSvg).toHaveAttribute("role", "img");
    
    const mcSvg = screen.getByLabelText("Mastercard");
    expect(mcSvg.tagName.toLowerCase()).toBe("svg");
    expect(mcSvg).toHaveAttribute("role", "img");
    
    const paypalSvg = screen.getByLabelText("PayPal");
    expect(paypalSvg.tagName.toLowerCase()).toBe("svg");
    expect(paypalSvg).toHaveAttribute("role", "img");
    
    const bizumSvg = screen.getByLabelText("Bizum");
    expect(bizumSvg.tagName.toLowerCase()).toBe("svg");
    expect(bizumSvg).toHaveAttribute("role", "img");

    // Parent container divs of these SVGs should NOT have an aria-label attribute
    expect(visaSvg.parentElement).not.toHaveAttribute("aria-label");
    expect(mcSvg.parentElement).not.toHaveAttribute("aria-label");
    expect(paypalSvg.parentElement).not.toHaveAttribute("aria-label");
    expect(bizumSvg.parentElement).not.toHaveAttribute("aria-label");
  });

  it("verifies footer links and text elements use high contrast text-cream/60 instead of text-gray-mid", () => {
    render(<Footer />);
    
    const tagline = screen.getByText("El arte del perfume, redescubierto.");
    expect(tagline.className).toContain("text-cream/60");
    expect(tagline.className).not.toContain("text-gray-mid");

    const link = screen.getByRole("link", { name: "Mujer" });
    expect(link.className).toContain("text-cream/60");
    expect(link.className).not.toContain("text-gray-mid");
  });
});
