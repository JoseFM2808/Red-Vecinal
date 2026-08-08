"use client";

import { useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/primitivos";
import { tiempoRelativo } from "@/lib/formato";
import { NIVELES_INTENSIDAD, type MapaIntensidad } from "@/lib/sismos-oficiales";
import type { SismoConContexto } from "./useSismosOficiales";

/**
 * Lista de sismos oficiales del IGP (ADR-042).
 *
 * Cada tarjeta responde, en este orden, las preguntas que uno se hace tras un remezon:
 * donde fue, que tan fuerte, cuando, y a que distancia estoy. Debajo va la capa
 * comunitaria: cuanta gente respondio como lo sintio.
 *
 * La magnitud manda el color. No es decoracion: es la primera lectura de la tarjeta.
 */

function colorMagnitud(magnitud: number): { texto: string; barra: string } {
  if (magnitud >= 5.5) return { texto: "text-alerta", barra: "bg-alerta" };
  if (magnitud >= 4) return { texto: "text-ambar", barra: "bg-ambar" };
  return { texto: "text-info", barra: "bg-info" };
}

/** Hora local del sismo, en formato de Lima. */
function horaLocal(epoch: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
    hour12: false,
  }).format(new Date(epoch));
}

function BarraIntensidad({ mapa }: { mapa: MapaIntensidad }) {
  if (mapa.totalRespuestas === 0) {
    return (
      <p className="text-[11px] leading-relaxed text-tenue">
        Nadie ha respondido todavia como lo sintio en su zona.
      </p>
    );
  }

  const maximo = 5;

  return (
    <div className="space-y-1.5">
      <p className="etiqueta-seccion">Mapa de intensidad · {mapa.totalRespuestas} respuestas</p>
      {mapa.zonas.map((z) => (
        <div key={z.zonaId} className="flex items-center gap-2.5">
          <span className="w-28 shrink-0 truncate text-xs text-suave" title={z.zonaNombre}>
            {z.zonaNombre}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-superficie-alta">
            <span
              className="block h-full rounded-full bg-ambar"
              style={{ width: `${(z.gradoPromedio / maximo) * 100}%` }}
            />
          </span>
          <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-tenue">
            {z.gradoPromedio} · {z.respuestas}
          </span>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-tenue">
        Promedio de 1 (no se sintio) a 5 (muy fuerte). Cuenta personas, no mide el suelo.
      </p>
    </div>
  );
}

export function TarjetaSismo({
  entrada,
  mapa,
  onResponder,
}: {
  entrada: SismoConContexto;
  mapa: MapaIntensidad;
  onResponder: (intensidad: (typeof NIVELES_INTENSIDAD)[number]["id"]) => void;
}) {
  const { sismo, alerta, miIntensidad } = entrada;
  const color = colorMagnitud(sismo.magnitud);
  const [verMapa, setVerMapa] = useState(false);

  return (
    <Tarjeta className="overflow-hidden p-0">
      {/* Franja de color: la magnitud se lee antes que el texto. */}
      <span className={`block h-1 w-full ${color.barra}`} aria-hidden />

      <div className="p-4">
        <p className="text-sm font-medium leading-snug text-texto">{sismo.referencia}</p>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`font-mono text-3xl font-semibold ${color.texto}`}>
            {sismo.magnitud.toFixed(1)}
          </span>
          <span className={`text-xs font-semibold ${color.texto}`}>{sismo.tipoMagnitud}</span>
          <span className="text-xs text-suave">
            {sismo.profundidadKm} km de profundidad
          </span>
        </div>

        <dl className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-suave">
            <Icono nombre="reloj" className="h-3.5 w-3.5 shrink-0 text-tenue" />
            <dt className="sr-only">Cuando</dt>
            <dd>
              {horaLocal(sismo.ocurridoEn)} · {tiempoRelativo(sismo.ocurridoEn)}
            </dd>
          </div>

          {alerta.distanciaKm !== null ? (
            <div className="flex items-center gap-2 text-xs text-suave">
              <Icono nombre="ubicacion" className="h-3.5 w-3.5 shrink-0 text-tenue" />
              <dt className="sr-only">Distancia</dt>
              <dd>
                A {alerta.distanciaKm} km de ti, hacia el {alerta.rumbo}
              </dd>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-tenue">
              <Icono nombre="ubicacion" className="h-3.5 w-3.5 shrink-0" />
              <dd>Activa tu ubicacion para saber a que distancia quedo</dd>
            </div>
          )}

          {sismo.intensidadMaxima ? (
            <div className="flex items-center gap-2 text-xs text-suave">
              <Icono nombre="sismo" className="h-3.5 w-3.5 shrink-0 text-tenue" />
              <dt className="sr-only">Intensidad reportada por el IGP</dt>
              <dd>Intensidad {sismo.intensidadMaxima}</dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-2.5 text-right text-[11px] text-tenue">Fuente: {sismo.fuente}</p>

        {/* --- Capa comunitaria ------------------------------------------- */}
        <div className="mt-3 border-t border-borde pt-3">
          {miIntensidad ? (
            <div className="flex items-center gap-2">
              <Icono nombre="check" className="h-4 w-4 shrink-0 text-marca" />
              <p className="text-xs text-suave">
                Respondiste:{" "}
                <strong className="font-medium text-texto">
                  {NIVELES_INTENSIDAD.find((n) => n.id === miIntensidad)?.etiqueta}
                </strong>
                . Puedes cambiarlo abajo.
              </p>
            </div>
          ) : (
            <p className="text-xs font-medium text-texto">¿Como lo sentiste tu?</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {NIVELES_INTENSIDAD.map((nivel) => (
              <button
                key={nivel.id}
                type="button"
                onClick={() => onResponder(nivel.id)}
                title={nivel.detalle}
                aria-pressed={miIntensidad === nivel.id}
                className={`toque rounded-lg border px-2.5 py-2 text-[11px] font-medium transition active:scale-[0.98] ${
                  miIntensidad === nivel.id
                    ? "border-marca bg-marca/15 text-marca"
                    : "border-borde bg-superficie-alta text-suave"
                }`}
              >
                {nivel.etiqueta}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setVerMapa((v) => !v)}
            aria-expanded={verMapa}
            className="toque mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-borde py-2.5 text-xs font-semibold text-suave transition active:scale-[0.99]"
          >
            <Icono nombre="mapa" className="h-3.5 w-3.5" />
            {verMapa ? "Ocultar" : "Ver"} mapa de intensidad
            {mapa.totalRespuestas > 0 ? ` (${mapa.totalRespuestas})` : ""}
          </button>

          {verMapa ? (
            <div className="mt-3">
              <BarraIntensidad mapa={mapa} />
            </div>
          ) : null}
        </div>
      </div>
    </Tarjeta>
  );
}
