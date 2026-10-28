import React from "react";
import { Sparkles, Droplet, Award, ShieldCheck } from "lucide-react";

export function ChoganInfoBanner() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 my-8 border-y border-warm-200/60 bg-warm-50/40">
      <div className="max-w-5xl mx-auto text-center">
        {/* Eyebrow */}
        <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-gold-dark font-bold inline-flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> La Excelencia del Perfume Italiano
        </span>
        
        {/* Main Clean Title */}
        <h2 className="font-serif text-2xl sm:text-4xl text-charcoal font-normal mb-3 tracking-tight">
          ¿Por qué elegir nuestras fragancias?
        </h2>
        
        {/* Short & Punchy Subtitle */}
        <p className="text-gray-mid text-xs sm:text-sm max-w-xl mx-auto mb-10 leading-relaxed font-light">
          Sin costes de marketing ni intermediarios. El 100% de la inversión se destina a la pureza y máxima fijación de la esencia.
        </p>

        {/* 3 Visual Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
          {/* Pillar 1 */}
          <div className="p-6 rounded-card bg-white border border-warm-200/60 shadow-xs hover:border-gold/40 transition-all duration-300 flex flex-col items-center sm:items-start">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-4 text-gold-dark shrink-0">
              <Droplet className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-medium text-charcoal mb-1">
              30% Extrait de Parfum
            </h3>
            <p className="text-xs text-gray-mid leading-relaxed font-light">
              Máxima fijación del mercado (+8 horas en piel) con un 30% de esencia pura.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-card bg-white border border-warm-200/60 shadow-xs hover:border-gold/40 transition-all duration-300 flex flex-col items-center sm:items-start">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-4 text-gold-dark shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-medium text-charcoal mb-1">
              Esencias 100% Italianas
            </h3>
            <p className="text-xs text-gray-mid leading-relaxed font-light">
              Formulación orgánica con alcohol desnaturalizado y 0% agua añadida.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-card bg-white border border-warm-200/60 shadow-xs hover:border-gold/40 transition-all duration-300 flex flex-col items-center sm:items-start">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-4 text-gold-dark shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-medium text-charcoal mb-1">
              Compra 100% Segura
            </h3>
            <p className="text-xs text-gray-mid leading-relaxed font-light">
              Opción de Pago Contra Reembolso al recibir en casa o pago online seguro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
