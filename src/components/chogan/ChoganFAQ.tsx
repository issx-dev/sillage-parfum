"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "¿Por qué nuestros perfumes son tan asequibles?",
    answer: "Trabajamos directamente con las instalaciones y sedes oficiales de Chogan en Italia. Al eliminar el gasto en publicidad con celebridades, licencias de grandes firmas y envases ostentosos, todo el presupuesto se invierte exclusivamente en la pureza del extracto, ofreciendo perfumería italiana de alta gama a precio directo de producción.",
  },
  {
    question: "¿En qué envase recibiré mi pedido?",
    answer: "Recibirás tu fragancia en el frasco oficial de cristal estandarizado procedente de la sede de Chogan en Italia (30ml o 70ml), sellado y diseñado específicamente para preservar la fijación y calidad de las esencias originales sin degradación.",
  },
  {
    question: "¿Qué significa 30% Extrait de Parfum?",
    answer: "Es la concentración máxima de fragancia existente. Mientras que las colonias habituales (EDT) contienen solo un 8-12% y los Eau de Parfum un 15%, nuestras esencias italianas de Chogan utilizan un 30% de esencia pura con alcohol orgánico, garantizando una estela y duración superiores a 8 horas en piel.",
  },
  {
    question: "¿Puedo pagar mi pedido al recibirlo en casa (Contra Reembolso)?",
    answer: "¡Sí! Disponemos de la opción de Pago Contra Reembolso para tu máxima tranquilidad. Podrás pagar en efectivo directamente al repartidor al recibir tu pedido en la puerta de tu hogar.",
  },
  {
    question: "¿Tienen política de devolución?",
    answer: "Por supuesto. Si tu pedido sufre cualquier incidencia o no quedas satisfecho, dispones de 14 días para gestionar la devolución o cambio de forma rápida y transparente.",
  },
];

export function ChoganFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 max-w-4xl mx-auto px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-gold-dark font-semibold text-xs uppercase tracking-widest mb-2">
          <HelpCircle className="w-4 h-4 text-gold" /> Resolvemos tus dudas
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal">Preguntas Frecuentes</h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-warm-200/60 rounded-card overflow-hidden transition-all bg-white shadow-xs"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left font-serif font-medium text-base text-charcoal flex justify-between items-center hover:text-gold-dark transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isOpen ? "transform rotate-180 text-gold-dark" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm text-gray-mid leading-relaxed border-t border-warm-100 pt-3 font-light">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
