import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getProducts } from "@/lib/data";
import type { Metadata } from "next";

export function generateMetadata({ searchParams }: ProductosPageProps): Metadata {
  const { family, badge } = searchParams;
  const titles: Record<string, string> = {
    Floral: "Perfumes Florales de Lujo | SILLAGE",
    Amaderado: "Perfumes Amaderados de Lujo | SILLAGE",
    Oriental: "Perfumes Orientales de Lujo | SILLAGE",
    Fresco: "Perfumes Frescos de Lujo | SILLAGE",
    Gourmand: "Perfumes Gourmand de Lujo | SILLAGE",
    Chipre: "Perfumes Chipre de Lujo | SILLAGE",
  };
  const descriptions: Record<string, string> = {
    Floral: "Descubre nuestra colección de perfumes florales de lujo. Notas de rosa, jazmín y flores blancas.",
    Amaderado: "Explora perfumes amaderados con notas de sándalo, cedro y vetiver. Elegancia masculina.",
    Oriental: "Fragancias orientales con especias, ámbar y resinas. Sensualidad cautivadora.",
    Fresco: "Perfumes frescos con notas cítricas, acuáticas y verdes. Ideal para el día a día.",
    Gourmand: "Dulces fragancias con vainilla, caramelo y notas comestibles.",
    Chipre: "Perfumes Chipre con musgo de roble, patchouli y bergamota.",
  };

  const label = family || (badge === "oferta" ? "Ofertas" : badge === "nuevo" ? "Novedades" : null);
  return {
    title: label && titles[label] ? titles[label] : "Perfumes de Lujo | SILLAGE",
    description: label && descriptions[label] ? descriptions[label] : "Explora nuestra colección de fragancias de lujo de las mejores marcas.",
  };
}

const familyFilters = [
  { label: "Todos", value: undefined },
  { label: "Floral", value: "Floral" },
  { label: "Amaderado", value: "Amaderado" },
  { label: "Oriental", value: "Oriental" },
  { label: "Fresco", value: "Fresco" },
  { label: "Gourmand", value: "Gourmand" },
  { label: "Chipre", value: "Chipre" },
];

interface ProductosPageProps {
  searchParams: { family?: string; badge?: string };
}

export default function ProductosPage({ searchParams }: ProductosPageProps) {
  let products = getProducts();
  const { family, badge } = searchParams;

  if (family) {
    products = products.filter((p) =>
      p.family.toLowerCase().includes(family.toLowerCase())
    );
  }

  if (badge) {
    products = products.filter((p) => p.badge === badge);
  }

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl">Nuestros perfumes</h1>
          <p className="mt-2 text-gray-mid">
            Explora nuestra colección de fragancias de lujo
          </p>
        </div>

        {/* Filter pills */}
        <ScrollReveal>
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scroll-snap-x scroll-snap-mandatory">
            {familyFilters.map((filter) => {
              const isActive = filter.value === family || (filter.value === undefined && !family && !badge);
              return (
                <Link
                  key={filter.label}
                  href={
                    filter.value
                      ? `/productos?family=${filter.value}`
                      : "/productos"
                  }
                  className={`flex-shrink-0 scroll-snap-center px-4 py-2 rounded-full text-sm transition-[background-color,color,border-color] duration-200 min-h-[40px] flex items-center border ${
                    isActive
                      ? "bg-black text-cream border-black"
                      : "border-gray-light hover:border-gold hover:bg-black hover:text-cream"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
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
          <ProductGrid products={products} columns={4} />
        )}
      </div>
    </div>
  );
}
