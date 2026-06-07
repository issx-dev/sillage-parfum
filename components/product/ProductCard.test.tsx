import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

const { linkNavigateSpy } = vi.hoisted(() => ({
  linkNavigateSpy: vi.fn(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: { href: string; children: React.ReactNode; className?: string; [k: string]: unknown }) => (
    <a
      href={typeof href === "string" ? href : ""}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        linkNavigateSpy(href);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, fill, priority, sizes, loading, ...rest }: { src: string; alt: string; fill?: boolean; priority?: boolean; sizes?: string; loading?: string; [k: string]: unknown }) => {
    void fill;
    void priority;
    void sizes;
    void loading;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={typeof src === "string" ? src : ""} alt={alt} {...rest} />;
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ProductCard } from "./ProductCard";

const fixtureProduct: Product = {
  id: "test-eau",
  slug: "test-eau",
  name: "Test Eau",
  brand: "TestCo",
  family: "Floral",
  shortDescription: "A test eau de parfum",
  badge: null,
  gender: "masculino",
  images: ["/images/products/test.jpg"],
  variants: [
    { id: "test-050", size_ml: 50, price: 50, stock: 10, sku: "TST-050" },
    { id: "test-100", size_ml: 100, price: 90, stock: 10, sku: "TST-100" },
  ],
  discount_percent: 0,
  notes: { top: ["Bergamota"], heart: ["Rosa"], base: ["Almizcle"] },
};

function resetStores() {
  localStorage.clear();
  useCartStore.setState({ items: [], _hasHydrated: false, isCartOpen: false });
  useWishlistStore.setState({ productIds: [], _hasHydrated: false });
}

describe("ProductCard size selector", () => {
  beforeEach(() => {
    resetStores();
    linkNavigateSpy.mockClear();
  });

  it("selects a size when its button is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={fixtureProduct} />);

    const button100 = screen.getByRole("button", { name: /^100ml$/i });
    expect(button100).not.toHaveClass("bg-black");

    await user.click(button100);

    expect(button100).toHaveClass("bg-black");
  });

  it("does NOT trigger parent Link navigation when a size button is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={fixtureProduct} />);

    const button100 = screen.getByRole("button", { name: /^100ml$/i });
    await user.click(button100);

    expect(linkNavigateSpy).not.toHaveBeenCalled();
  });
});
