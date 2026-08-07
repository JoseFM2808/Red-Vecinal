"use client";

import Link from "next/link";
import { useApp } from "@/components/proveedores/AppProvider";
import { Icono } from "@/components/ui/Icono";
import { tiempoRelativo } from "@/lib/formato";

/**
 * Estado vivo de la red vecinal. Son los reportes reales del dispositivo mas los
 * sembrados de demo — no hay numeros decorativos.
 */
export function ResumenRed() {
  const { reportes, cargando } = useApp();

  const ahora = Date.now();
  const ultimas24h = reportes.filter((r) => ahora - r.creadoEn < 24 * 3_600_000);
  const zonas = new Set(ultimas24h.map((r) => r.zonaId)).size;
  const corroborados = ultimas24h.filter((r) => r.corroboraciones.length > 0).length;
  const ultimo = reportes[0];

  const metricas = [
    { valor: ultimas24h.length, etiqueta: "reportes hoy" },
    { valor: zonas, etiqueta: "zonas activas" },
    { valor: corroborados, etiqueta: "corroborados" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {metricas.map((m) => (
          <div key={m.etiqueta} className="tarjeta px-2 py-3 text-center">
            <p className="text-2xl font-semibold tabular-nums text-texto">
              {cargando ? "—" : m.valor}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-tenue">{m.etiqueta}</p>
          </div>
        ))}
      </div>

      <Link
        href="/reportar"
        className="toque flex w-full items-center justify-center gap-2 rounded-2xl bg-alerta px-4 py-4 text-base font-semibold text-white shadow-lg shadow-alerta/20 transition active:scale-[0.98]"
      >
        <Icono nombre="reportar" className="h-5 w-5" />
        Reportar ahora
      </Link>

      {ultimo ? (
        <Link
          href="/mapa"
          className="tarjeta flex items-center gap-3 px-4 py-3 transition active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-superficie-alta text-suave">
            <Icono nombre="ubicacion" className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-texto">{ultimo.descripcion}</span>
            <span className="block text-xs text-tenue">
              {ultimo.zonaNombre} · {tiempoRelativo(ultimo.creadoEn, ahora)}
            </span>
          </span>
          <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-tenue" />
        </Link>
      ) : null}
    </div>
  );
}
