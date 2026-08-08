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
   * Costo de una llamada a submitReport(), en USD.
   *
   * YA NO ES ESTIMACION (ADR-012 cerrada): medido el 2026-08-09 contra el contrato
   * real en Sepolia — submitReport consume 216,804 de gas (recibo de la tx
   * 0x30f3263e...c4b1993, precio efectivo 0.02 gwei). El valor de One proyecta ese
   * gas al precio tipico de la red (~0.01 gwei) con ETH a $3,500; el de L1, a ~8 gwei.
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
    costoAnclajeUsd: 0.0076,
  },
};

/** El mismo anclaje en Ethereum L1: 216,804 de gas medidos x ~8 gwei x $3,500. */
export const COSTO_ANCLAJE_L1_USD = 6.07;

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
