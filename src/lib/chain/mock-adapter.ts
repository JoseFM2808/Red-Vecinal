import type { ReciboCadena } from "../tipos";
import { obtenerRed, urlTransaccion } from "./redes";
import type { AdaptadorCadena, EntradaAnclaje } from "./types";

/**
 * Adaptador simulado: la beta funciona sin RPC, sin faucet y sin wallet.
 *
 * No pretende ser una cadena. Lo que si hace, y por eso es util:
 *  - Deriva el hash de transaccion del contentHash real, asi que el mismo reporte
 *    produce siempre el mismo tx y la demo es reproducible.
 *  - Respeta la latencia de un rollup (~1.2 s) para que la UI de espera sea la
 *    verdadera y no haya que rehacerla cuando entre Arbitrum.
 *  - Arma el enlace al explorador con el formato real de Arbiscan.
 *  - Se marca `simulado: true`, y la UI lo etiqueta a la vista (ADR-007).
 */

const LATENCIA_MS = 1200;

const dormir = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Hash de transaccion derivado del contenido: determinista, no aleatorio. */
function txDerivado(contentHash: string): string {
  const limpio = contentHash.replace(/^0x/, "");
  const invertido = limpio.split("").reverse().join("");
  return `0x${invertido.padEnd(64, "0").slice(0, 64)}`;
}

/** Numero de bloque plausible y estable para el mismo reporte. */
function bloqueDerivado(contentHash: string): number {
  const semilla = parseInt(contentHash.slice(2, 10), 16);
  return 90_000_000 + (semilla % 1_000_000);
}

export function crearAdaptadorSimulado(chainId: number): AdaptadorCadena {
  const red = obtenerRed(chainId);

  return {
    id: "simulado",
    red,
    simulado: true,
    explicacion:
      "Los contratos aun no estan desplegados. El anclaje se simula con la misma latencia y el mismo formato de comprobante que tendra en Arbitrum.",

    async anclarReporte(entrada: EntradaAnclaje): Promise<ReciboCadena> {
      await dormir(LATENCIA_MS);
      const txHash = txDerivado(entrada.contentHash);

      return {
        txHash,
        bloque: bloqueDerivado(entrada.contentHash),
        chainId: red.chainId,
        urlExplorador: urlTransaccion(red.chainId, txHash),
        costoGasUsd: red.esTestnet ? 0 : red.costoAnclajeUsd,
        confirmadoEn: Date.now(),
        simulado: true,
      };
    },

    async saldoRecompensas(): Promise<number> {
      // El saldo real lo lleva TokenReward.balanceOf(). En modo simulado lo calcula
      // la app sumando las recompensas otorgadas, para no inventar un numero aparte.
      return 0;
    },
  };
}
