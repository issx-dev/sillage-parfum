import { HeroSection } from "@/components/home/HeroSection";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { EditorialSplitSingle } from "@/components/home/EditorialSplitSingle";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { Newsletter } from "@/components/home/Newsletter";
import { getFeaturedProducts, getNewArrivals, getDiscoverProducts } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};


export default function HomePage() {
  const featured = getFeaturedProducts(6);
  const newArrivals = getNewArrivals();
  const discover = getDiscoverProducts(8);
  // Merge featured + new arrivals for main carousel, deduplicating by slug
  const seen = new Set<string>();
  const allProducts = [...featured, ...newArrivals].filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  }).slice(0, 8);

  return (
    <>
      {/* 1. HeroSection — dark background, VIDEO hero */}
      <HeroSection />

      {/* 2. ProductCarousel (light) — Bestsellers & Novedades */}
      <ProductCarousel
        variant="light"
        products={allProducts}
        eyebrow="selección sillage"
        title="Lo más elegido"
        subtitle="Bestsellers y novedades selecionados por su carácter excepcional."
      />

      {/* 3. EditorialSplitSingle — dark background, ONE powerful brand story */}
      <EditorialSplitSingle
        label="la collection masculine"
        title="La fuerza de la sutileza"
        description="Aromas que redefinen la elegancia contemporánea. Un tributo a la frescura magnética y al carácter atemporal del hombre moderno."
        ctaText="Descubrir fragancias masculinas"
        href="/productos?gender=masculino"
        imageSrc="/images/collections/masculine.jpg"
        imageAlt="Colección Masculina Premium Sillage"
        reverse={false}
        imagePosition="right"
        variant="dark"
      />

      {/* 4. CategoriesGrid — cream/warm background, clean grid of fragrance families */}
      <CategoriesGrid />

      {/* 5. ProductCarousel (dark) — distinct products from featured */}
      <ProductCarousel
        variant="dark"
        products={discover}
        eyebrow="continuación"
        title="Descubre más"
        subtitle="Explora nuestra selección de fragancias que definen tendencias."
        showStatusBadges={false}
      />

      {/* 6. Newsletter — cream/warm background, Member's Club framing */}
      <Newsletter />
    </>
  );
}
