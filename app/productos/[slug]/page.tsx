import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug, getProducts } from "@/lib/data";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";
import { Wind, Heart, Layers } from "lucide-react";

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

  if (!product.variants || product.variants.length === 0) {
    notFound();
  }
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
    <div className="pt-36 lg:pt-44 pb-24 lg:pb-32 min-h-[85vh] flex items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-light to-cream rounded-card overflow-hidden">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-8"
              priority
            />
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

            {/* Add to cart (client component) */}
            <div className="mt-8">
              <AddToCartWrapper product={product} firstVariant={firstVariant} hasDiscount={hasDiscount} />
            </div>

            {/* Notes pyramid — below AddToCart */}
            <div className="mt-10">
              <h2 className="font-serif text-xl mb-4">Notas olfativas</h2>
              <div className="grid grid-cols-3 gap-1 xs:gap-2">
                <div className="text-center px-1 xs:px-2">
                  <p className="text-xs text-gold uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5 font-medium">
                    <Wind className="w-3.5 h-3.5 text-gold shrink-0" />
                    Salida
                  </p>
                  <ul className="text-xs xs:text-sm space-y-1.5 w-fit mx-auto text-left">
                    {product.notes.top.map((note) => (
                      <li key={note} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold opacity-50 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-center border-l border-r border-gray-light/60 px-1.5 xs:px-3 sm:px-4">
                  <p className="text-xs text-gold uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5 font-medium">
                    <Heart className="w-3.5 h-3.5 text-terracotta shrink-0" />
                    Corazón
                  </p>
                  <ul className="text-xs xs:text-sm space-y-1.5 w-fit mx-auto text-left">
                    {product.notes.heart.map((note) => (
                      <li key={note} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-terracotta opacity-50 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-center px-1 xs:px-2">
                  <p className="text-xs text-gold uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5 font-medium">
                    <Layers className="w-3.5 h-3.5 text-gray-mid shrink-0" />
                    Fondo
                  </p>
                  <ul className="text-xs xs:text-sm space-y-1.5 w-fit mx-auto text-left">
                    {product.notes.base.map((note) => (
                      <li key={note} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-mid opacity-50 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { AddToCartWrapper } from "@/components/product/AddToCartWrapper";
import type { Variant } from "@/types";
