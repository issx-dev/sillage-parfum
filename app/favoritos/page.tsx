import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = {
  title: "Lista de Deseos | SILLAGE",
  description: "Tus fragancias guardadas. Encuentra y compra los perfumes que te han enamorado.",
  robots: { index: false }, // Personalized page — no SEO value
};

/**
 * Server Component: fetches all products and passes them to the Client Component.
 * The Client Component (WishlistView) filters by the user's wishlist store.
 * This approach respects the server-only data layer while supporting client-side state.
 */
export default function FavoritosPage() {
  const allProducts = getProducts();

  return (
    <section className="bg-cream pt-28 sm:pt-32 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-warm-900 tracking-wide">
          Lista de deseos
        </h1>
      </div>
      <WishlistView allProducts={allProducts} />
    </section>
  );
}
