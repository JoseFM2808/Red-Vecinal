import type { NextConfig } from "next";

/**
 * Configuracion minima y explicita: Vercel detecta Next.js y despliega sin ajustes extra.
 * No se agregan plugins ni transformaciones ocultas — todo lo que corre esta a la vista.
 *
 * Las cabeceras van AQUI y no en vercel.json a proposito: headers() de next.config aplica
 * tambien en `next start`, asi que la politica se puede probar en local antes de desplegar.
 * En vercel.json solo se verian en produccion, que es el peor momento para descubrir que
 * una directiva rompe el mapa.
 */

/**
 * Content-Security-Policy.
 *
 * Cada directiva de abajo esta puesta contra una necesidad real y verificada de la app.
 * SI QUITAS UNA, ALGO DEJA DE FUNCIONAR:
 *
 * - script-src 'unsafe-inline'  -> Next serializa el payload RSC en <script> inline
 *   (self.__next_f.push). Sin esto no hay hidratacion y el mapa nunca se monta.
 *   Se podria eliminar con nonces, pero eso exige un middleware que volveria dinamicas
 *   las 5 rutas hoy estaticas. Sinceridad para el pitch: con 'unsafe-inline' esta CSP
 *   no es una defensa anti-XSS; lo que si aporta es object-src 'none', base-uri 'self'
 *   y form-action 'self'.
 * - style-src 'unsafe-inline'   -> los marcadores del mapa se pintan con un atributo
 *   style inline (MapaLeaflet.tsx) y varias tarjetas colorean por categoria igual.
 * - img-src blob:               -> URL.createObjectURL para la vista previa de la foto.
 * - img-src data:               -> miniaturas generadas con canvas.toDataURL.
 * - tile.openstreetmap.org      -> teselas del mapa.
 *
 * Los origenes de Arbitrum y Pinata ya estan permitidos aunque todavia no se usen: cuando
 * el equipo conecte el RPC o el storage real, la CSP no les va a fallar en silencio.
 *
 * Si conectas algo nuevo (Privy, Web3Auth, otro RPC) y deja de cargar: mira la consola,
 * la CSP dice exactamente que origen bloqueo, y se agrega aqui.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://gateway.pinata.cloud https://*.mypinata.cloud",
  "font-src 'self' data:",
  // Arbitrum Sepolia y One, mas los gateways de Pinata: preparados para el siguiente paso.
  "connect-src 'self' https://sepolia-rollup.arbitrum.io https://arb1.arbitrum.io https://*.arbitrum.io https://api.pinata.cloud https://gateway.pinata.cloud https://*.mypinata.cloud",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Valvula de escape: si el 11 de agosto algo empieza a fallar por la CSP y no hay tiempo
 * de diagnosticarlo, se pone CSP_MODO=report-only en Vercel y se redespliega. La politica
 * pasa a solo reportar en consola sin bloquear nada.
 */
const cspSoloReporta = process.env.CSP_MODO === "report-only";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Un dato menos que regalar sobre el stack.
  poweredByHeader: false,
  // La beta no depende de dominios de imagenes externos: la evidencia se guarda
  // como data URL en el adaptador de storage simulado (ver src/lib/storage).
  images: { remotePatterns: [] },

  async headers() {
    const seguras = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      // geolocation y camara EXPLICITAMENTE permitidas en same-origin: la app las necesita
      // en el flujo de reporte. `(self)` es el valor por defecto de la spec, o sea que esto
      // no cambia el comportamiento propio; lo que hace es negarselas a cualquier iframe.
      // Nunca poner `geolocation=()`: apagaria el GPS sin siquiera mostrar el permiso.
      {
        key: "Permissions-Policy",
        value: "geolocation=(self), camera=(self), microphone=(), payment=(), usb=()",
      },
    ];

    // No se emite CSP en desarrollo: HMR usa eval y websockets, y no vale la pena
    // mantener dos politicas distintas para eso.
    if (process.env.NODE_ENV !== "production") {
      return [{ source: "/:path*", headers: seguras }];
    }

    return [
      {
        source: "/:path*",
        headers: [
          ...seguras,
          {
            key: cspSoloReporta
              ? "Content-Security-Policy-Report-Only"
              : "Content-Security-Policy",
            value: CSP,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Nota sobre lo que deliberadamente NO se envia:
// - Cross-Origin-Embedder-Policy: require-corp rompe las teselas de OpenStreetMap.
// - X-Frame-Options / frame-ancestors: las plataformas de hackathon suelen incrustar la
//   demo en un iframe. La app no tiene sesion ni accion destructiva autenticada, asi que
//   se prioriza que el proyecto se pueda mostrar. Revisar si esto cambia.
// - Strict-Transport-Security: vercel.app ya viene con HSTS desde la plataforma. Fijarlo
//   a mano solo agrega riesgo si despues se estrena un dominio propio.
