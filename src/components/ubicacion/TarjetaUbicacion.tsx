"use client";

import { useUbicacion } from "@/components/proveedores/UbicacionProvider";
import { Icono } from "@/components/ui/Icono";
import { tiempoRelativo } from "@/lib/formato";
import { formatearCoordenada } from "@/lib/geo";
import { describirZona } from "@/lib/zonas";

/**
 * "Donde estoy" (ADR-023). Funciona con o sin cuenta: la ubicacion no depende del login.
 *
 * Muestra el margen de precision porque en una laptop el navegador se ubica por wifi y
 * puede errar kilometros; sin ese dato la persona no tiene forma de saber si fiarse.
 */
export function TarjetaUbicacion() {
  const { coordenada, precisionM, estado, actualizadoEn, solicitar } = useUbicacion();

  if (estado === "no_soportada") return null;

  if (coordenada) {
    const zona = describirZona(coordenada);
    const precisionPobre = precisionM !== null && precisionM > 200;

    return (
      <div className="tarjeta flex items-start gap-3 p-3.5">
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-alta ${
            precisionPobre ? "text-ambar" : "text-info"
          }`}
        >
          <Icono nombre="ubicacion" className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-texto">Estas en {zona.etiqueta}</p>
          <p className="mt-0.5 font-mono text-[11px] text-tenue">
            {formatearCoordenada(coordenada)}
            {precisionM !== null ? ` · ±${Math.round(precisionM)} m` : ""}
          </p>
          <p className="mt-0.5 text-[11px] text-tenue">
            {actualizadoEn ? `Actualizada ${tiempoRelativo(actualizadoEn)}` : "En seguimiento"} ·
            no sale de tu telefono
          </p>
          {precisionPobre ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-ambar">
              Margen amplio: tu navegador te esta ubicando por wifi, no por GPS.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (estado === "denegada") {
    return (
      <div className="tarjeta p-3.5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-alta text-ambar">
            <Icono nombre="ubicacion" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-texto">Ubicacion bloqueada</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-suave">
              Tu navegador tiene denegado el permiso para este sitio. Actívalo desde el candado
              de la barra de direcciones y recarga.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={solicitar}
      disabled={estado === "buscando"}
      className="tarjeta toque flex w-full items-center gap-3 p-3.5 text-left transition active:scale-[0.99] disabled:opacity-60"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-alta text-info">
        <Icono nombre="ubicacion" className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-texto">
          {estado === "buscando" ? "Buscando tu ubicacion…" : "Ver mi ubicacion"}
        </span>
        <span className="block text-[11px] leading-relaxed text-tenue">
          {estado === "error"
            ? "No se pudo obtener. Toca para reintentar."
            : "No hace falta cuenta. Se queda en tu telefono."}
        </span>
      </span>
      {estado !== "buscando" ? (
        <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-tenue" />
      ) : null}
    </button>
  );
}
