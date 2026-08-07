import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vecino Seguro",
    short_name: "Vecino Seguro",
    description:
      "Red vecinal de reporte de seguridad con evidencia anclada en Arbitrum e identidad pseudonima.",
    lang: "es-PE",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0c0f",
    theme_color: "#0a0c0f",
    icons: [
      {
        src: "/icono.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
