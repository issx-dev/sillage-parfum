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

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Case C: two variants, both in stock */
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

/** Case A: all variants sold out */
const soldOutProduct: Product = {
  ...fixtureProduct,
  variants: [
    { id: "sold-050", size_ml: 50, price: 50, stock: 0, sku: "SOLD-050" },
    { id: "sold-100", size_ml: 100, price: 90, stock: 0, sku: "SOLD-100" },
  ],
};

/** Case B: single variant in stock */
const singleVariantProduct: Product = {
  ...fixtureProduct,
  variants: [
    { id: "single-050", size_ml: 50, price: 50, stock: 10, sku: "SGL-050" },
  ],
};

/** Case C with mixed stock: one in stock, one OOS */
const mixedStockProduct: Product = {
  ...fixtureProduct,
  variants: [
    { id: "mix-050", size_ml: 50, price: 50, stock: 10, sku: "MIX-050" },
    { id: "mix-100", size_ml: 100, price: 90, stock: 0, sku: "MIX-100" },
  ],
};

function resetStores() {
  localStorage.clear();
  useCartStore.setState({ items: [], _hasHydrated: false, isCartOpen: false });
  useWishlistStore.setState({ productIds: [], _hasHydrated: false });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ProductCard interactive elements", () => {
  beforeEach(() => {
    resetStores();
    linkNavigateSpy.mockClear();
  });

  it("triggers wishlist toggle when favorite button is clicked and does NOT navigate", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={fixtureProduct} />);

    const favButton = screen.getByRole("button", { name: /favoritos/i });
    await user.click(favButton);

    expect(useWishlistStore.getState().productIds).toContain(fixtureProduct.id);
    expect(linkNavigateSpy).not.toHaveBeenCalled();
  });

  // ─── Buy Bar ─────────────────────────────────────────────────────────────

  describe("buy bar", () => {
    // ─── Case A: all variants sold out ─────────────────────────────────────

    describe("Case A: all variants sold out", () => {
      it("renders 'Agotado' text", () => {
        render(<ProductCard product={soldOutProduct} />);
        expect(screen.getByText("Agotado")).toBeInTheDocument();
      });

      it("does not render any add-to-cart button", () => {
        render(<ProductCard product={soldOutProduct} />);
        expect(
          screen.queryByRole("button", { name: /añadir al carrito/i })
        ).not.toBeInTheDocument();
      });
    });

    // ─── Case B: single variant in stock ───────────────────────────────────

    describe("Case B: single variant in stock", () => {
      it("renders add-to-cart button", () => {
        render(<ProductCard product={singleVariantProduct} />);
        const button = screen.getByRole("button", { name: /añadir al carrito/i });
        expect(button).toBeInTheDocument();
      });

      it("adds the variant to cart on click and does NOT navigate", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={singleVariantProduct} />);

        await user.click(screen.getByRole("button", { name: /añadir al carrito/i }));
        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0]!.variantId).toBe("single-050");
        expect(cartItems[0]!.size_ml).toBe(50);
        expect(linkNavigateSpy).not.toHaveBeenCalled();
      });
    });

    // ─── Case C: multiple variants ─────────────────────────────────────────

    describe("Case C: multiple variants", () => {
      it("renders per-size variant buttons with correct aria-labels", () => {
        render(<ProductCard product={fixtureProduct} />);
        // Default selected variant (first in-stock: 50ml) shows "Confirmar"
        // Buttons are in the closed drawer but visible in the DOM
        expect(
          screen.getByRole("button", { name: /confirmar 50ml al carrito/i })
        ).toBeInTheDocument();
        // Non-selected variant shows "Seleccionar"
        expect(
          screen.getByRole("button", { name: /seleccionar 100ml/i })
        ).toBeInTheDocument();
      });

      it("selects variant on first tap and confirms on second tap (double-tap flow)", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={fixtureProduct} />);

        // Open the drawer
        await user.click(screen.getByRole("button", { name: /añadir al carrito/i }));

        // First tap: select 100ml → price updates, label changes to "Confirmar"
        await user.click(
          screen.getByRole("button", { name: /seleccionar 100ml/i })
        );
        expect(screen.getByText("90,00 €")).toBeInTheDocument();
        expect(screen.queryByText("50,00 €")).not.toBeInTheDocument();

        // Second tap on the same chip: confirm → add to cart
        await user.click(
          screen.getByRole("button", { name: /confirmar 100ml al carrito/i })
        );
        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0]!.variantId).toBe("test-100");
        expect(cartItems[0]!.size_ml).toBe(100);
        expect(linkNavigateSpy).not.toHaveBeenCalled();
      });

      it("updates displayed price when selecting a different variant", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={fixtureProduct} />);

        // Default price: first in-stock variant (50ml → 50,00 €)
        expect(screen.getByText("50,00 €")).toBeInTheDocument();

        // Open the drawer
        await user.click(screen.getByRole("button", { name: /añadir al carrito/i }));

        // Select 100ml variant → price updates
        await user.click(
          screen.getByRole("button", { name: /seleccionar 100ml/i })
        );
        expect(screen.getByText("90,00 €")).toBeInTheDocument();
        expect(screen.queryByText("50,00 €")).not.toBeInTheDocument();

        // Select back 50ml → price reverts
        await user.click(
          screen.getByRole("button", { name: /seleccionar 50ml/i })
        );
        expect(screen.getByText("50,00 €")).toBeInTheDocument();
      });

      it("disables out-of-stock variant button", () => {
        render(<ProductCard product={mixedStockProduct} />);

        const oosButton = screen.getByRole("button", {
          name: /seleccionar 100ml/i,
        });
        expect(oosButton).toBeDisabled();
      });

      it("shows discounted price and applies discount on add-to-cart", async () => {
        const user = userEvent.setup();
        const discountProduct: Product = {
          ...fixtureProduct,
          discount_percent: 10,
        };
        render(<ProductCard product={discountProduct} />);

        // Default: 50ml variant at 10% off → 50 * 0.9 = 45
        expect(screen.getByText("45,00 €")).toBeInTheDocument();

        // Open the drawer
        await user.click(screen.getByRole("button", { name: /añadir al carrito/i }));

        // Select 100ml → 90 * 0.9 = 81
        await user.click(
          screen.getByRole("button", { name: /seleccionar 100ml/i })
        );
        expect(screen.getByText("81,00 €")).toBeInTheDocument();

        // Confirm via double-tap
        await user.click(
          screen.getByRole("button", { name: /confirmar 100ml al carrito/i })
        );
        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0]!.price).toBe(81); // 90 * 0.9
      });

      it("renders a single OOS variant as Case A (Agotado)", () => {
        const singleOosProduct: Product = {
          ...fixtureProduct,
          variants: [
            { id: "oos-050", size_ml: 50, price: 50, stock: 0, sku: "OOS-050" },
          ],
        };
        render(<ProductCard product={singleOosProduct} />);
        expect(screen.getByText("Agotado")).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /añadir al carrito/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("contrast classes", () => {
    it("asserts that light theme descriptions use text-charcoal/70 instead of text-gray-mid/80", () => {
      render(<ProductCard product={fixtureProduct} theme="light" />);
      const description = screen.getByText(fixtureProduct.shortDescription || "");
      expect(description.className).toContain("text-charcoal/70");
      expect(description.className).not.toContain("text-gray-mid/80");
    });
  });
});