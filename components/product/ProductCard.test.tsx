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
      it("renders add-to-cart button with size label", () => {
        render(<ProductCard product={singleVariantProduct} />);
        const button = screen.getByRole("button", { name: /añadir al carrito/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(/añadir/i);
      });

      it("adds the variant to cart on click and does NOT navigate", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={singleVariantProduct} />);

        await user.click(screen.getByRole("button", { name: /añadir al carrito/i }));
        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0].variantId).toBe("single-050");
        expect(cartItems[0].size_ml).toBe(50);
        expect(linkNavigateSpy).not.toHaveBeenCalled();
      });
    });

    // ─── Case C: multiple variants ─────────────────────────────────────────

    describe("Case C: multiple variants", () => {
      it("renders per-size variant buttons", () => {
        render(<ProductCard product={fixtureProduct} />);
        expect(
          screen.getByRole("button", { name: /añadir 50ml al carrito/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /añadir 100ml al carrito/i })
        ).toBeInTheDocument();
      });

      it("adds correct variant to cart when clicking a variant button", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={fixtureProduct} />);

        await user.click(
          screen.getByRole("button", { name: /añadir 100ml al carrito/i })
        );
        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0].variantId).toBe("test-100");
        expect(cartItems[0].size_ml).toBe(100);
        expect(linkNavigateSpy).not.toHaveBeenCalled();
      });

      it("updates displayed price when hovering over variant button", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={fixtureProduct} />);

        // Default price: first in-stock variant (50ml → 50,00 €)
        expect(screen.getByText("50,00 €")).toBeInTheDocument();

        // Hover over 100ml variant → price updates
        await user.hover(
          screen.getByRole("button", { name: /añadir 100ml al carrito/i })
        );
        expect(screen.getByText("90,00 €")).toBeInTheDocument();
        expect(screen.queryByText("50,00 €")).not.toBeInTheDocument();

        // Unhover → price reverts to default
        await user.unhover(
          screen.getByRole("button", { name: /añadir 100ml al carrito/i })
        );
        expect(screen.getByText("50,00 €")).toBeInTheDocument();
      });

      it("disables out-of-stock variant button and does not add to cart on click", async () => {
        const user = userEvent.setup();
        render(<ProductCard product={mixedStockProduct} />);

        const oosButton = screen.getByRole("button", {
          name: /añadir 100ml al carrito/i,
        });
        expect(oosButton).toBeDisabled();

        await user.click(oosButton);
        // Disabled buttons should not trigger click handlers
        expect(useCartStore.getState().items).toHaveLength(0);
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

        // Hover 100ml variant → 90 * 0.9 = 81
        await user.hover(
          screen.getByRole("button", { name: /añadir 100ml al carrito/i })
        );
        expect(screen.getByText("81,00 €")).toBeInTheDocument();

        // Click 50ml variant → discounted price added to cart
        await user.unhover(
          screen.getByRole("button", { name: /añadir 100ml al carrito/i })
        );
        await user.click(
          screen.getByRole("button", { name: /añadir 50ml al carrito/i })
        );
        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0].price).toBe(45); // 50 * 0.9
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
});