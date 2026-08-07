import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PuertaAcceso } from "@/components/acceso/PuertaAcceso";
import { BarraPestanas } from "@/components/navegacion/BarraPestanas";
import { AppProvider } from "@/components/proveedores/AppProvider";
import { CirculoProvider } from "@/components/proveedores/CirculoProvider";
import { SesionProvider } from "@/components/proveedores/SesionProvider";
import { UbicacionProvider } from "@/components/proveedores/UbicacionProvider";
import { googleConfigurado } from "@/lib/auth/config";
import { urlBase } from "@/lib/url-base";

const DESCRIPCION =
  "Reporta lo que pasa en tu cuadra en tres toques. Evidencia anclada en Arbitrum, identidad pseudonima y escalamiento directo a la autoridad cuando hace falta.";

export const metadata: Metadata = {
  // Sin metadataBase, Next resuelve la imagen de Open Graph contra localhost y el
  // enlace compartido por WhatsApp sale sin tarjeta. urlBase() la deduce de Vercel.
  metadataBase: urlBase(),
  title: {
    default: "Vecino Seguro — red vecinal de reporte",
    template: "%s · Vecino Seguro",
  },
  description: DESCRIPCION,
  applicationName: "Vecino Seguro",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Vecino Seguro",
    title: "Vecino Seguro — red vecinal de reporte",
    description: DESCRIPCION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vecino Seguro — red vecinal de reporte",
    description: DESCRIPCION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vecino Seguro",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-fondo text-texto antialiased">
        {/* El layout es server component: aqui se decide si hay login sin exponer credenciales. */}
        <SesionProvider googleDisponible={googleConfigurado()}>
          {/* Fuera de la sesion a proposito: la ubicacion no depende de tener cuenta. */}
          <UbicacionProvider>
            <AppProvider>
              {/* El circulo necesita los reportes, por eso va dentro de AppProvider. */}
              <CirculoProvider>
                {/* Sin sesion no se pinta nada de la app: la puerta va primero (ADR-027). */}
                <PuertaAcceso>
                  <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
                    <main className="flex-1 espacio-barra">{children}</main>
                  </div>
                  <BarraPestanas />
                </PuertaAcceso>
              </CirculoProvider>
            </AppProvider>
          </UbicacionProvider>
        </SesionProvider>
      </body>
    </html>
  );
}
