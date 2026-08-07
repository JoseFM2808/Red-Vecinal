import type { NextConfig } from "next";

/**
 * Configuracion minima y explicita: Vercel detecta Next.js y despliega sin ajustes extra.
 * No se agregan plugins ni transformaciones ocultas — todo lo que corre esta a la vista.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // La beta no depende de dominios de imagenes externos: la evidencia se guarda
  // como data URL en el adaptador de storage simulado (ver src/lib/storage).
  images: { remotePatterns: [] },
};

export default nextConfig;
