"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface EditorialSplitSingleProps {
  label: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  imagePosition?: "left" | "right" | "center";
}

const positionMap: Record<"left" | "right" | "center", string> = {
  left: "object-left",
  right: "object-right",
  center: "object-center",
};

export function EditorialSplitSingle({
  label,
  title,
  description,
  ctaText,
  href,
  imageSrc,
  imageAlt,
  reverse = false,
  imagePosition = "right",
}: EditorialSplitSingleProps) {
  return (
    <section className="bg-black py-20 lg:py-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div
            className={`flex flex-col ${
              reverse ? "flex-col-reverse lg:flex-row-reverse" : "lg:flex-row"
            } items-center gap-12 lg:gap-24 group`}
          >
            {/* Image Column */}
            <div className="w-full lg:w-1/2 relative aspect-[4/5] sm:aspect-[3/2] lg:aspect-[4/3] xl:aspect-[1.15] overflow-hidden bg-warm-900/30">
              {/* Gentle bottom vignette */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />

              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover ${positionMap[imagePosition]} transition-transform duration-1000 ease-out group-hover:scale-105`}
                priority
              />
            </div>

            {/* Text Column */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center text-left lg:px-12 xl:px-20">
              {/* Collection label */}
              <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-gold/80">
                {label}
              </span>

              {/* Serif title */}
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-warm-50 leading-[1.15] mt-4 tracking-wide">
                {title}
              </h2>

              {/* Body */}
              <p className="text-sm font-light text-warm-400 leading-relaxed mt-6 max-w-[45ch]">
                {description}
              </p>

              {/* Chanel-style CTA */}
              <Link
                href={href}
                className="group/cta relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium text-warm-50 hover:text-gold transition-colors duration-300 pb-2 mt-8 w-fit
                           after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full
                           after:origin-right after:scale-x-0 after:bg-gold
                           after:transition-transform after:duration-500 after:ease-out
                           hover:after:origin-left hover:after:scale-x-100"
              >
                {ctaText}
                <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}