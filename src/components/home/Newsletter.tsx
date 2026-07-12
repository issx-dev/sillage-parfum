"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FaInstagram, FaPinterest, FaTiktok, FaFacebook } from "react-icons/fa6";

export function Newsletter() {
  return (
    <section className="bg-warm-50 border-t border-warm-200/60 py-16 lg:py-20">
      <ScrollReveal>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Coming Soon Banner */}
            <span className="text-[11px] uppercase tracking-[0.35em] font-semibold text-gold-dark">
              próximamente · coming soon
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl text-warm-900 font-light leading-snug mt-4 tracking-wide">
              Member&apos;s Club
            </h2>

            <p className="text-sm font-light text-warm-600 mt-3 max-w-[46ch] mx-auto leading-relaxed">
              Acceso anticipado a lanzamientos exclusivos, eventos privados y beneficios reservados para miembros.
            </p>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <a
                href="https://instagram.com/sillage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-500 hover:text-gold transition-colors duration-200"
                aria-label="SILLAGE en Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com/@sillage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-500 hover:text-gold transition-colors duration-200"
                aria-label="SILLAGE en TikTok"
              >
                <FaTiktok className="w-5 h-5" />
              </a>
              <a
                href="https://pinterest.com/sillage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-500 hover:text-gold transition-colors duration-200"
                aria-label="SILLAGE en Pinterest"
              >
                <FaPinterest className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/sillage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-500 hover:text-gold transition-colors duration-200"
                aria-label="SILLAGE en Facebook"
              >
                <FaFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}