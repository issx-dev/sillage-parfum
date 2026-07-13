import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { PromoBar } from "@/components/layout/PromoBar";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawerWrapper } from "@/components/layout/CartDrawerWrapper";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { getProductBySlug } from "@/lib/data";
import { SITE_URL } from "@/lib/site-config";
import type { Product } from "@/types";

const RECOMMENDED_SLUGS = [
  "sauvage-dior-edt",
  "chanel-5-edp",
  "bleu-de-chanel-edp",
  "black-orchid-edp",
];

async function getRecommendedProducts(): Promise<Product[]> {
  const results = await Promise.all(
    RECOMMENDED_SLUGS.map((s) => getProductBySlug(s))
  );
  return results.filter((p): p is Product => Boolean(p));
}

const siteUrl = SITE_URL;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SILLAGE — Perfumería de Lujo",
  description:
    "Una colección seleccionada de fragancias de las mejores casas del mundo. Envío en 24h y productos 100% originales.",
  keywords: ["perfumería", "lujo", "fragancias", "perfumes", "SILLAGE"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "SILLAGE — Perfumería de Lujo",
    description: "Una colección seleccionada de fragancias de las mejores casas del mundo. Envío en 24h.",
    url: siteUrl,
    siteName: "SILLAGE",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: `${siteUrl}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: "SILLAGE — Perfumería de Lujo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SILLAGE — Perfumería de Lujo",
    description: "Una colección seleccionada de fragancias de las mejores casas del mundo. Envío en 24h.",
    images: [`${siteUrl}/images/og-default.jpg`],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <header className="fixed top-0 left-0 right-0 z-50">
          <PromoBar />
          <Navbar recommendedProducts={await getRecommendedProducts()} />
        </header>
        <CartDrawerWrapper />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          toastOptions={{
            style: {
              background: "var(--color-cream)",
              color: "var(--color-black)",
              borderRadius: "12px",
            },
          }}
        />
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
                  description: "Perfumería de lujo con una selección exclusiva de fragancias de las mejores casas del mundo.",
                  sameAs: [
                    "https://instagram.com/sillage",
                    "https://facebook.com/sillage",
                  ],
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
      </body>
    </html>
  );
}