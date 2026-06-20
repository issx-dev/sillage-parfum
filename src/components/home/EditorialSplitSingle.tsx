"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export type EditorialSplitVariant = "light" | "dark";

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
  /**
   * Background and text-color theme.
   * - "dark" (default): black background, light text — for editorial stories.
   * - "light": cream background, dark text — for category highlights.
   */
  variant?: EditorialSplitVariant;
}

const positionMap: Record<"left" | "right" | "center", string> = {
  left: "object-left",
  right: "object-right",
  center: "object-center",
};

const VARIANT_STYLES: Record<EditorialSplitVariant, {
  sectionBg: string;
  imageBg: string;
  eyebrowText: string;
  titleText: string;
  bodyText: string;
  ctaText: string;
  vignette: string;
}> = {
  dark: {
    sectionBg: "bg-black",
    imageBg: "bg-warm-900/30",
    eyebrowText: "text-gold/80",
    titleText: "text-warm-50",
    bodyText: "text-warm-400",
    ctaText: "text-warm-50",
    vignette: "from-black/50",
  },
  light: {
    sectionBg: "bg-warm-50",
    imageBg: "bg-warm-100",
    eyebrowText: "text-gold-dark",
    titleText: "text-warm-900",
    bodyText: "text-warm-600",
    ctaText: "text-warm-900",
    vignette: "from-warm-50/50",
  },
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
  variant = "dark",
}: EditorialSplitSingleProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <section className={cn("py-20 lg:py-32 overflow-hidden", styles.sectionBg)}>
      <Container>
        <ScrollReveal>
          <div
            className={`flex flex-col ${
              reverse ? "flex-col-reverse lg:flex-row-reverse" : "lg:flex-row"
            } items-center gap-12 lg:gap-24 group`}
          >
            {/* Image Column */}
            <div className={cn("w-full lg:w-1/2 relative aspect-[4/5] sm:aspect-[3/2] lg:aspect-[4/3] xl:aspect-[1.15] overflow-hidden", styles.imageBg)}>
              {/* Gentle bottom vignette */}
              <div className={cn("absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t to-transparent z-10 pointer-events-none", styles.vignette)} />

              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover ${positionMap[imagePosition]} transition-transform duration-300 ease-out group-hover:scale-105`}
                priority
              />
            </div>

            {/* Text Column */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center text-left lg:px-12 xl:px-20">
              {/* Collection label */}
              <span className={cn("text-[11px] uppercase tracking-[0.3em] font-semibold", styles.eyebrowText)}>
                {label}
              </span>

              {/* Serif title */}
              <h2 className={cn("font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] mt-4 tracking-wide", styles.titleText)}>
                {title}
              </h2>

              {/* Body */}
              <p className={cn("text-sm font-light leading-relaxed mt-6 max-w-[45ch]", styles.bodyText)}>
                {description}
              </p>

              {/* Editorial CTA */}
              <Link
                href={href}
                className={cn(
                  "group/cta relative inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] font-medium hover:text-gold transition-colors duration-300 pb-2 mt-8 w-fit",
                  styles.ctaText,
                  "after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full",
                  "after:origin-right after:scale-x-0 after:bg-gold",
                  "after:transition-transform after:duration-500 after:ease-out",
                  "hover:after:origin-left hover:after:scale-x-100"
                )}
              >
                {ctaText}
                <ArrowUpRight className="w-3 h-3 opacity-50 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
