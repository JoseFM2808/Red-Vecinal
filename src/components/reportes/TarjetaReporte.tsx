"use client";

import { obtenerCategoria } from "@/lib/categorias";
import { tiempoRelativo } from "@/lib/formato";
import type { Reporte } from "@/lib/tipos";
import { Icono } from "@/components/ui/Icono";

export function TarjetaReporte({
  reporte,
  activo = false,
  onClick,
}: {
  reporte: Reporte;
  activo?: boolean;
  onClick: () => void;
}) {
  const categoria = obtenerCategoria(reporte.categoria);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`tarjeta w-full p-3.5 text-left transition active:scale-[0.99] ${
        activo ? "border-marca/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${categoria.color}1f`, color: categoria.color }}
        >
          <Icono nombre={categoria.icono} className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug text-texto">{reporte.descripcion}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-tenue">
            <span>{reporte.zonaNombre}</span>
            <span aria-hidden>·</span>
            <span>{tiempoRelativo(reporte.creadoEn)}</span>
            <span aria-hidden>·</span>
            <span>{reporte.autorSeudonimo}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {reporte.corroboraciones.length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-marca/12 px-2 py-0.5 text-[10px] font-medium text-marca">
                <Icono nombre="check" className="h-3 w-3" />
                {reporte.corroboraciones.length} corrobora
                {reporte.corroboraciones.length > 1 ? "n" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-superficie-alta px-2 py-0.5 text-[10px] text-tenue">
                Sin corroborar
              </span>
            )}

            {reporte.escalamiento ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-info/12 px-2 py-0.5 text-[10px] font-medium text-info">
                <Icono nombre="megafono" className="h-3 w-3" />
                Escalado
              </span>
            ) : null}

            {reporte.estadoAnclaje === "anclado" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-superficie-alta px-2 py-0.5 text-[10px] text-suave">
                <Icono nombre="cadena" className="h-3 w-3" />
                En cadena
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
