import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/TrustBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { EditorialSplitSections } from "@/components/home/EditorialSplitSections";
import { EditorialBanner } from "@/components/home/EditorialBanner";
import { BrandCarousel } from "@/components/home/BrandCarousel";
import { NewArrivals } from "@/components/home/NewArrivals";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";
import { getFeaturedProducts, getNewArrivals, getBrands } from "@/lib/data";

export default function HomePage() {
  const featured = getFeaturedProducts(8);
  const newArrivals = getNewArrivals();
  const brands = getBrands();

  return (
    <>
      <HeroSection />
      <TrustBar />
      <CategoryGrid />
      <FeaturedProducts products={featured} />
      <EditorialSplitSections />
      <EditorialBanner />
      <BrandCarousel brands={brands} />
      <NewArrivals products={newArrivals} />
      <WhyChooseUs />
      <Testimonials />
      <Newsletter />
    </>
  );
}

