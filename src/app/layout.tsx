import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BarraPestanas } from "@/components/navegacion/BarraPestanas";
import { AppProvider } from "@/components/proveedores/AppProvider";

export const metadata: Metadata = {
  title: "Vecino Seguro — red vecinal de reporte",
  description:
    "Reporta lo que pasa en tu cuadra en tres toques. Evidencia anclada en Arbitrum, identidad pseudonima y escalamiento directo a la autoridad cuando hace falta.",
  applicationName: "Vecino Seguro",
  manifest: "/manifest.webmanifest",
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
        <AppProvider>
          <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
            <main className="flex-1 espacio-barra">{children}</main>
          </div>
          <BarraPestanas />
        </AppProvider>
      </body>
    </html>
  );
}
