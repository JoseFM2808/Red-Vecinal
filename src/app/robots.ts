import type { MetadataRoute } from "next";
import { urlBase } from "@/lib/url-base";

/**
 * La app es publica y queremos que el enlace del hackathon se pueda compartir e indexar.
 * Se excluye /api porque no tiene nada que un buscador deba recorrer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: new URL("/sitemap.xml", urlBase()).toString(),
  };
}
