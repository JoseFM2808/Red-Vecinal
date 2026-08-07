import type { Reporte } from "./tipos";

/**
 * Persistencia de reportes en el dispositivo (ADR-009).
 *
 * No hay base de datos a proposito: la fuente de verdad compartida es la cadena.
 * Cuando ReportRegistry este desplegado, este repositorio se sustituye por una
 * lectura de eventos `ReportSubmitted` por RPC — y las pantallas no cambian,
 * porque solo conocen estas cuatro funciones.
 */

const CLAVE = "vecino-seguro:reportes:v1";

function esReporte(valor: unknown): valor is Reporte {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.categoria === "string" &&
    typeof v.contentHash === "string" &&
    typeof v.creadoEn === "number" &&
    typeof v.coordenada === "object" &&
    v.coordenada !== null
  );
}

export function cargarReportes(): Reporte[] | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CLAVE);
    if (!bruto) return null;
    const parseado: unknown = JSON.parse(bruto);
    if (!Array.isArray(parseado)) return null;
    return parseado.filter(esReporte);
  } catch {
    return null;
  }
}

export function guardarReportes(reportes: readonly Reporte[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(reportes));
  } catch {
    // Cuota llena (fotos grandes) o modo privado: la sesion sigue en memoria.
    console.warn("[vecino-seguro] no se pudo guardar en el dispositivo");
  }
}

export function limpiarReportes(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento: nada que limpiar
  }
}
