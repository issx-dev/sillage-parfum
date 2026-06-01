import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/data";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const products = getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Producto no encontrado" };

  const lowestPrice = Math.min(...product.variants.map((v) => v.price));
  const hasDiscount = product.discount_percent > 0;
  const finalPrice = hasDiscount
    ? lowestPrice * (1 - product.discount_percent / 100)
    : lowestPrice;

  return {
    title: `${product.name} — SILLAGE`,
    description: product.shortDescription,
    alternates: {
      canonical: `/productos/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} — SILLAGE`,
      description: product.shortDescription,
      url: `https://sillage.com/productos/${product.slug}`,
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

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const firstVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const hasDiscount = product.discount_percent > 0;
  const finalPrice = hasDiscount
    ? firstVariant.price * (1 - product.discount_percent / 100)
    : firstVariant.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images?.[0]
      ? `https://sillage.com${product.images[0]}`
      : "https://sillage.com/images/og-default.jpg",
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `https://sillage.com/productos/${product.slug}`,
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
    <div className="pt-20 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-gray-light to-cream rounded-card flex items-center justify-center">
            <div className="w-48 h-64 bg-gradient-to-br from-gray-mid/20 to-gold/20 rounded-lg" />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <span className="text-xs px-2 py-1 bg-gray-light text-gray-mid rounded-full w-fit mb-2">
              {product.family}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl">{product.name}</h1>
            <p className="text-sm uppercase tracking-wider text-gray-mid mt-1">
              {product.brand}
            </p>
            <p className="mt-4 text-gray-mid">{product.shortDescription}</p>

            {/* Notes pyramid */}
            <div className="mt-8">
              <h2 className="font-serif text-xl mb-4">Notas olfativas</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gold uppercase tracking-wider mb-2">Salida</p>
                  <ul className="text-sm space-y-1">
                    {product.notes.top.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-center border-l border-r border-gray-light">
                  <p className="text-xs text-gold uppercase tracking-wider mb-2">Corazón</p>
                  <ul className="text-sm space-y-1">
                    {product.notes.heart.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gold uppercase tracking-wider mb-2">Fondo</p>
                  <ul className="text-sm space-y-1">
                    {product.notes.base.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Variant + Add to cart */}
            <div className="mt-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {product.variants.map((v) => (
                  <div
                    key={v.id}
                    className="px-3 py-1.5 text-sm border border-gray-light rounded text-gray-mid"
                  >
                    {v.size_ml}ml — {formatPrice(v.price)}
                    {v.stock === 0 && " (Agotado)"}
                  </div>
                ))}
              </div>
            </div>

            {/* Price display */}
            <div className="mt-4">
              {hasDiscount ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold text-gold-dark">
                    {formatPrice(firstVariant.price * (1 - product.discount_percent / 100))}
                  </span>
                  <span className="text-lg text-gray-mid line-through">
                    {formatPrice(firstVariant.price)}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-semibold">{formatPrice(firstVariant.price)}</span>
              )}
            </div>

            {/* Add to cart (client component) */}
            <div className="mt-8">
              <AddToCartWrapper product={product} firstVariant={firstVariant} hasDiscount={hasDiscount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { AddToCartWrapper } from "@/components/product/AddToCartWrapper";
import type { Variant } from "@/types";
