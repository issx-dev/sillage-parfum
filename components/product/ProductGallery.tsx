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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const mainImage = images[0];

  return (
    <div className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-[5/6] xl:aspect-[1/1] bg-warm-100/30 overflow-hidden flex items-center justify-center select-none">
      
      {/* Product Image Container */}
      <div className="relative w-full h-full p-8 sm:p-12 lg:p-16 flex items-center justify-center">
        <Image
          src={mainImage}
          alt={name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-6 mix-blend-multiply [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.06))]"
          priority
        />
      </div>

      {/* Floating Wishlist Button top-right */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
        <WishlistButton productId={productId} />
      </div>

      {/* Floating Lightbox Trigger bottom-right */}
      <Dialog.Root open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <Dialog.Trigger asChild>
          <button
            className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 p-2.5 rounded-full bg-cream/80 backdrop-blur-xs hover:bg-white text-charcoal hover:text-black border border-warm-200/40 shadow-xs hover:shadow-md transition-all duration-300 z-10 cursor-pointer"
            aria-label="Ampliar imagen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-overlay-fade" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-[85vh] aspect-square flex items-center justify-center">
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
  );
}
