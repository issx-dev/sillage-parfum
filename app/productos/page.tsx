import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getProducts } from "@/lib/data";

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
            {familyFilters.map((filter) => (
              <Link
                key={filter.label}
                href={
                  filter.value
                    ? `/productos?family=${filter.value}`
                    : "/productos"
                }
                className="flex-shrink-0 scroll-snap-center px-4 py-2 rounded-full text-sm transition-[background-color,color,border-color] duration-200 min-h-[40px] flex items-center border border-gray-light hover:border-gold hover:bg-black hover:text-cream"
              >
                {filter.label}
              </Link>
            ))}
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
