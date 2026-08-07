import { CONFIG, integracionCadenaLista } from "../config";
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
 * Cuando el equipo de contratos entregue `arbitrum-adapter.ts`, la unica linea
 * que cambia en todo el frontend es la de abajo:
 *
 *   if (integracionCadenaLista()) return crearAdaptadorArbitrum(CONFIG);
 */
export function obtenerAdaptadorDeCadena(): AdaptadorCadena {
  if (cache) return cache;

  if (integracionCadenaLista()) {
    // Todavia no existe el adaptador real: se avisa en consola y se sigue con el
    // simulado en vez de dejar la demo en blanco delante del jurado.
    console.warn(
      "[vecino-seguro] NEXT_PUBLIC_CHAIN_MODE=arbitrum pero aun no hay ArbitrumChainAdapter. " +
        "Ver docs/SIGUIENTES-PASOS-ARBITRUM.md. Se usa el adaptador simulado.",
    );
  }

  cache = crearAdaptadorSimulado(CONFIG.chainId);
  return cache;
}
