import type { RespuestaIntensidad } from "./sismos-oficiales";

/**
 * Respuestas de "como lo sentiste", guardadas en el dispositivo (ADR-042).
 *
 * Misma limitacion que los reportes: hoy son locales. Cuando ReportRegistry este
 * desplegado, estas respuestas viajan como reportes de categoria `sismo_sentido`
 * (indiceContrato 2, ya escrito en cadena) llevando el codigo del sismo del IGP,
 * y el mapa de intensidad se reconstruye desde los eventos igual que el resto.
 */

const CLAVE = "vecino-seguro:sismos-intensidad:v1";

/** Cuantas respuestas se conservan. Mas alla, ya no es alerta sino arqueologia. */
const MAX_GUARDADAS = 200;

export function cargarRespuestas(): RespuestaIntensidad[] {
  if (typeof window === "undefined") return [];

  try {
    const bruto = window.localStorage.getItem(CLAVE);
    if (!bruto) return [];
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? (datos as RespuestaIntensidad[]) : [];
  } catch {
    // localStorage bloqueado o dato corrupto: se empieza de cero, sin romper la app.
    return [];
  }
}

export function guardarRespuesta(respuesta: RespuestaIntensidad): RespuestaIntensidad[] {
  const previas = cargarRespuestas();
  // Una persona responde una vez por sismo; volver a responder corrige la anterior.
  const sinDuplicar = previas.filter((r) => r.sismoId !== respuesta.sismoId);
  const siguientes = [respuesta, ...sinDuplicar].slice(0, MAX_GUARDADAS);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(siguientes));
    } catch {
      console.warn("[vecino-seguro] no se pudo guardar la respuesta de intensidad");
    }
  }

  return siguientes;
}

export function limpiarRespuestas(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer: si no se puede borrar, tampoco se pudo guardar.
  }
}
