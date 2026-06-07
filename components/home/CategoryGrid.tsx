"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const categoryColors: Record<string, string> = {
  "Florales": "#F5E6E8",
  "Amaderados": "#E8DFD5",
  "Orientales": "#F0E6D8",
  "Frescos": "#E6F0F0",
  "Gourmands": "#F5EDE6",
};

const categories = [
  {
    name: "Florales",
    href: "/productos?family=Floral",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3c.75 0 1.5.75 1.5 1.5 0 .3-.1.6-.3.9-.4.5-.6 1-.6 1.6 0 .75.3 1.5.75 2.1.5.6.75 1.35.75 2.1 0 .3-.1.6-.3 1.05-.4.9-.6 1.8-.6 2.85 0 .3.15.45.45.45h.3c.75 0 1.35.3 1.35.75 0 .15-.15.3-.3.3-.45 0-.9-.15-1.35-.45-.75-.45-1.5-.75-2.1-.75-.75 0-1.35.3-1.8.75-.45.3-.9.45-1.35.45-.15 0-.3-.15-.3-.3 0-.45.6-.75 1.35-.75h.3c.3 0 .45-.15.45-.45 0-1.05-.2-1.95-.6-2.85-.2-.45-.3-.75-.3-1.05 0-.75.25-1.5.75-2.25.45-.6.75-1.35.75-2.25 0-.6-.2-1.1-.6-1.65-.2-.3-.3-.6-.3-.9 0-.75.75-1.5 1.5-1.5Z" />
        <path d="M12 9c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3Z" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    name: "Amaderados",
    href: "/productos?family=Amaderado",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22V12" />
        <path d="M9 22h6" />
        <path d="M12 12c-2-2-4-3-6-3 3 0 5 1 6 3" />
        <path d="M12 12c2-2 4-3 6-3-3 0-5 1-6 3" />
        <path d="M12 8c-1-2-2-4-4-5 2 0 3 1 4 5" />
        <path d="M12 8c1-2 2-4 4-5-2 0-3 1-4 5" />
      </svg>
    ),
  },
  {
    name: "Orientales",
    href: "/productos?family=Oriental",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2c-4 4-6 8-6 12 0 4 2 8 6 8s6-4 6-8c0-4-2-8-6-12Z" />
        <path d="M12 22v-10" strokeDasharray="1 2" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    ),
  },
  {
    name: "Frescos",
    href: "/productos?family=Fresco",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v6" />
        <path d="M6 6l4 4" />
        <path d="M18 6l-4 4" />
        <path d="M6 18c0-3.5 3-6 6-6s6 2.5 6 6" />
        <path d="M12 12v6" />
        <path d="M9 18h6" />
      </svg>
    ),
  },
  {
    name: "Gourmands",
    href: "/productos?family=Gourmand",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2c-5 0-8 4-8 8 0 3 2 5 4 6v6c0 1 1 2 2 2h4c1 0 2-1 2-2v-6c2-1 4-3 4-6 0-4-3-8-8-8Z" />
        <path d="M10 22h4" />
        <path d="M12 2v4" />
        <path d="M8 6c2 1 6 1 8 0" />
      </svg>
    ),
  },
];

export function CategoryGrid() {
  return (
    <section className="py-12 lg:py-16 bg-cream">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-8 lg:mb-12">
            Explora por familia olfativa
          </h2>
        </ScrollReveal>

        <ScrollReveal stagger={100}>
          <div className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-5 lg:grid-cols-5 lg:overflow-visible snap-x snap-mandatory sm:snap-none">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="flex-shrink-0 snap-center sm:flex-shrink-none group"
              >
                <div
                  className="rounded-card p-6 sm:p-8 flex flex-col items-center text-center transition-[transform,box-shadow,opacity] duration-300 group-hover:scale-[1.03] group-hover:shadow-gold active:scale-95 transition-transform duration-150 min-w-[160px] sm:min-w-0"
                  style={{ backgroundColor: categoryColors[cat.name] }}
                >
                  <div className="text-gray-mid group-hover:text-gold transition-colors mb-4">
                    {cat.icon}
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}