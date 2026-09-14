import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sillage.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Privado/transaccional: nunca en índice — /admin además lleva
        // noindex en su layout como defensa en profundidad.
        disallow: ["/carrito", "/checkout", "/api/", "/admin", "/cuenta", "/login", "/registro"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
