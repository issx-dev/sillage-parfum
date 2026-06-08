"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/product/WishlistButton";

interface ProductGalleryProps {
  images: string[];
  name: string;
  productId: string;
}

export function ProductGallery({ images, name, productId }: ProductGalleryProps) {
  // 0: General/Frasco, 1: Tapón, 2: Base
  const [activeView, setActiveView] = useState<number>(0); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const mainImage = images[0];

  // Virtual view setups for zooming in on a single high-quality image
  const virtualViews = [
    {
      id: 0,
      label: "Frasco completo",
      class: "object-contain p-4 sm:p-6 lg:p-8",
    },
    {
      id: 1,
      label: "Detalle del tapón",
      class: "scale-[2.2] origin-top object-contain pt-20 sm:pt-24 lg:pt-28",
    },
    {
      id: 2,
      label: "Detalle de la base",
      class: "scale-[2.2] origin-bottom object-contain pb-20 sm:pb-24 lg:pb-28",
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Main double-spread gallery container */}
      <div className="relative w-full aspect-[3/4] lg:aspect-[1.5/1] bg-warm-100/30 overflow-hidden flex flex-col lg:flex-row select-none">
        
        {/* Panel 1: Full bottle (Always visible on desktop, visible on mobile if activeView is 0) */}
        <div 
          className={cn(
            "relative w-full h-full lg:w-1/2 flex items-center justify-center bg-warm-100/10 transition-all duration-500",
            activeView === 0 ? "flex" : "hidden lg:flex"
          )}
        >
          <div className="relative w-full h-full p-8 sm:p-12 lg:p-14 flex items-center justify-center">
            <Image
              src={mainImage}
              alt={name}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-contain p-4 mix-blend-multiply [filter:drop-shadow(0_12px_24px_rgba(0,0,0,0.06))]"
              priority
            />
          </div>
        </div>

        {/* Precise vertical divider on desktop */}
        <div className="hidden lg:block w-px bg-warm-200/50 h-full shrink-0" />

        {/* Panel 2: Detail zoom view (Always visible on desktop showing detail, visible on mobile if activeView is 1 or 2) */}
        <div 
          className={cn(
            "relative w-full h-full lg:w-1/2 flex items-center justify-center bg-warm-100/10 overflow-hidden transition-all duration-500",
            activeView > 0 ? "flex" : "hidden lg:flex"
          )}
        >
          <div className="relative w-full h-full p-8 sm:p-12 lg:p-14 flex items-center justify-center">
            <Image
              src={mainImage}
              alt={`${name} - Detalle`}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className={cn(
                "transition-all duration-700 ease-out mix-blend-multiply [filter:drop-shadow(0_12px_24px_rgba(0,0,0,0.06))]",
                // On desktop, if activeView is 0, we show Detail of the Cap (1) as the default detail view
                virtualViews[activeView === 0 ? 1 : activeView].class
              )}
            />
          </div>

          {/* Desktop inline view switcher overlayed on Panel 2 */}
          <div className="absolute bottom-6 right-6 hidden lg:flex items-center gap-4 z-10 bg-cream/70 backdrop-blur-xs py-1.5 px-3 rounded-full border border-warm-200/40 shadow-xs">
            <button
              onClick={() => setActiveView(1)}
              className={cn(
                "text-[10px] tracking-widest uppercase transition-all duration-300 font-sans font-medium pb-0.5 border-b",
                (activeView === 1 || activeView === 0)
                  ? "text-charcoal border-charcoal"
                  : "text-gray-mid/60 border-transparent hover:text-charcoal"
              )}
            >
              Tapón
            </button>
            <button
              onClick={() => setActiveView(2)}
              className={cn(
                "text-[10px] tracking-widest uppercase transition-all duration-300 font-sans font-medium pb-0.5 border-b",
                activeView === 2
                  ? "text-charcoal border-charcoal"
                  : "text-gray-mid/70 border-transparent hover:text-charcoal"
              )}
            >
              Base
            </button>
          </div>
          
          {/* Floating Radix Lightbox Trigger */}
          <Dialog.Root open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
            <Dialog.Trigger asChild>
              <button
                className="absolute bottom-6 left-6 p-2 rounded-full bg-cream/80 backdrop-blur-xs hover:bg-white text-charcoal hover:text-black border border-warm-200/40 shadow-xs hover:shadow-md transition-all duration-300 z-10 cursor-pointer"
                aria-label="Ampliar imagen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-overlay-fade" />
              <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="relative w-full max-w-[80vh] aspect-square flex items-center justify-center">
                  <Dialog.Close asChild>
                    <button
                      className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
                      aria-label="Cerrar vista ampliada"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </Dialog.Close>

                  <Dialog.Title className="sr-only">
                    Vista ampliada de {name}
                  </Dialog.Title>

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

        {/* Wishlist Button floating in top right of the whole gallery */}
        <div className="absolute top-6 right-6 z-20">
          <WishlistButton productId={productId} />
        </div>
      </div>

      {/* Mobile-only switcher tabs */}
      <div className="flex justify-center gap-8 mt-6 lg:hidden">
        {virtualViews.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={cn(
              "pb-1 text-[11px] tracking-widest uppercase transition-all duration-300 font-sans border-b-2",
              activeView === view.id
                ? "text-charcoal border-gold font-medium"
                : "text-gray-mid/60 border-transparent hover:text-charcoal"
            )}
          >
            {view.id === 0 ? "Frasco" : view.id === 1 ? "Tapón" : "Base"}
          </button>
        ))}
      </div>
    </div>
  );
}
