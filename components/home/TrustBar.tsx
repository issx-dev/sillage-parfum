"use client";

import { Truck, RotateCcw, ShieldCheck, Lock } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const trustItems = [
  { icon: Truck, text: "Envío gratis +50€" },
  { icon: RotateCcw, text: "Devolución 30 días" },
  { icon: ShieldCheck, text: "100% productos originales" },
  { icon: Lock, text: "Pago seguro SSL" },
];

export function TrustBar() {
  return (
    <section className="bg-black text-cream py-6">
      <ScrollReveal>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 sm:gap-8 lg:gap-12 justify-start sm:justify-center">
            {trustItems.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 flex-shrink-0 snap-center"
              >
                <item.icon className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
