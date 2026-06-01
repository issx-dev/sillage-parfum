"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowUpRight } from "lucide-react";

const PILLARS = [
  {
    number: "01",
    title: "Encuentra tu firma olfativa",
    description:
      "Respondé 3 preguntas sobre tu personalidad y los aromas que te atraen.",
  },
  {
    number: "02",
    title: "Recibí tu selección curada",
    description:
      "Nuestro algoritmo editorial filtra el catálogo y elige las fragancias que resuenan con vos.",
  },
  {
    number: "03",
    title: "Explorá con confianza",
    description:
      "Cada recomendación incluye notas olfativas, intensidad y las ocasiones ideales de uso.",
  },
];

export function EditorialBanner() {
  return (
    <section className="bg-[#0B0A08] border-t border-warm-900/60 py-20 lg:py-28">
      <ScrollReveal>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row — label + heading + CTA */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 lg:mb-20">
            <div className="max-w-xl">
              <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#C9A96E]/80">
                guía de fragancias
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-light text-[#FAF7F2] leading-[1.15] mt-4 tracking-wide">
                encuentra tu fragancia perfecta
              </h2>
            </div>

            {/* Chanel-style CTA — text link, no button */}
            <Link
              href="/productos"
              className="group relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium text-[#FAF7F2] hover:text-[#C9A96E] transition-colors duration-300 pb-2 w-fit
                         after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full
                         after:origin-right after:scale-x-0 after:bg-[#C9A96E]
                         after:transition-transform after:duration-500 after:ease-out
                         hover:after:origin-left hover:after:scale-x-100"
            >
              comenzar el test
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </Link>
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full bg-warm-800/60 mb-16 lg:mb-20" />

          {/* Asymmetric pillars: first wide, second+third stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-16">
            {/* Featured pillar — spans full left column */}
            <div className="flex flex-col gap-4 border-l border-[#C9A96E]/20 pl-6">
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#C9A96E]/50">
                {PILLARS[0].number}
              </span>
              <div className="h-[1px] w-8 bg-[#C9A96E]/30" />
              <h3 className="font-serif text-2xl text-[#FAF7F2] font-light leading-snug">
                {PILLARS[0].title}
              </h3>
              <p className="text-sm font-light text-warm-400 leading-relaxed max-w-[38ch]">
                {PILLARS[0].description}
              </p>
            </div>

            {/* Right column — two pillars stacked */}
            <div className="flex flex-col gap-8">
              {PILLARS.slice(1).map((pillar) => (
                <div key={pillar.number} className="flex flex-col gap-3">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-[#C9A96E]/50">
                    {pillar.number}
                  </span>
                  <div className="h-[1px] w-6 bg-[#C9A96E]/30" />
                  <h3 className="font-serif text-base text-[#FAF7F2] font-light leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-[13px] font-light text-warm-400 leading-relaxed max-w-[30ch]">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
