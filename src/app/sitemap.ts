import type { MetadataRoute } from "next";
import { urlBase } from "@/lib/url-base";
import { ARQUITECTURA } from "@/lib/arquitectura";

const RUTAS = ["/", "/mapa", "/reportar", "/cuenta", "/arquitectura"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBase();
  // Fecha de la ultima actualizacion declarada de la arquitectura: es el dato de
  // cambio real del proyecto, no un Date.now() que ensucia el diff en cada build.
  const modificado = new Date(ARQUITECTURA.meta.actualizado);

  return RUTAS.map((ruta) => ({
    url: new URL(ruta, base).toString(),
    lastModified: modificado,
    changeFrequency: "daily",
    priority: ruta === "/" ? 1 : 0.7,
  }));
}
