"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";

const testimonials = [
  {
    name: "Inés Villanueva",
    city: "Madrid",
    rating: 5,
    text: "Estoy encantada con mi compra. El envase llegó impecable y el perfume huele exactamente como recordaba de cuando lo probé en la tienda. Un servicio que supera todas las expectativas.",
    product: "Chanel No5 EDP",
    featured: true,
  },
  {
    name: "Mateo Soler",
    city: "Barcelona",
    rating: 5,
    text: "Me ayudaron a elegir una fragancia para mi esposa y fue todo un acierto. Atención impecable.",
    product: "La Vie Est Belle",
    featured: false,
  },
  {
    name: "Valeria Paredes",
    city: "Valencia",
    rating: 5,
    text: "Envío rapidísimo y packaging de verdadera calidad. Tercera vez que compro aquí.",
    product: "Sauvage Dior EDT",
    featured: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-[#C9A96E]" : "text-zinc-700"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/20 flex items-center justify-center shadow-inner">
      <span className="font-serif text-sm text-gold tracking-wider">{initials}</span>
    </div>
  );
}

export function Testimonials() {
  const featured = testimonials.find((t) => t.featured)!;
  const secondary = testimonials.filter((t) => !t.featured);

  return (
    <section className="py-16 lg:py-24 bg-[#FAF7F2] border-t border-[#E8E4DE]/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-12 lg:mb-16">
            <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[#C9A96E]/80">
              opiniones verificadas
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#1A1A1A] tracking-wide mt-3">
              lo que dicen nuestros clientes
            </h2>
          </div>
        </ScrollReveal>

        {/* Asymmetric grid: featured (wider) + two stacked */}
        <ScrollReveal stagger={100}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            {/* Featured testimonial */}
            <div className="bg-[#1A1A1A] p-8 lg:p-10 flex flex-col justify-between min-h-[280px]">
              <div>
                <StarRating rating={featured.rating} />
                <p className="font-serif text-xl text-[#FAF7F2] font-light leading-relaxed mt-6 max-w-[40ch]">
                  &ldquo;{featured.text}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
                <Monogram name={featured.name} />
                <div>
                  <p className="text-sm font-medium text-[#FAF7F2]">{featured.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{featured.city} · {featured.product}</p>
                </div>
              </div>
            </div>

            {/* Two secondary testimonials stacked */}
            <div className="flex flex-col gap-6">
              {secondary.map((t) => (
                <div
                  key={t.name}
                  className="bg-white border border-[#E8E4DE]/60 p-6 flex flex-col justify-between flex-1"
                >
                  <div>
                    <StarRating rating={t.rating} />
                    <p className="text-sm text-[#5A5A5A] leading-relaxed mt-4 italic">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#E8E4DE]/60">
                    <Monogram name={t.name} />
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{t.name}</p>
                      <p className="text-xs text-[#5A5A5A]/70 mt-0.5">{t.city} · {t.product}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
