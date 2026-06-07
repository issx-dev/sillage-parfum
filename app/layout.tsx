import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { PromoBar } from "@/components/layout/PromoBar";
import { Navbar } from "@/components/layout/Navbar";
import { CartDrawerWrapper } from "@/components/layout/CartDrawerWrapper";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { getProductBySlug } from "@/lib/data";
import type { Product } from "@/types";

const RECOMMENDED_SLUGS = [
  "sauvage-dior-edt",
  "chanel-5-edp",
  "bleu-de-chanel-edp",
  "black-orchid-edp",
];

function getRecommendedProducts(): Product[] {
  return RECOMMENDED_SLUGS.map((s) => getProductBySlug(s)).filter(
    (p): p is Product => Boolean(p)
  );
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sillage.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SILLAGE — Perfumería de Lujo",
  description:
    "523 fragancias de las mejores casas del mundo. Envío en 24h y productos 100% originales.",
  keywords: ["perfumería", "lujo", "fragancias", "perfumes", "SILLAGE"],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "SILLAGE — Perfumería de Lujo",
    description: "523 fragancias de las mejores casas del mundo. Envío en 24h.",
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
    description: "523 fragancias de las mejores casas del mundo. Envío en 24h.",
    images: [`${siteUrl}/images/og-default.jpg`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <header className="fixed top-0 left-0 right-0 z-50">
          <PromoBar />
          <Navbar recommendedProducts={getRecommendedProducts()} />
        </header>
        <CartDrawerWrapper />
        <main>{children}</main>
        <Footer />
        <Toaster
          position="bottom-right"
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "SILLAGE",
                  url: "https://sillage.com",
                  logo: "https://sillage.com/images/og-default.jpg",
                  description: "Perfumería de lujo con más de 523 fragancias de las mejores casas del mundo.",
                  sameAs: [
                    "https://instagram.com/sillage",
                    "https://facebook.com/sillage",
                  ],
                },
                {
                  "@type": "WebSite",
                  url: "https://sillage.com",
                  name: "SILLAGE — Perfumería de Lujo",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://sillage.com/productos?q={search_term_string}",
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
