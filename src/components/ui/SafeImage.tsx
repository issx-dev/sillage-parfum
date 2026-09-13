"use client";

import Image from "next/image";

/**
 * SafeImage — `next/image` sin el crash por host no configurado.
 *
 * El admin pega URLs de cualquier CDN (Sephora, Chogan, …): pasarlas a
 * `next/image` revienta la página (`next-image-unconfigured-host`). Esta
 * frontera decide:
 * - src local (`/images/...`, `data:`) u host en allowlist → `next/image`
 *   con optimización completa.
 * - cualquier otro host remoto → `<img>` nativo (sin optimizar, pero la
 *   página sigue en pie).
 *
 * Invariante: ninguna URL guardada en la DB puede tumbar el render.
 */

const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  // SILLAGE opera con estos CDN además de /images local.
  "media.sephora.eu",
]);

function isOptimizable(src: string): boolean {
  if (src.startsWith("/") || src.startsWith("data:")) return true;
  try {
    const host = new URL(src).hostname.toLowerCase();
    return OPTIMIZED_HOSTS.has(host);
  } catch {
    // No es una URL válida: <img> nativo mostrará el icono de rota,
    // next/image lanzaría igual. Nunca crashear.
    return false;
  }
}

export interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  fill?: boolean;
  width?: number;
  height?: number;
}

export function SafeImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  loading,
  fill = false,
  width,
  height,
}: SafeImageProps) {
  if (isOptimizable(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
          priority={priority}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 800}
        height={height ?? 800}
        sizes={sizes}
        className={className}
        priority={priority}
      />
    );
  }

  const eager = priority || loading === "eager";

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className={fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 800}
      loading={eager ? "eager" : "lazy"}
      className={className}
    />
  );
}
