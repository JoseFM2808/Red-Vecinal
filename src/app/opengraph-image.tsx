import { ImageResponse } from "next/og";

/**
 * Tarjeta que se ve cuando alguien comparte el enlace por WhatsApp, Slack o Twitter.
 * Se genera en tiempo de build con `next/og`, que ya viene con Next: cero dependencias nuevas.
 *
 * Importa mas de lo que parece para el hackathon: el enlace de la demo va a circular por
 * WhatsApp entre jurado y equipo, y una tarjeta en blanco resta antes de que abran la app.
 */

export const alt = "Vecino Seguro — red vecinal de reporte de seguridad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagenOpenGraph() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0c0f",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#0f5c44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              color: "#2fe6a8",
            }}
          >
            VS
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 34, color: "#e9eef4", fontWeight: 600 }}>Vecino Seguro</span>
            <span style={{ fontSize: 20, color: "#5d6875" }}>Hackathon Ethereum Lima 2026</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 60, color: "#e9eef4", lineHeight: 1.15, fontWeight: 600 }}>
            Reporta tu cuadra en tres toques.
          </span>
          <span style={{ fontSize: 34, color: "#2fe6a8", lineHeight: 1.3 }}>
            Evidencia anclada en Arbitrum. Identidad pseudonima.
          </span>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Sin registro", "Coordenada truncada a 11 m", "Escalamiento a la autoridad"].map((t) => (
            <span
              key={t}
              style={{
                border: "1px solid #272e38",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 22,
                color: "#96a1b0",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
