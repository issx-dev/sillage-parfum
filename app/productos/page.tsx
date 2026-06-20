import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getProducts } from "@/lib/data";
import type { Metadata } from "next";
import { FilterDrawer } from "@/components/product/FilterDrawer";

interface ProductosPageProps {
  searchParams: { family?: string; badge?: string; gender?: string };
}

export function generateMetadata({ searchParams }: ProductosPageProps): Metadata {
  const { family, badge, gender } = searchParams;
  const titles: Record<string, string> = {
    Floral: "Perfumes Florales de Lujo | SILLAGE",
    Amaderado: "Perfumes Amaderados de Lujo | SILLAGE",
    Oriental: "Perfumes Orientales de Lujo | SILLAGE",
    Fresco: "Perfumes Frescos de Lujo | SILLAGE",
    Gourmand: "Perfumes Gourmand de Lujo | SILLAGE",
    Chipre: "Perfumes Chipre de Lujo | SILLAGE",
    masculino: "Perfumes Masculinos de Lujo | SILLAGE",
    femenino: "Perfumes Femeninos de Lujo | SILLAGE",
    unisex: "Perfumes Unisex de Lujo | SILLAGE",
  };
  const descriptions: Record<string, string> = {
    Floral: "Descubre nuestra colección de perfumes florales de lujo. Notas de rosa, jazmín y flores blancas.",
    Amaderado: "Explora perfumes amaderados con notas de sándalo, cedro y vetiver. Elegancia masculina.",
    Oriental: "Fragancias orientales con especias, ámbar y resinas. Sensualidad cautivadora.",
    Fresco: "Perfumes frescos con notas cítricas, acuáticas y verdes. Ideal para el día a día.",
    Gourmand: "Dulces fragancias con vainilla, caramelo y notas comestibles.",
    Chipre: "Perfumes Chipre con musgo de roble, patchouli y bergamota.",
    masculino: "Fragancias masculinas de las mejores casas: amaderadas, frescas y orientales con carácter.",
    femenino: "Perfumes femeninos icónicos: florales, gourmand y orientales con identidad propia.",
    unisex: "Fragancias unisex que trascienden categorías. Para todos los estilos y ocasiones.",
  };

  const label = family || (badge === "oferta" ? "Ofertas" : badge === "nuevo" ? "Novedades" : null) || (gender ?? null);
  return {
    title: label && titles[label] ? titles[label] : "Perfumes de Lujo | SILLAGE",
    description: label && descriptions[label] ? descriptions[label] : "Explora nuestra colección de fragancias de lujo de las mejores marcas.",
    alternates: {
      canonical: "/productos",
    },
  };
}

export default function ProductosPage({ searchParams }: ProductosPageProps) {
  let products = getProducts();
  const { family, badge, gender } = searchParams;
  const activeFiltersCount = [family, badge, gender].filter(Boolean).length;

  if (family) {
    products = products.filter((p) =>
      p.family.toLowerCase().includes(family.toLowerCase())
    );
  }

  if (badge) {
    products = products.filter((p) => p.badge === badge);
  }

  if (gender) {
    products = products.filter((p) => p.gender === gender);
  }

  return (
    <div className="pt-32 sm:pt-36 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl">Nuestros perfumes</h1>
          <p className="mt-2 text-gray-mid">
            Explora nuestra colección de fragancias de lujo
          </p>
        </div>

        {/* Barra de Control de Filtros */}
        <ScrollReveal>
          <div className="flex items-center justify-between gap-2 mb-8 pb-4 border-b border-warm-200/30">
            <span className="text-xs font-sans text-gray-mid tracking-wider uppercase whitespace-nowrap">
              {products.length} {products.length === 1 ? "aroma" : "aromas"}
            </span>
            <div className="flex items-center gap-3 sm:gap-6">
              {(gender || family || badge) && (
                <Link
                  href="/productos"
                  className="text-xs text-gray-mid hover:text-black transition-colors flex items-center gap-1 font-sans font-medium uppercase tracking-wider min-h-[32px] whitespace-nowrap"
                >
                  Limpiar filtros ×
                </Link>
              )}
              {/* Client Component for drawer & self-closing interaction */}
              <FilterDrawer
                gender={gender}
                family={family}
                badge={badge}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-mid">
              No encontramos productos en esta familia
            </p>
          </div>
        ) : (
          <>
            <h2 className="sr-only">Catálogo de fragancias</h2>
            <ProductGrid products={products} columns={4} />
          </>
        )}
      </div>
    </div>
  );
}
