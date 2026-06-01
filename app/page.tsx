import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { EditorialSplitSingle } from "@/components/home/EditorialSplitSingle";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { SecondaryProducts } from "@/components/home/SecondaryProducts";
import { Newsletter } from "@/components/home/Newsletter";
import { Footer } from "@/components/layout/Footer";
import { getFeaturedProducts, getNewArrivals } from "@/lib/data";

export default function HomePage() {
  const featured = getFeaturedProducts(6);
  const newArrivals = getNewArrivals();
  // Combine featured and new arrivals for merged carousel
  const allProducts = [...featured, ...newArrivals].slice(0, 8);

  return (
    <>
      {/* 1. HeroSection — dark background, VIDEO hero */}
      <HeroSection />

      {/* 2. FeaturedProducts — cream/warm background, merged Bestsellers & Novedades carousel */}
      <FeaturedProducts
        products={allProducts}
        title="Bestsellers & Novedades"
        subtitle="Los esenciales y las últimas creaciones, elegidos por su carácter excepcional."
      />

      {/* 3. EditorialSplitSingle — dark background, ONE powerful brand story */}
      <EditorialSplitSingle
        label="la collection masculine"
        title="La fuerza de la sutileza"
        description="Aromas que redefinen la elegancia contemporánea. Un tributo a la frescura magnética y al carácter atemporal del hombre moderno."
        ctaText="Descubrir fragancias masculinas"
        href="/productos?gender=masculino"
        imageSrc="/images/collections/masculine.png"
        imageAlt="Colección Masculina Premium Sillage"
        reverse={false}
        imagePosition="right"
      />

      {/* 4. CategoriesGrid — cream/warm background, clean grid of fragrance families */}
      <CategoriesGrid />

      {/* 5. SecondaryProducts — dark background, second product carousel */}
      <SecondaryProducts products={featured.slice(0, 6)} />

      {/* 6. Newsletter — cream/warm background, Member's Club framing */}
      <Newsletter />

      {/* 7. Footer — dark background, 4-column pattern */}
      <Footer />
    </>
  );
}