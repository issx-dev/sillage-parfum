import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";

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

/**
 * Layout raíz mínimo: fuentes, metadatos y estilos globales.
 *
 * Intencionadamente SIN chrome de tienda (PromoBar/Navbar/Footer) ni de
 * admin: cada route group — `(tienda)` y `(admin)` — pinta su propio shell
 * en su layout. Así el chrome de la tienda nunca puede colarse en /admin.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
