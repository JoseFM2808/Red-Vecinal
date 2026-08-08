"use client";

import Link from "next/link";
import { useApp } from "@/components/proveedores/AppProvider";
import { Icono } from "@/components/ui/Icono";
import { CATEGORIAS } from "@/lib/categorias";

/**
 * Portal al mapa desde Inicio (ADR-043): la pieza central de la portada.
 *
 * Inicio cuenta la historia del proyecto; esta tarjeta es la puerta a verlo vivo.
 * No incrusta Leaflet a proposito — cargar el mapa real en la portada duplica el peso
 * de la pagina para un fondo decorativo. En su lugar: un lienzo con la trama de la
 * ciudad, marcadores latiendo en las posiciones RELATIVAS de los ultimos reportes
 * reales, y las cifras de la red. Los datos son verdad; la estetica es nuestra.
 */

/** Caja geografica aproximada de Lima y Callao, para proyectar coordenadas al lienzo. */
const LIMA = { latMin: -12.35, latMax: -11.85, lngMin: -77.2, lngMax: -76.85 };

export function PortalMapa() {
  const { reportes, cargando } = useApp();

  const ahora = Date.now();
  const recientes = reportes.filter((r) => ahora - r.creadoEn < 24 * 3_600_000);
  const zonas = new Set(recientes.map((r) => r.zonaId)).size;

  // Hasta 7 marcadores, proyectados a porcentajes del lienzo. Se recortan los que caen
  // fuera de la caja de Lima para que un reporte de otra ciudad no rompa el dibujo.
  const marcadores = reportes
    .slice(0, 7)
    .map((r) => {
      const x = ((r.coordenada.lng - LIMA.lngMin) / (LIMA.lngMax - LIMA.lngMin)) * 100;
      const y = ((LIMA.latMax - r.coordenada.lat) / (LIMA.latMax - LIMA.latMin)) * 100;
      const color = CATEGORIAS.find((c) => c.id === r.categoria)?.color ?? "#2fe6a8";
      return { id: r.id, x, y, color };
    })
    .filter((m) => m.x >= 4 && m.x <= 96 && m.y >= 8 && m.y <= 92);

  return (
    <Link
      href="/mapa"
      aria-label="Abrir el mapa de incidentes en vivo"
      className="group relative block overflow-hidden rounded-2xl border border-borde transition active:scale-[0.99]"
    >
      {/* Lienzo: la trama de una ciudad de noche, en CSS puro. */}
      <div
        aria-hidden
        className="relative h-44 w-full"
        style={{
          background:
            "radial-gradient(120% 90% at 70% 10%, rgba(47,230,168,0.10) 0%, transparent 55%)," +
            "radial-gradient(90% 80% at 15% 85%, rgba(98,168,255,0.10) 0%, transparent 50%)," +
            "linear-gradient(#14181e, #0a0c0f)",
        }}
      >
        {/* Cuadricula de calles. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(233,238,244,0.055) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(233,238,244,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Una avenida diagonal, porque ninguna ciudad es una cuadricula perfecta. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 47.6%, rgba(233,238,244,0.12) 48%, rgba(233,238,244,0.12) 48.6%, transparent 49%)",
          }}
        />

        {/* Los reportes reales, latiendo donde de verdad estan. */}
        {marcadores.map((m, i) => (
          <span
            key={m.id}
            className="absolute"
            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="relative flex h-3 w-3">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                style={{ backgroundColor: m.color, animationDelay: `${i * 350}ms` }}
              />
              <span
                className="relative inline-flex h-3 w-3 rounded-full border-2 border-fondo"
                style={{ backgroundColor: m.color }}
              />
            </span>
          </span>
        ))}

        {/* Cifras sobre el lienzo. */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-fondo/95 via-fondo/60 to-transparent p-4 pt-8">
          <div>
            <p className="text-sm font-semibold text-texto">Mapa de incidentes en vivo</p>
            <p className="mt-0.5 text-xs text-suave">
              {cargando
                ? "Cargando la red…"
                : recientes.length > 0
                  ? `${recientes.length} reporte${recientes.length === 1 ? "" : "s"} hoy en ${zonas} zona${zonas === 1 ? "" : "s"} · filtra por fecha y tipo`
                  : "Estrena la red: el primer reporte puede ser el tuyo"}
            </p>
          </div>
          <span className="toque grid shrink-0 place-items-center rounded-full bg-marca text-fondo shadow-lg shadow-marca/25 transition group-active:scale-95">
            <Icono nombre="mapa" className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
