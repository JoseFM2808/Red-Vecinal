import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";

/**
 * Piezas visuales compartidas. Sin estado y sin logica de negocio.
 */

/**
 * ADR-007: todo lo que no hace de verdad lo que aparenta lleva esta etiqueta,
 * dentro del producto y no solo en el pitch.
 */
export function EtiquetaSimulado({ titulo }: { titulo?: string }) {
  return (
    <span
      title={titulo ?? "Esta pieza aun no esta conectada a un servicio real"}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ambar/40 bg-ambar/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ambar"
    >
      Simulado
    </span>
  );
}

export function EtiquetaEstado({ estado }: { estado: "listo" | "simulado" | "pendiente-equipo" }) {
  const mapa = {
    listo: { texto: "Listo", clase: "border-marca/40 bg-marca/10 text-marca" },
    simulado: { texto: "Simulado", clase: "border-ambar/40 bg-ambar/10 text-ambar" },
    "pendiente-equipo": {
      texto: "Pendiente · equipo de contratos",
      clase: "border-info/40 bg-info/10 text-info",
    },
  } as const;
  const { texto, clase } = mapa[estado];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${clase}`}
    >
      {texto}
    </span>
  );
}

export function Tarjeta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`tarjeta p-4 ${className}`}>{children}</section>;
}

export function TituloSeccion({
  children,
  accion,
}: {
  children: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="etiqueta-seccion">{children}</h2>
      {accion}
    </div>
  );
}

export function Dato({
  etiqueta,
  valor,
  mono = false,
}: {
  etiqueta: string;
  valor: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs text-tenue">{etiqueta}</span>
      <span className={`text-right text-sm text-texto ${mono ? "font-mono text-xs" : ""}`}>
        {valor}
      </span>
    </div>
  );
}

export function Aviso({
  tono = "info",
  icono,
  children,
}: {
  tono?: "info" | "alerta" | "exito";
  icono?: NombreIcono;
  children: ReactNode;
}) {
  const clases = {
    info: "border-info/30 bg-info/8 text-info",
    alerta: "border-alerta/35 bg-alerta/10 text-alerta",
    exito: "border-marca/35 bg-marca/10 text-marca",
  } as const;

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm ${clases[tono]}`}>
      {icono ? <Icono nombre={icono} className="mt-0.5 h-4 w-4 shrink-0" /> : null}
      <div className="text-texto/90">{children}</div>
    </div>
  );
}
