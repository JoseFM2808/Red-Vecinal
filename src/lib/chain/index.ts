import { CONFIG, integracionCadenaLista } from "../config";
import { crearAdaptadorArbitrum } from "./arbitrum-adapter";
import { crearAdaptadorSimulado } from "./mock-adapter";
import { obtenerProveedorInyectado } from "./proveedor-inyectado";
import type { AdaptadorCadena } from "./types";

export type { AdaptadorCadena, EntradaAnclaje } from "./types";
export { COSTO_ANCLAJE_L1_USD, obtenerRed, urlDireccion, urlTransaccion } from "./redes";
export type { RedArbitrum } from "./redes";

let cache: AdaptadorCadena | null = null;

/**
 * Con el modo arbitrum activo, quien NO tiene wallet inyectada no puede firmar (ADR-049).
 * Sin este respaldo, el boton de publicar moria con un error de MetaMask para todos los
 * usuarios de solo-Google — que son casi todos en la prueba real. El anclaje cae al
 * comprobante simulado (que la interfaz ya etiqueta como tal en el recibo), el reporte
 * se publica en la red local igual, y las LECTURAS siguen siendo reales.
 *
 * La decision se toma por llamada, no al construir: si la persona instala la wallet a
 * mitad de sesion, el siguiente reporte ya ancla de verdad. Cerrar el hueco de verdad
 * (relevo del servidor o Privy) esta en docs/SIGUIENTES-PASOS-ARBITRUM.md §8.
 */
function conRespaldoDeFirma(real: AdaptadorCadena): AdaptadorCadena {
  const respaldo = crearAdaptadorSimulado(CONFIG.chainId);

  return {
    ...real,
    async anclarReporte(entrada) {
      if (!obtenerProveedorInyectado()) {
        console.warn(
          "[vecino-seguro] sin wallet inyectada: este reporte lleva comprobante simulado (ADR-049).",
        );
        return respaldo.anclarReporte(entrada);
      }
      return real.anclarReporte(entrada);
    },
  };
}

/**
 * Unico punto de entrada a la cadena. Las pantallas llaman a esto y nunca
 * importan un adaptador concreto.
 *
 * Con las direcciones cargadas (ADR-030), se intenta el adaptador real. Si
 * construirlo falla, se cae al simulado en vez de dejar la demo en blanco
 * delante del jurado.
 */
export function obtenerAdaptadorDeCadena(): AdaptadorCadena {
  if (cache) return cache;

  if (integracionCadenaLista()) {
    try {
      cache = conRespaldoDeFirma(crearAdaptadorArbitrum(CONFIG));
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
