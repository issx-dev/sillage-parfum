import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getProducts } from "@/lib/data";
import type { Metadata } from "next";

const familyFilters = [
  { label: "Todos", value: undefined },
  { label: "Floral", value: "Floral" },
  { label: "Amaderado", value: "Amaderado" },
  { label: "Oriental", value: "Oriental" },
  { label: "Fresco", value: "Fresco" },
  { label: "Gourmand", value: "Gourmand" },
  { label: "Chipre", value: "Chipre" },
];

const genderFilters = [
  { label: "Todos", value: undefined },
  { label: "Masculino", value: "masculino" },
  { label: "Femenino", value: "femenino" },
  { label: "Unisex", value: "unisex" },
];

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
  };
}

export default function ProductosPage({ searchParams }: ProductosPageProps) {
  let products = getProducts();
  const { family, badge, gender } = searchParams;

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

  // Composes a /productos href that overrides one dimension while preserving the others.
  // Passing `undefined` for a key clears that dimension; omitting it preserves the current value.
  const buildHref = (overrides: { family?: string; gender?: string }) => {
    const params = new URLSearchParams();
    
    // Clear family filter if gender filter is cleared (Todos) to avoid orphan filters.
    const isClearingGender = "gender" in overrides && overrides.gender === undefined;
    const familyVal = isClearingGender ? undefined : ("family" in overrides ? overrides.family : family);
    const genderVal = "gender" in overrides ? overrides.gender : gender;

    if (familyVal) params.set("family", familyVal);
    if (badge) params.set("badge", badge);
    if (genderVal) params.set("gender", genderVal);
    const qs = params.toString();
    return qs ? `/productos?${qs}` : "/productos";
  };

  return (
    <div className="pt-28 sm:pt-32 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl">Nuestros perfumes</h1>
          <p className="mt-2 text-gray-mid">
            Explora nuestra colección de fragancias de lujo
          </p>
        </div>

        {/* Panel de Filtros */}
        <ScrollReveal>
          <div className="bg-cream/40 backdrop-blur-sm border border-warm-200/60 rounded-xl p-4 sm:p-6 mb-10 shadow-sm space-y-5">
            {/* Género */}
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                Género
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                {genderFilters.map((filter) => {
                  const isActive =
                    filter.value === gender || (filter.value === undefined && !gender);
                  return (
                    <Link
                      key={filter.label}
                      href={buildHref({ gender: filter.value })}
                      className={`flex-shrink-0 snap-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-sans transition-[background-color,color,border-color] duration-200 min-h-[36px] flex items-center border ${
                        isActive
                          ? "bg-black text-cream border-black font-medium"
                          : "border-gray-light bg-white/50 text-charcoal/80 hover:border-gold hover:bg-black hover:text-cream"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Familia Olfativa — Solo visible cuando se ha seleccionado un género */}
            {gender && (
              <div className="pt-5 border-t border-warm-200/30 animate-fade-in-slide">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                  Familia Olfativa
                </span>
                <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                  {familyFilters.map((filter) => {
                    const isActive =
                      filter.value === family ||
                      (filter.value === undefined && !family && !badge);
                    return (
                      <Link
                        key={filter.label}
                        href={buildHref({ family: filter.value })}
                        className={`flex-shrink-0 snap-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-sans transition-[background-color,color,border-color] duration-200 min-h-[36px] flex items-center border ${
                          isActive
                            ? "bg-black text-cream border-black font-medium"
                            : "border-gray-light bg-white/50 text-charcoal/80 hover:border-gold hover:bg-black hover:text-cream"
                        }`}
                      >
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
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
