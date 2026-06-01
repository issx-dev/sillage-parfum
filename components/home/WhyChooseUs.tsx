import { Shield, Globe, Heart, Gift } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const features = [
  {
    icon: Shield,
    title: "Autenticidad garantizada",
    description:
      "Todos nuestros productos son 100% originales y proceden directamente de distribuidores oficiales.",
  },
  {
    icon: Globe,
    title: "214 marcas",
    description:
      "Desde las grandes casas de lujo hasta nichos exclusivos y perfumería artesanal.",
  },
  {
    icon: Heart,
    title: "Atención personalizada",
    description:
      "Nuestros expertos te ayudan a encontrar la fragancia que mejor expresa tu personalidad.",
  },
  {
    icon: Gift,
    title: "Packaging premium",
    description:
      "Cada pedido llega en caja de regalo con papel de seda y tarjeta personalizada.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 lg:py-16 bg-black text-cream">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="font-serif text-2xl sm:text-3xl text-center mb-8 lg:mb-12">
            ¿Por qué elegirnos?
          </h2>
        </ScrollReveal>

        <ScrollReveal stagger={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold mb-4">
                  <feature.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="font-serif text-xl mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-mid max-w-sm mx-auto">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
