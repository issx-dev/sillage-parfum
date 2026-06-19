"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  sizes: string;
}

const categories: Category[] = [
  {
    name: "Masculino",
    href: "/productos?gender=masculino",
    imageSrc: "/images/collections/masculine.jpg",
    imageAlt: "Fragancias Masculinas Sillage",
    sizes: "(max-width: 768px) 50vw, (max-width: 1200px) 38vw, 30vw",
  },
  {
    name: "Femenino",
    href: "/productos?gender=femenino",
    imageSrc: "/images/collections/feminine.jpg",
    imageAlt: "Fragancias Femeninas Sillage",
    sizes: "(max-width: 768px) 50vw, (max-width: 1200px) 38vw, 30vw",
  },
  {
    name: "Unisex",
    href: "/productos?gender=unisex",
    imageSrc: "/images/collections/unisex.jpg",
    imageAlt: "Fragancias Unisex Sillage",
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw",
  },
  {
    name: "Nicho",
    href: "/productos?collection=exclusive",
    imageSrc: "/images/collections/exclusive.jpg",
    imageAlt: "Alta Perfumería de Nicho Sillage",
    sizes: "(max-width: 768px) 33vw, 25vw",
  },
  {
    name: "Bestsellers",
    href: "/productos?badge=top_ventas",
    imageSrc: "/images/collections/bestsellers.jpg",
    imageAlt: "Fragancias Bestsellers Sillage",
    sizes: "(max-width: 768px) 33vw, 25vw",
  },
  {
    name: "Novedades",
    href: "/productos?badge=nuevo",
    imageSrc: "/images/collections/new-arrival.jpg",
    imageAlt: "Nuevas Fragancias Sillage",
    sizes: "(max-width: 768px) 33vw, 25vw",
  },
];

function CategoryCard({ category, priority = false }: { category: Category; priority?: boolean }) {
  return (
    <div className="relative h-full rounded-card overflow-hidden hover-safe:scale-[1.02] hover-safe:shadow-lg transition-transform duration-500">
      <div className="relative w-full h-full">
        <Image
          src={category.imageSrc}
          alt={category.imageAlt}
          fill
          priority={priority}
          sizes={category.sizes}
          className="object-cover p-0 transform-gpu group-hover:scale-105 transition-transform duration-300 ease-out"
          loading={priority ? undefined : "lazy"}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 text-center z-10">
        <span className="font-serif text-xs sm:text-base md:text-xl lg:text-2xl font-light tracking-wide text-white block">
          {category.name}
        </span>
      </div>
    </div>
  );
}

export function CategoriesGrid() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12 lg:mb-16">
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-gold-dark">
              explora
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-warm-900 tracking-wide mt-2">
              Encuentra tu familia
            </h2>
            <p className="text-sm font-light text-warm-600 mt-4 max-w-[50ch] mx-auto">
              Descubre fragancias organizadas por carácter y personalidad.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger={75}>
          {/* Large gender cards — editorial bento row */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-3 md:gap-4 md:h-[300px] lg:h-[380px]">
            {categories.slice(0, 3).map((category, i) => (
<Link
                 key={category.name}
                 href={category.href}
                 className={cn(
                   "group block h-48 md:h-full",
                   i === 0 && "col-span-1 md:col-span-3",
                   i === 1 && "col-span-1 md:col-span-3",
                   i === 2 && "col-span-2 md:col-span-2",
                 )}
               >
                <CategoryCard category={category} />
              </Link>
            ))}
          </div>
          {/* Smaller inline row — Nicho, Bestsellers, Novedades */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4 md:h-[220px] lg:h-[280px]">
            {categories.slice(3).map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group block h-36 md:h-full"
              >
                <CategoryCard category={category} />
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}