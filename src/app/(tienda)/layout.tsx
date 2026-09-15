import { headers } from "next/headers";
import { PromoBar } from "@/components/layout/PromoBar";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawerWrapper } from "@/components/layout/CartDrawerWrapper";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { SillageToaster } from "@/components/ui/SillageToaster";
import { getProductBySlug } from "@/lib/data";
import { SITE_URL } from "@/lib/site-config";
import type { Product } from "@/types";

const RECOMMENDED_SLUGS = [
  "sauvage-dior-chogan-094", // ⬛ Revenant Intense
  "libre-ysl-chogan-122", // ⚪ Volare
  "baccarat-rouge-540-chogan-118", // 🟨 Scarlet Fire
  "acqua-di-gio-armani-chogan-002", // 🟦 Deep Blue for Him
];

async function getRecommendedProducts(): Promise<Product[]> {
  const results = await Promise.all(RECOMMENDED_SLUGS.map((s) => getProductBySlug(s)));
  return results.filter((p): p is Product => Boolean(p));
}

const siteUrl = SITE_URL;

/**
 * Shell de la tienda (route group `(tienda)`): PromoBar + Navbar + Footer.
 * Vive aquí — y solo aquí — para que /admin tenga su propio shell oscuro
 * sin heredar nunca el chrome comercial.
 */
export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <PromoBar />
        <Navbar recommendedProducts={await getRecommendedProducts()} />
      </header>
      <CartDrawerWrapper />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
      <SillageToaster />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: "SILLAGE",
                url: siteUrl,
                logo: `${siteUrl}/images/og-default.jpg`,
                description:
                  "Perfumería de lujo con una selección exclusiva de fragancias de las mejores casas del mundo.",
                sameAs: ["https://instagram.com/sillage", "https://facebook.com/sillage"],
              },
              {
                "@type": "WebSite",
                url: siteUrl,
                name: "SILLAGE — Perfumería de Lujo",
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${siteUrl}/productos?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }),
        }}
      />
    </>
  );
}
