"use client";

import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface Category {
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}

const categories: Category[] = [
  {
    name: "Masculino",
    href: "/productos?gender=masculino",
    imageSrc: "/images/collections/masculine.png",
    imageAlt: "Colección Masculina Premium Sillage",
  },
  {
    name: "Femenino",
    href: "/productos?gender=femenino",
    imageSrc: "/images/collections/feminine.png",
    imageAlt: "Colección Femenina de Lujo Sillage",
  },
  {
    name: "Unisex",
    href: "/productos?gender=unisex",
    imageSrc: "/images/collections/unisex.png",
    imageAlt: "Colección Unisex Sillage",
  },
  {
    name: "Niche",
    href: "/productos?collection=exclusive",
    imageSrc: "/images/collections/exclusive.png",
    imageAlt: "Colección Niche de Lujo Sillage",
  },
  {
    name: "Bestsellers",
    href: "/productos?badge=top_ventas",
    imageSrc: "/images/collections/bestsellers.png",
    imageAlt: "Bestsellers Sillage",
  },
  {
    name: "Nuevos",
    href: "/productos?badge=nuevo",
    imageSrc: "/images/collections/new-arrival.png",
    imageAlt: "Nuevos Lanzamientos Sillage",
  },
];

export function CategoriesGrid() {
  return (
    <section className="py-20 lg:py-28 bg-warm-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-gold">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group block"
              >
                <div className="relative aspect-square rounded-card overflow-hidden bg-warm-200">
                  <Image
                    src={category.imageSrc}
                    alt={category.imageAlt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="font-serif text-lg sm:text-xl text-warm-50 group-hover:text-gold transition-colors duration-300">
                      {category.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}