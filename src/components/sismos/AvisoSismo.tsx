"use client";

import Link from "next/link";
import { useApp } from "@/components/proveedores/AppProvider";
import { Icono } from "@/components/ui/Icono";
import { obtenerCategoria } from "@/lib/categorias";
import { tiempoRelativo } from "@/lib/formato";
import { CATEGORIA_SISMO, resumirSismosRecientes } from "@/lib/sismos";

/**
 * Panel "lo sentiste": aparece solo cuando dos o mas vecinos distintos reportaron un
 * sismo en la ultima media hora.
 *
 * Es el equivalente comunitario del "Did You Feel It?" del USGS: no detecta nada, agrega
 * lo que la gente reporto. Por eso el texto dice "vecinos reportaron", nunca "se detecto
 * un sismo de magnitud X" — la app no tiene forma de saber eso y prometerlo seria mentir.
 */
export function AvisoSismo({ compacto = false }: { compacto?: boolean }) {
  const { reportes } = useApp();
  const categoria = obtenerCategoria(CATEGORIA_SISMO);
  const resumen = resumirSismosRecientes(reportes, Date.now());

  if (!resumen.activo) return null;

  return (
    <div
      className="aparecer rounded-2xl border p-4"
      style={{ borderColor: `${categoria.color}55`, backgroundColor: `${categoria.color}12` }}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${categoria.color}22`, color: categoria.color }}
        >
          <Icono nombre="sismo" className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-texto">
            {resumen.personas} vecinos reportaron un sismo
          </p>
          <p className="mt-0.5 text-xs text-suave">
            El primer aviso llego{" "}
            {resumen.primeroEn !== null ? tiempoRelativo(resumen.primeroEn) : "hace poco"}
            {resumen.intensidad ? ` · intensidad reportada: ${resumen.intensidad.toLowerCase()}` : ""}
          </p>

          {!compacto ? (
            <>
              <div className="mt-3 space-y-1.5">
                {resumen.zonas.slice(0, 4).map((z) => (
                  <div key={z.nombre} className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-superficie-alta">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(12, (z.total / resumen.reportes) * 100)}%`,
                          backgroundColor: categoria.color,
                        }}
                      />
                    </div>
                    <span className="w-32 shrink-0 truncate text-right text-[11px] text-suave">
                      {z.nombre}
                    </span>
                    <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-tenue">
                      {z.total}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-2.5 text-[11px] leading-relaxed text-tenue">
                Agregado de lo que reportaron los vecinos, no una medicion sismologica. La app no
                detecta sismos: los cuenta.
              </p>
            </>
          ) : null}

          <Link
            href={`/reportar?categoria=${CATEGORIA_SISMO}`}
            className="toque mt-3 inline-flex items-center gap-2 rounded-xl px-4 text-sm font-semibold text-fondo"
            style={{ backgroundColor: categoria.color }}
          >
            <Icono nombre="sismo" className="h-4 w-4" />
            Yo tambien lo senti
          </Link>
        </div>
      </div>
    </div>
  );
}
