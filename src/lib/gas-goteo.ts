/**
 * Politica del goteo automatico de gas (ADR-051).
 *
 * La wallet embebida nace con 0 ETH: puede firmar pero no pagar. Pedirle al vecino que
 * "consiga gas de testnet" es exactamente la friccion cripto que la wallet embebida vino
 * a eliminar, asi que la plataforma gotea sola una carga minima al activar la firma.
 *
 * SOLO TESTNET. La politica se niega a existir en Arbitrum One: regalar ETH real desde
 * una ruta publica seria un grifo abierto. Si el producto llega a mainnet, esto se
 * reemplaza por patrocinio de gas (paymaster), no por un goteo mas grande.
 *
 * Funciones puras: reciben saldo y reloj, no tocan la red. La ruta pone el IO.
 */

/** La unica red donde el goteo puede operar. */
export const CHAIN_ID_GOTEO = 421614;

/**
 * 0.0005 ETH de Sepolia por goteo. Un anclaje cuesta ~0.00001: la carga cubre decenas
 * de reportes y aun asi vaciar el grifo con mil wallets costaria medio ETH de testnet.
 */
export const MONTO_GOTEO_WEI = 500_000_000_000_000n;

/** Por debajo de esto la wallet "no tiene gas" y merece goteo. */
export const UMBRAL_GOTEO_WEI = 200_000_000_000_000n;

/** Una misma wallet no recibe dos goteos en esta ventana. */
export const ESPERA_ENTRE_GOTEOS_MS = 6 * 60 * 60 * 1000;

const DIRECCION_VALIDA = /^0x[0-9a-fA-F]{40}$/;

export function esDireccionValida(direccion: string): boolean {
  return DIRECCION_VALIDA.test(direccion);
}

export type CodigoGoteo =
  | "gotear"
  | "saldo_suficiente"
  | "en_espera"
  | "direccion_invalida"
  | "red_equivocada";

export interface DecisionGoteo {
  gotear: boolean;
  codigo: CodigoGoteo;
}

/**
 * Decide si una wallet merece el goteo. El orden importa: la red equivocada gana a todo
 * (es la condicion de seguridad), despues la direccion, despues el saldo y al final la
 * ventana de espera.
 */
export function decidirGoteo(entrada: {
  chainId: number;
  direccion: string;
  saldoWei: bigint;
  ultimoGoteoEn: number | null;
  ahora: number;
}): DecisionGoteo {
  if (entrada.chainId !== CHAIN_ID_GOTEO) return { gotear: false, codigo: "red_equivocada" };
  if (!esDireccionValida(entrada.direccion)) {
    return { gotear: false, codigo: "direccion_invalida" };
  }
  if (entrada.saldoWei >= UMBRAL_GOTEO_WEI) return { gotear: false, codigo: "saldo_suficiente" };
  if (
    entrada.ultimoGoteoEn !== null &&
    entrada.ahora - entrada.ultimoGoteoEn < ESPERA_ENTRE_GOTEOS_MS
  ) {
    return { gotear: false, codigo: "en_espera" };
  }
  return { gotear: true, codigo: "gotear" };
}
