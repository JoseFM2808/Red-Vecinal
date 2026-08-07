"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useApp } from "@/components/proveedores/AppProvider";
import { HojaDetalle } from "@/components/reportes/HojaDetalle";
import { TarjetaReporte } from "@/components/reportes/TarjetaReporte";
import { AvisoSismo } from "@/components/sismos/AvisoSismo";
import { Icono } from "@/components/ui/Icono";
import { CATEGORIAS } from "@/lib/categorias";
import type { Coordenada, IdCategoria, Reporte } from "@/lib/tipos";

/**
 * Pantalla de mapa. El componente de Leaflet se carga solo en el navegador:
 * Leaflet toca `window` al importarse y romperia el render en el servidor.
 */
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-superficie text-xs text-tenue">
      Cargando mapa…
    </div>
  ),
});

/** Centro por defecto: Lima. Se mueve en cuanto hay reportes o ubicacion real. */
const CENTRO_LIMA: Coordenada = { lat: -12.05, lng: -77.03 };

export function MapaReportes() {
  const { reportes, cargando } = useApp();
  const [filtro, setFiltro] = useState<IdCategoria | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [posicionUsuario, setPosicionUsuario] = useState<Coordenada | null>(null);
  const [centroManual, setCentroManual] = useState<Coordenada | null>(null);

  const visibles = useMemo(
    () => (filtro ? reportes.filter((r) => r.categoria === filtro) : reportes),
    [filtro, reportes],
  );

  const detalle: Reporte | null = useMemo(
    () => reportes.find((r) => r.id === seleccionado) ?? null,
    [reportes, seleccionado],
  );

  const centro = useMemo<Coordenada>(() => {
    if (detalle) return detalle.coordenada;
    if (centroManual) return centroManual;
    const primero = visibles[0];
    return primero ? primero.coordenada : CENTRO_LIMA;
  }, [centroManual, detalle, visibles]);

  const ubicarme = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordenada = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosicionUsuario(coordenada);
        setSeleccionado(null);
        setCentroManual(coordenada);
      },
      () => {
        // Permiso denegado: el mapa se queda donde esta, sin bloquear nada.
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-col">
      <div className="relative h-[46dvh] w-full overflow-hidden border-b border-borde">
        <MapaLeaflet
          reportes={visibles}
          centro={centro}
          zoom={detalle ? 16 : 12}
          seleccionado={seleccionado}
          posicionUsuario={posicionUsuario}
          onSeleccionar={setSeleccionado}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex gap-1.5 overflow-x-auto px-3 py-3">
          <button
            type="button"
            onClick={() => setFiltro(null)}
            className={`toque pointer-events-auto flex shrink-0 items-center rounded-full border px-3.5 text-xs font-medium backdrop-blur transition ${
              filtro === null
                ? "border-marca/50 bg-marca/20 text-marca"
                : "border-borde bg-superficie/90 text-suave"
            }`}
          >
            Todo ({reportes.length})
          </button>
          {CATEGORIAS.map((c) => {
            const total = reportes.filter((r) => r.categoria === c.id).length;
            const activo = filtro === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFiltro(activo ? null : c.id)}
                className={`toque pointer-events-auto flex shrink-0 items-center rounded-full border px-3.5 text-xs font-medium backdrop-blur transition ${
                  activo ? "text-fondo" : "border-borde bg-superficie/90 text-suave"
                }`}
                style={
                  activo ? { backgroundColor: c.color, borderColor: c.color, color: "#0a0c0f" } : undefined
                }
              >
                {c.nombre.split(" ")[0]} ({total})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={ubicarme}
          aria-label="Centrar en mi ubicacion"
          className="toque absolute bottom-3 right-3 z-[500] grid place-items-center rounded-full border border-borde bg-superficie/95 text-info shadow-lg backdrop-blur"
        >
          <Icono nombre="ubicacion" className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2 p-4">
        <AvisoSismo compacto />

        <div className="flex items-center justify-between">
          <h2 className="etiqueta-seccion">
            {visibles.length} reporte{visibles.length === 1 ? "" : "s"}
          </h2>
          {reportes.some((r) => r.esSemilla) ? (
            <span className="text-[10px] text-tenue">Incluye datos sembrados de demo</span>
          ) : null}
        </div>

        {cargando ? (
          <p className="py-8 text-center text-sm text-tenue">Cargando la red…</p>
        ) : visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-tenue">
            No hay reportes de esta categoria todavia.
          </p>
        ) : (
          visibles.map((reporte) => (
            <TarjetaReporte
              key={reporte.id}
              reporte={reporte}
              activo={reporte.id === seleccionado}
              onClick={() => setSeleccionado(reporte.id)}
            />
          ))
        )}
      </div>

      {detalle ? <HojaDetalle reporte={detalle} onCerrar={() => setSeleccionado(null)} /> : null}
    </div>
  );
}
