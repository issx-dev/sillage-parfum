"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Instagram } from "lucide-react";

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 12a4 4 0 1 0 8 0c0-3.2-2.2-5.5-4-8-1.8 2.5-4 4.8-4 8z" />
      <path d="M9 17c0 2-1 4-3 6" />
      <path d="M12 17c0 2 0 4 2 6" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

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
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://pinterest.com/sillage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-500 hover:text-gold transition-colors duration-200"
                aria-label="SILLAGE en Pinterest"
              >
                <PinterestIcon className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com/@sillage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-500 hover:text-gold transition-colors duration-200"
                aria-label="SILLAGE en TikTok"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}