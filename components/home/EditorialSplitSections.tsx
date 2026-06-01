"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface EditorialSection {
  id: string;
  label: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  reverse: boolean;
  // Controls which side of the image shows (the bottle is always on the opposite side of text)
  imagePosition: "left" | "right" | "center";
}

const sections: EditorialSection[] = [
  {
    id: "masculine",
    label: "la collection masculine",
    title: "la fuerza de la sutileza",
    description:
      "aromas que redefinen la elegancia contemporánea. un tributo a la frescura magnética y al carácter atemporal del hombre moderno.",
    ctaText: "descubrir fragancias masculinas",
    href: "/productos?gender=masculino",
    imageSrc: "/images/collections/masculine.png",
    imageAlt: "Colección Masculina Premium Sillage",
    // Image: bottle on right half, dark space on left. reverse:false → image is right col → show right side
    reverse: false,
    imagePosition: "right",
  },
  {
    id: "feminine",
    label: "la collection féminine",
    title: "el arte de la seducción silenciosa",
    description:
      "esencias que narran historias de sofisticación y misterio profundo. la máxima expresión de la feminidad refinada en cada gota.",
    ctaText: "descubrir fragancias femeninas",
    href: "/productos?gender=femenino",
    imageSrc: "/images/collections/feminine.png",
    imageAlt: "Colección Femenina de Lujo Sillage",
    // Image: bottle on left half, warm space on right. reverse:true → image is left col → show left side
    reverse: true,
    imagePosition: "left",
  },
  {
    id: "exclusive",
    label: "la collection exclusive",
    title: "la alta perfumería de autor",
    description:
      "creaciones únicas destinadas a quienes buscan una impronta inolvidable. extractos excepcionales elaborados con las materias primas más exclusivas del mundo.",
    ctaText: "descubrir colección exclusiva",
    href: "/productos?collection=exclusive",
    imageSrc: "/images/collections/exclusive.png",
    imageAlt: "Colección Exclusiva de Lujo Sillage",
    // Image: bottle on right half. reverse:false → image is right col
    reverse: false,
    imagePosition: "right",
  },
  {
    id: "new-arrival",
    label: "les nouveautés",
    title: "la vanguardia olfativa",
    description:
      "explora nuestras últimas creaciones. acordes innovadores que desafían las convenciones y trazan el futuro del diseño de fragancias.",
    ctaText: "descubrir nuevos lanzamientos",
    href: "/productos?new=true",
    imageSrc: "/images/collections/new-arrival.png",
    imageAlt: "Nuevos Lanzamientos Premium Sillage",
    // Image: bottle on left half. reverse:true → image is left col
    reverse: true,
    imagePosition: "left",
  },
];

const positionMap: Record<"left" | "right" | "center", string> = {
  left: "object-left",
  right: "object-right",
  center: "object-center",
};

export function EditorialSplitSections() {
  return (
    <section className="bg-[#0B0A08] py-20 lg:py-32 overflow-hidden border-t border-warm-900/50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-32 lg:space-y-48">
        {sections.map((section) => (
          <ScrollReveal key={section.id}>
            <div
              className={`flex flex-col ${
                section.reverse ? "flex-col-reverse lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-12 lg:gap-24 group`}
            >
              {/* ── Image Column ─────────────────────────────────────── */}
              <div className="w-full lg:w-1/2 relative aspect-[4/5] sm:aspect-[3/2] lg:aspect-[4/3] xl:aspect-[1.15] overflow-hidden bg-warm-900/30">
                {/* Subtle inner border for definition */}
                <div className="absolute inset-0 border border-white/5 z-10 pointer-events-none" />

                {/* Gentle bottom vignette — only darkens slightly to blend with bg */}
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0B0A08]/50 to-transparent z-10 pointer-events-none" />

                <Image
                  src={section.imageSrc}
                  alt={section.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover ${positionMap[section.imagePosition]} transition-transform duration-1000 ease-out group-hover:scale-105`}
                  priority={section.id === "masculine"}
                  loading={section.id === "masculine" ? undefined : "lazy"}
                />
              </div>

              {/* ── Text Column ──────────────────────────────────────── */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center text-left lg:px-12 xl:px-20">
                {/* Collection label */}
                <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#C9A96E]/80">
                  {section.label}
                </span>

                {/* Serif title */}
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#FAF7F2] leading-[1.15] mt-4 tracking-wide">
                  {section.title}
                </h3>

                {/* Body */}
                <p className="text-sm font-light text-warm-400 leading-relaxed mt-6 max-w-[45ch]">
                  {section.description}
                </p>

                {/* Chanel-style CTA — text link with sliding underline */}
                <Link
                  href={section.href}
                  className="group/cta relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium text-[#FAF7F2] hover:text-[#C9A96E] transition-colors duration-300 pb-2 mt-8 w-fit
                             after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full
                             after:origin-right after:scale-x-0 after:bg-[#C9A96E]
                             after:transition-transform after:duration-500 after:ease-out
                             hover:after:origin-left hover:after:scale-x-100"
                >
                  {section.ctaText}
                  <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
