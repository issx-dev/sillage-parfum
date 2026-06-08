import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getProducts } from "@/lib/data";
import type { Metadata } from "next";
import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";

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

const badgeFilters = [
  { label: "Todos", value: undefined },
  { label: "Novedades", value: "nuevo" },
  { label: "Ofertas", value: "oferta" },
  { label: "Top Ventas", value: "top_ventas" },
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

  // Composes a /productos href that overrides one dimension while preserving the others.
  const buildHref = (overrides: { family?: string; gender?: string; badge?: string }) => {
    const params = new URLSearchParams();
    
    const familyVal = "family" in overrides ? overrides.family : family;
    const genderVal = "gender" in overrides ? overrides.gender : gender;
    const badgeVal = "badge" in overrides ? overrides.badge : badge;

    if (familyVal) params.set("family", familyVal);
    if (badgeVal) params.set("badge", badgeVal);
    if (genderVal) params.set("gender", genderVal);
    const qs = params.toString();
    return qs ? `/productos?${qs}` : "/productos";
  };

  return (
    <div className="pt-32 sm:pt-36 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl">Nuestros perfumes</h1>
          <p className="mt-2 text-gray-mid">
            Explora nuestra colección de fragancias de lujo
          </p>
        </div>

        {/* Barra de Control de Filtros */}
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-warm-200/30">
            <span className="text-xs font-sans text-gray-mid tracking-wider uppercase">
              {products.length} {products.length === 1 ? "aroma" : "aromas"}
            </span>

            <div className="flex items-center gap-6">
              {(gender || family || badge) && (
                <Link
                  href="/productos"
                  className="text-xs text-gray-mid hover:text-black transition-colors flex items-center gap-1 font-sans font-medium uppercase tracking-wider min-h-[32px]"
                >
                  Limpiar filtros ×
                </Link>
              )}

              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="flex items-center gap-2 border border-warm-200 bg-white hover:bg-warm-50 text-charcoal px-5 py-2.5 rounded-full hover:border-gold transition-colors duration-300 text-[11px] uppercase tracking-[0.15em] font-sans font-medium shadow-sm cursor-pointer">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gold-dark" />
                    Filtrar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </button>
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-overlay-fade" />
                  <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[400px] bg-cream border-l border-warm-200/50 p-6 shadow-2xl flex flex-col justify-between animate-drawer-slide">
                    <div className="flex flex-col h-full overflow-hidden">
                      <div className="flex items-center justify-between border-b border-warm-200/30 pb-4 mb-6 shrink-0">
                        <Dialog.Title className="font-serif text-xl tracking-wide">Filtros</Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="p-2 -mr-2 text-gray-mid hover:text-black transition-colors cursor-pointer" aria-label="Cerrar filtros">
                            <X className="w-5 h-5" />
                          </button>
                        </Dialog.Close>
                      </div>

                      <div className="space-y-6 overflow-y-auto flex-1 pr-1 pb-6 scrollbar-dark">
                        {/* Género */}
                        <div>
                          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                            Género
                          </span>
                          <div className="flex flex-wrap gap-2 pb-2">
                            {genderFilters.map((filter) => {
                              const isActive =
                                filter.value === gender || (filter.value === undefined && !gender);
                              return (
                                <Link
                                  key={filter.label}
                                  href={buildHref({ gender: filter.value })}
                                  className={`px-4 py-1.5 rounded-full text-xs font-sans transition-[background-color,color,border-color] duration-200 min-h-[36px] flex items-center border ${
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

                        {/* Colección */}
                        <div className="pt-5 border-t border-warm-200/30">
                          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                            Colección
                          </span>
                          <div className="flex flex-wrap gap-2 pb-2">
                            {badgeFilters.map((filter) => {
                              const isActive =
                                filter.value === badge || (filter.value === undefined && !badge);
                              return (
                                <Link
                                  key={filter.label}
                                  href={buildHref({ badge: filter.value })}
                                  className={`px-4 py-1.5 rounded-full text-xs font-sans transition-[background-color,color,border-color] duration-200 min-h-[36px] flex items-center border ${
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

                        {/* Familia Olfativa */}
                        <div className="pt-5 border-t border-warm-200/30">
                          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-dark block mb-3">
                            Familia Olfativa
                          </span>
                          <div className="flex flex-wrap gap-2 pb-2">
                            {familyFilters.map((filter) => {
                              const isActive =
                                filter.value === family || (filter.value === undefined && !family);
                              return (
                                <Link
                                  key={filter.label}
                                  href={buildHref({ family: filter.value })}
                                  className={`px-4 py-1.5 rounded-full text-xs font-sans transition-[background-color,color,border-color] duration-200 min-h-[36px] flex items-center border ${
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
                      </div>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
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
