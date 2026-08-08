"use client";

import { useEffect, useRef } from "react";
import { Icono } from "@/components/ui/Icono";
import { tiempoRelativo } from "@/lib/formato";
import { NIVELES_INTENSIDAD } from "@/lib/sismos-oficiales";
import { useSismosOficiales } from "./useSismosOficiales";

/**
 * Alarma de sismo desde fuente oficial (ADR-042).
 *
 * Reemplaza al panel comunitario "lo sentiste" de ADR-019. El orden ahora es el real:
 * el IGP detecta, la app alerta a quien esta dentro del radio de la magnitud, y el
 * vecino responde COMO lo sintio — esa respuesta alimenta el mapa de intensidad.
 *
 * La app sigue sin detectar nada. La deteccion es del IGP y la tarjeta lo dice.
 */

/** Recordar por que sismos ya se vibro, para no re-alarmar en cada refresco. */
const CLAVE_ALARMADOS = "vecino-seguro:sismos-alarmados:v1";

function yaAlarmado(sismoId: string): boolean {
  try {
    const bruto = window.sessionStorage.getItem(CLAVE_ALARMADOS);
    return bruto ? (JSON.parse(bruto) as string[]).includes(sismoId) : false;
  } catch {
    return false;
  }
}

function marcarAlarmado(sismoId: string): void {
  try {
    const bruto = window.sessionStorage.getItem(CLAVE_ALARMADOS);
    const lista = bruto ? (JSON.parse(bruto) as string[]) : [];
    window.sessionStorage.setItem(
      CLAVE_ALARMADOS,
      JSON.stringify([...new Set([...lista, sismoId])].slice(-20)),
    );
  } catch {
    // sessionStorage bloqueado: la alarma sonara de nuevo al refrescar. Molesto, no roto.
  }
}

export function AlarmaSismo() {
  const { alertaActiva, responder } = useSismosOficiales();
  const vibrado = useRef(false);

  // Vibracion al aparecer la alerta, una vez por sismo. Nunca es la unica senal:
  // iOS Safari no la soporta, y por eso la tarjeta ocupa la parte alta de la pantalla.
  useEffect(() => {
    if (!alertaActiva || vibrado.current) return;
    if (yaAlarmado(alertaActiva.sismo.id)) return;

    marcarAlarmado(alertaActiva.sismo.id);
    vibrado.current = true;
    if ("vibrate" in navigator) navigator.vibrate([260, 120, 260]);
  }, [alertaActiva]);

  if (!alertaActiva) return null;

  const { sismo, alerta, miIntensidad } = alertaActiva;

  return (
    <div
      role="alert"
      className="aparecer rounded-2xl border border-alerta/45 bg-alerta/10 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 animate-pulse place-items-center rounded-xl bg-alerta/20 text-alerta">
          <Icono nombre="sismo" className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-texto">
            Sismo de {sismo.magnitud.toFixed(1)} {sismo.tipoMagnitud} ·{" "}
            {tiempoRelativo(sismo.ocurridoEn)}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-suave">
            {sismo.referencia}
            {alerta.distanciaKm !== null
              ? ` — a ${alerta.distanciaKm} km de ti, hacia el ${alerta.rumbo ?? ""}`
              : ""}
          </p>
          <p className="mt-1 text-[11px] text-tenue">
            Detectado por el {sismo.fuente}. La app avisa, no mide.
          </p>

          {miIntensidad ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-marca">
              <Icono nombre="check" className="h-3.5 w-3.5" />
              Gracias. Tu respuesta ya cuenta para el mapa de intensidad.
            </p>
          ) : (
            <>
              <p className="mt-2.5 text-xs font-medium text-texto">¿Como lo sentiste?</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {NIVELES_INTENSIDAD.map((nivel) => (
                  <button
                    key={nivel.id}
                    type="button"
                    onClick={() => responder(sismo.id, nivel.id)}
                    title={nivel.detalle}
                    className="toque rounded-lg border border-borde bg-superficie px-2.5 py-2 text-[11px] font-medium text-suave transition active:scale-[0.98]"
                  >
                    {nivel.etiqueta}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
