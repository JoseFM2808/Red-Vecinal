import type { MetadataRoute } from "next";
import { urlBase } from "@/lib/url-base";
import { ARQUITECTURA } from "@/lib/arquitectura";

// /circulo queda fuera a proposito: exige sesion (ADR-102), asi que indexarla solo
// llevaria a un muro. /landing si entra, y con prioridad alta: es la URL que se comparte
// con el jurado y con quien llega en frio (ADR-037).
const RUTAS = ["/", "/landing", "/mapa", "/reportar", "/cuenta", "/arquitectura"] as const;

const PRIORIDAD: Record<string, number> = { "/": 1, "/landing": 0.9 };

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBase();
  // Fecha de la ultima actualizacion declarada de la arquitectura: es el dato de
  // cambio real del proyecto, no un Date.now() que ensucia el diff en cada build.
  const modificado = new Date(ARQUITECTURA.meta.actualizado);

  return RUTAS.map((ruta) => ({
    url: new URL(ruta, base).toString(),
    lastModified: modificado,
    changeFrequency: "daily",
    priority: PRIORIDAD[ruta] ?? 0.7,
  }));
}
