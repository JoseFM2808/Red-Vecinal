/**
 * Redes de Arbitrum soportadas.
 *
 * El hackathon corre en Arbitrum Sepolia; el destino de produccion es Arbitrum One.
 * El costo de anclaje es el argumento central del proyecto: un reporte por vecino
 * por dia solo cierra si escribir en cadena cuesta fracciones de centavo.
 */

export interface RedArbitrum {
  chainId: number;
  nombre: string;
  nombreCorto: string;
  moneda: string;
  rpcPublico: string;
  explorador: string;
  esTestnet: boolean;
  /**
   * Costo estimado de una llamada a submitReport(), en USD.
   * Estimacion, no medicion: reemplazar con el dato real cuando el contrato
   * este desplegado (ADR-012, pendiente de validacion del equipo de contratos).
   */
  costoAnclajeUsd: number;
}

export const REDES: Record<number, RedArbitrum> = {
  421614: {
    chainId: 421614,
    nombre: "Arbitrum Sepolia",
    nombreCorto: "Arb Sepolia",
    moneda: "ETH",
    rpcPublico: "https://sepolia-rollup.arbitrum.io/rpc",
    explorador: "https://sepolia.arbiscan.io",
    esTestnet: true,
    costoAnclajeUsd: 0,
  },
  42161: {
    chainId: 42161,
    nombre: "Arbitrum One",
    nombreCorto: "Arbitrum One",
    moneda: "ETH",
    rpcPublico: "https://arb1.arbitrum.io/rpc",
    explorador: "https://arbiscan.io",
    esTestnet: false,
    costoAnclajeUsd: 0.0021,
  },
};

/** Costo del mismo anclaje en Ethereum L1, para la comparacion del pitch. */
export const COSTO_ANCLAJE_L1_USD = 1.85;

export function obtenerRed(chainId: number): RedArbitrum {
  const red = REDES[chainId];
  if (red) return red;
  const fallback = REDES[421614];
  if (!fallback) throw new Error("Catalogo de redes vacio");
  return fallback;
}

export function urlTransaccion(chainId: number, txHash: string): string {
  return `${obtenerRed(chainId).explorador}/tx/${txHash}`;
}

export function urlDireccion(chainId: number, direccion: string): string {
  return `${obtenerRed(chainId).explorador}/address/${direccion}`;
}
