import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getProductBySlug, getProducts } from "@/lib/data";
import type { Metadata } from "next";
import { applyDiscount } from "@/lib/utils";
import { SITE_URL } from "@/lib/site-config";
import { Wind, Heart, Layers } from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartWrapper } from "@/components/product/AddToCartWrapper";
import { ProductCard } from "@/components/product/ProductCard";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Producto no encontrado" };

  if (!product.variants || product.variants.length === 0) {
    notFound();
  }
  const lowestPrice = Math.min(...product.variants.map((v) => v.price));
  const finalPrice = applyDiscount(lowestPrice, product.discount_percent);

  return {
    title: `${product.name} — SILLAGE`,
    description: product.shortDescription,
    alternates: {
      canonical: `/productos/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} — SILLAGE`,
      description: product.shortDescription,
      url: `${SITE_URL}/productos/${product.slug}`,
      type: "website",
      images: [
        {
          url: product.images?.[0] || "/images/og-default.jpg",
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — SILLAGE`,
      description: product.shortDescription,
      images: [product.images?.[0] || "/images/og-default.jpg"],
    },
    other: {
      "product:price:amount": String(finalPrice.toFixed(2)),
      "product:price:currency": "EUR",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  const nonce = (await headers()).get("x-nonce") ?? "";

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (a.gender === product.gender ? -1 : 1))
    .slice(0, 4);

  const firstVariant = product.variants.find((v) => v.stock > 0) ?? product.variants[0]!;
  const hasDiscount = product.discount_percent > 0;
  const finalPrice = applyDiscount(firstVariant.price, product.discount_percent);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images?.[0]
      ? `${SITE_URL}${product.images[0]}`
      : `${SITE_URL}/images/og-default.jpg`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/productos/${product.slug}`,
      priceCurrency: "EUR",
      price: finalPrice.toFixed(2),
      availability:
        firstVariant.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "SILLAGE",
      },
    },
  };

  return (
    <div className="pt-28 lg:pt-36 pb-24 lg:pb-32 min-h-[85vh]">
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Upper section: Gallery + Purchase (50/50 layout, no gray box) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* Image Gallery */}
          <div className="lg:col-span-6 w-full border-b lg:border-b-0 lg:border-r border-warm-200/50 flex flex-col justify-between">
            <ProductGallery images={product.images} name={product.name} discountPercent={product.discount_percent} />
          </div>

          {/* Quick Purchase Info */}
          <div className="lg:col-span-6 flex flex-col justify-center p-4 sm:p-6 lg:p-12 lg:py-12">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark">
                {product.family}
              </span>
            </div>

            {/* Inspiration Legal Tag */}
            {product.inspiration && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-gold/5 border border-gold/30 rounded-full w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 animate-pulse" />
                <span className="text-xs font-sans text-gold-dark font-medium tracking-tight">
                  Inspiración olfativa: <strong className="font-semibold text-charcoal">{product.inspiration}</strong>
                </span>
              </div>
            )}

            <h1 className="font-serif text-3xl sm:text-4xl text-charcoal leading-tight font-medium">{product.name}</h1>
            <p className="text-xs uppercase tracking-widest text-gray-mid mt-1 font-sans">
              Alta Concentración 30% Extrait de Parfum
            </p>

            {/* Add to cart (client component) */}
            <div className="mt-8">
              <AddToCartWrapper product={product} firstVariant={firstVariant} hasDiscount={hasDiscount} />
            </div>
          </div>
        </div>

        {/* Lower section: Editorial details (Dior inspired) */}
        <div className="mt-20 lg:mt-32 pt-16 border-t border-warm-200/40 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left Column: Big Editorial Description */}
          <div className="lg:col-span-7 space-y-6">
            <p className="font-serif text-xl sm:text-2xl text-charcoal/90 leading-relaxed font-light">
              {product.shortDescription}
            </p>
            <p className="text-sm text-gray-mid font-sans leading-relaxed tracking-wide font-light max-w-xl">
              Cada nota de {product.name} ha sido seleccionada de manera meticulosa por maestros perfumistas para construir una composición equilibrada, expresando una firma de oler con carácter e identidad propia. Ideal para quienes buscan dejar una estela atemporal a su paso.
            </p>
          </div>

          {/* Right Column: Olfactive Notes & Service details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="border-b border-warm-200/50 pb-6">
              <h3 className="font-serif text-lg text-charcoal mb-4">Notas olfativas</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Wind className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gold-dark font-medium block">Salida</span>
                    <span className="text-sm text-charcoal/80">{product.notes.top.join(", ")}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gold-dark font-medium block">Corazón</span>
                    <span className="text-sm text-charcoal/80">{product.notes.heart.join(", ")}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Layers className="w-4 h-4 text-gray-mid shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gold-dark font-medium block">Fondo</span>
                    <span className="text-sm text-charcoal/80">{product.notes.base.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sillage Services */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-warm-200/30 text-xs sm:text-sm text-charcoal/70 font-sans tracking-wide">
                <span>Servicio de envoltura de regalo de cortesía Sillage</span>
                <span className="text-gold-dark text-xs font-serif">→</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-warm-200/30 text-xs sm:text-sm text-charcoal/70 font-sans tracking-wide">
                <span>Envío express asegurado en 24h</span>
                <span className="text-gold-dark text-xs font-serif">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section: Productos que podrían interesarte */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 lg:mt-32 pt-16 border-t border-warm-200/40">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-normal">
                  Productos que podrían interesarte
                </h2>
                <p className="text-xs uppercase tracking-widest text-gold-dark mt-1">
                  Fragancias afines y selecciones curadas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} variant="recommendation" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}