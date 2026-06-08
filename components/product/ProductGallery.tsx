"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeView, setActiveView] = useState<number>(0); // 0: General, 1: Tapón, 2: Base
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Loupe (magnifier glass) states
  const [showLoupe, setShowLoupe] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50 });

  const mainImage = images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only enable interactive magnifier on the standard full view
    if (activeView !== 0) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setLoupePos({ x, y });
  };

  // Virtual view thumbnails setup
  const virtualViews = [
    {
      id: 0,
      label: "Frasco completo",
      class: "object-contain p-2",
      thumbClass: "object-contain p-1",
    },
    {
      id: 1,
      label: "Detalle del tapón",
      class: "scale-[2.4] origin-top object-cover pt-16",
      thumbClass: "scale-[2.4] origin-top object-cover pt-4",
    },
    {
      id: 2,
      label: "Detalle de la base",
      class: "scale-[2.4] origin-bottom object-cover pb-16",
      thumbClass: "scale-[2.4] origin-bottom object-cover pb-4",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* 1. Miniaturas a la izquierda (Desktop) / abajo (Mobile) */}
      <div className="flex lg:flex-col flex-row gap-3 order-2 lg:order-1 flex-shrink-0 justify-center lg:justify-start">
        {virtualViews.map((view) => {
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-warm-100 to-warm-200 border rounded-card overflow-hidden transition-all duration-300 cursor-pointer shadow-xs focus:outline-hidden focus:ring-1 focus:ring-gold",
                isActive
                  ? "border-gold opacity-100 scale-102"
                  : "border-warm-200/55 opacity-60 hover:opacity-100 hover:border-warm-300"
              )}
              aria-label={`Ver ${view.label}`}
            >
              <div className="absolute inset-0 w-full h-full p-2">
                <img
                  src={mainImage}
                  alt={`${name} - ${view.label}`}
                  className={cn("w-full h-full transition-transform duration-300", view.thumbClass)}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Imagen Principal Activa */}
      <div className="relative flex-1 aspect-square bg-gradient-to-br from-warm-100 to-warm-200 rounded-card overflow-hidden border border-warm-200/40 order-1 lg:order-2">
        <div
          className="relative w-full h-full cursor-zoom-in"
          onMouseEnter={() => activeView === 0 && setShowLoupe(true)}
          onMouseLeave={() => setShowLoupe(false)}
          onMouseMove={handleMouseMove}
        >
          {/* Main Visualized Image */}
          <div className="absolute inset-0 w-full h-full p-8 flex items-center justify-center overflow-hidden">
            <Image
              src={mainImage}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={cn("transition-all duration-700 ease-out p-4 select-none pointer-events-none mix-blend-multiply", virtualViews[activeView].class)}
              priority
            />
          </div>

          {/* Loupe Lens (Interactive Magnifier) - only active on full view */}
          {showLoupe && activeView === 0 && (
            <div
              className="absolute w-40 h-40 rounded-full border border-warm-200/60 shadow-2xl pointer-events-none bg-cream z-20 overflow-hidden"
              style={{
                left: `calc(${loupePos.x}% - 80px)`,
                top: `calc(${loupePos.y}% - 80px)`,
                backgroundImage: `url(${mainImage})`,
                backgroundPosition: `${loupePos.x}% ${loupePos.y}%`,
                backgroundSize: "280% 280%",
                backgroundRepeat: "no-repeat",
              }}
            />
          )}
        </div>

        {/* Lightbox / Fullscreen Dialog Trigger */}
        <Dialog.Root open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <Dialog.Trigger asChild>
            <button
              className="absolute bottom-4 right-4 p-2.5 rounded-full bg-white/80 hover:bg-white text-charcoal hover:text-black shadow-xs hover:shadow-md transition-all duration-300 z-10 cursor-pointer"
              aria-label="Ampliar imagen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            {/* Dark Overlay */}
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-overlay-fade" />
            
            {/* Lightbox Content */}
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="relative w-full max-w-[80vh] aspect-square flex items-center justify-center">
                {/* Close Button */}
                <Dialog.Close asChild>
                  <button
                    className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                    aria-label="Cerrar vista ampliada"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </Dialog.Close>

                {/* Title (for accessibility) */}
                <Dialog.Title className="sr-only">
                  Vista ampliada de {name}
                </Dialog.Title>

                {/* Magnified Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={mainImage}
                    alt={`${name} - Vista ampliada`}
                    fill
                    sizes="90vw"
                    className="object-contain p-2 select-none"
                  />
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
