import { CONFIG, integracionCadenaLista } from "../config";
import { crearAdaptadorArbitrum } from "./arbitrum-adapter";
import { crearAdaptadorSimulado } from "./mock-adapter";
import type { AdaptadorCadena } from "./types";

export type { AdaptadorCadena, EntradaAnclaje } from "./types";
export { COSTO_ANCLAJE_L1_USD, obtenerRed, urlDireccion, urlTransaccion } from "./redes";
export type { RedArbitrum } from "./redes";

let cache: AdaptadorCadena | null = null;

/**
 * Unico punto de entrada a la cadena. Las pantallas llaman a esto y nunca
 * importan un adaptador concreto.
 *
 * Con las direcciones cargadas (ADR-030), se intenta el adaptador real. Si
 * construirlo falla — por ejemplo, sin wallet inyectada en el navegador todavia —
 * se cae al simulado en vez de dejar la demo en blanco delante del jurado.
 */
export function obtenerAdaptadorDeCadena(): AdaptadorCadena {
  if (cache) return cache;

  if (integracionCadenaLista()) {
    try {
      cache = crearAdaptadorArbitrum(CONFIG);
      return cache;
    } catch (error) {
      console.warn(
        "[vecino-seguro] NEXT_PUBLIC_CHAIN_MODE=arbitrum pero el adaptador real no se pudo crear. " +
          "Se usa el adaptador simulado.",
        error,
      );
    }
  }

  cache = crearAdaptadorSimulado(CONFIG.chainId);
  return cache;
}
