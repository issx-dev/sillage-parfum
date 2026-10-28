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
  // CDN de fichas de fabricante que el admin pega en productos.
  "media.sephora.eu",
]);

function isSupabaseStorage(host: string): boolean {
  return host.endsWith(".supabase.co");
}

function isOptimizable(src: string): boolean {
  if (src.startsWith("/") || src.startsWith("data:")) return true;
  try {
    const host = new URL(src).hostname.toLowerCase();
    // Las subidas del equipo van a Storage: se optimizan con next/image
    // (el host debe estar también en images.remotePatterns de next.config).
    if (isSupabaseStorage(host)) return true;
    return OPTIMIZED_HOSTS.has(host);
  } catch {
    // No es una URL válida: <img> nativo mostrará el fallback,
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
  /**
   * Imagen de recambio si la remota muere (hotlink roto, CDN caído).
   * Solo aplica a la rama <img>; por defecto el placeholder de la casa.
   */
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "/images/og-default.jpg";

function RemoteImg({
  src,
  alt,
  className,
  eager,
  fill,
  width,
  height,
  fallbackSrc = DEFAULT_FALLBACK,
}: {
  src: string;
  alt: string;
  className?: string;
  eager: boolean;
  fill: boolean;
  width?: number;
  height?: number;
  fallbackSrc?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : (width ?? 800)}
      height={fill ? undefined : (height ?? 800)}
      loading={eager ? "eager" : "lazy"}
      className={fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className}
      onError={(event) => {
        const el = event.currentTarget;
        if (el.src !== fallbackSrc && !el.src.endsWith(fallbackSrc)) {
          el.src = fallbackSrc;
        }
      }}
    />
  );
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
  fallbackSrc,
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

  if (!isOptimizable(src)) {
    return (
      <RemoteImg
        src={src}
        alt={alt}
        className={className}
        eager={eager}
        fill={fill}
        width={width}
        height={height}
        fallbackSrc={fallbackSrc}
      />
    );
  }

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
