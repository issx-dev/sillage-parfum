"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveImageProps extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  src: string;
  alt: string;
  mobileSrc?: string;
  desktopSrc?: string;
  priority?: boolean;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  className?: string;
  containerClassName?: string;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/9]",
};

export function ResponsiveImage({
  src,
  alt,
  mobileSrc,
  desktopSrc,
  priority = false,
  aspectRatio = "square",
  className,
  containerClassName,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Use picture element approach for responsive images
  const hasMobileSrc = !!mobileSrc;

  return (
    <div className={cn("relative overflow-hidden bg-warm-100", aspectRatioClasses[aspectRatio], containerClassName)}>
      {/* Mobile source */}
      {hasMobileSrc && (
        <source media="(max-width: 767px)" srcSet={mobileSrc} />
      )}

      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn(
          "object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-warm-100 animate-pulse" />
      )}
    </div>
  );
}