import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "./layout";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockImplementation(() =>
    Promise.resolve({
      get: (key: string) => {
        if (key === "x-nonce") return "mock-nonce";
        return null;
      },
    })
  ),
}));

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Cormorant_Garamond: () => ({
    variable: "font-serif",
  }),
  Inter: () => ({
    variable: "font-sans",
  }),
}));

// Mock lib/data — getProductBySlug is now async
vi.mock("@/lib/data", () => ({
  getProductBySlug: vi.fn().mockImplementation(async (slug: string) => ({
    id: slug,
    slug,
    name: `Product ${slug}`,
    shortDescription: `Description ${slug}`,
    brand: "TestBrand",
    family: "Floral",
    gender: "unisex",
    badge: null,
    images: ["/image.jpg"],
    variants: [],
    discount_percent: 0,
    notes: { top: [], heart: [], base: [] },
  })),
}));

// Mock sub-components
vi.mock("@/components/layout/PromoBar", () => ({
  PromoBar: () => <div data-testid="promo-bar" />,
}));
vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));
vi.mock("@/components/layout/CartDrawerWrapper", () => ({
  CartDrawerWrapper: () => <div data-testid="cart-drawer" />,
}));
vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div data-testid="footer" />,
}));
vi.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe("RootLayout structure and styling", () => {
  it("renders a fixed header container with safe-area notch padding class", async () => {
    const layout = await RootLayout({
      children: <div data-testid="children-content">Test Children</div>,
    });
    const { container } = render(layout);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header?.className).not.toContain("pt-[env(safe-area-inset-top)]");
    expect(header?.className).not.toContain("bg-black");
    expect(header?.className).toContain("fixed");
    expect(header?.className).toContain("top-0");
  });

  it("renders children content inside the main tag", async () => {
    const layout = await RootLayout({
      children: <div data-testid="custom-child-element">Unique Child Content</div>,
    });
    const { getByTestId, container } = render(layout);

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();

    const child = getByTestId("custom-child-element");
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe("Unique Child Content");
    expect(main).toContainElement(child);
  });

  it("sets the html document language to Spanish (es)", async () => {
    const layout = await RootLayout({
      children: <div>Content</div>,
    });
    const { container } = render(layout);

    const htmlElement = container.querySelector("html");
    expect(htmlElement).toBeInTheDocument();
    expect(htmlElement).toHaveAttribute("lang", "es");
  });
});
