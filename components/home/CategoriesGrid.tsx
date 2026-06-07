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
    imageSrc: "/images/products/sauvage-dior-front.jpg",
    imageAlt: "Fragancias Masculinas Sillage",
  },
  {
    name: "Femenino",
    href: "/productos?gender=femenino",
    imageSrc: "/images/products/chanel-5-front.jpg",
    imageAlt: "Fragancias Femeninas Sillage",
  },
  {
    name: "Unisex",
    href: "/productos?gender=unisex",
    imageSrc: "/images/products/baccarat-rouge-front.jpg",
    imageAlt: "Fragancias Unisex Sillage",
  },
  {
    name: "Nicho",
    href: "/productos?collection=exclusive",
    imageSrc: "/images/products/aventus-creed-front.jpg",
    imageAlt: "Alta Perfumería de Nicho Sillage",
  },
  {
    name: "Bestsellers",
    href: "/productos?badge=top_ventas",
    imageSrc: "/images/products/acqua-di-gio-front.jpg",
    imageAlt: "Fragancias Bestsellers Sillage",
  },
  {
    name: "Novedades",
    href: "/productos?badge=nuevo",
    imageSrc: "/images/products/black-orchid-front.jpg",
    imageAlt: "Nuevas Fragancias Sillage",
  },
];

export function CategoriesGrid() {
  return (
    <section className="py-20 lg:py-28 bg-[#FAF7F2]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#C9A96E]">
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
                <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-warm-200/40 shadow-sm transition-[box-shadow,border-color] duration-500 hover:shadow-md hover:border-[#C9A96E]/40 p-4">
                  <div className="relative w-full h-full">
                    <Image
                      src={category.imageSrc}
                      alt={category.imageAlt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-contain p-2"
                      loading="lazy"
                    />
                  </div>
                  {/* Gradient overlay — strengthened for light-colored bottles */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0B0A08]/60 to-transparent" />
                  
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center z-10">
                    <span className="font-serif text-sm sm:text-base text-white font-medium tracking-wide block">
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