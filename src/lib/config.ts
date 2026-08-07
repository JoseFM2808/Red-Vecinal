/**
 * Configuracion leida del entorno. Un solo lugar donde `process.env` aparece.
 *
 * La beta arranca sin ninguna variable definida: todos los adaptadores caen en
 * modo simulado. Cuando el equipo de contratos publique las direcciones, se
 * cambia NEXT_PUBLIC_CHAIN_MODE=arbitrum en Vercel y nada mas.
 */

export type ModoCadena = "simulado" | "arbitrum";

const CHAIN_ID_POR_DEFECTO = 421614; // Arbitrum Sepolia

function leerModo(): ModoCadena {
  return process.env.NEXT_PUBLIC_CHAIN_MODE === "arbitrum" ? "arbitrum" : "simulado";
}

function leerChainId(): number {
  const bruto = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  return Number.isFinite(bruto) && bruto > 0 ? bruto : CHAIN_ID_POR_DEFECTO;
}

export const CONFIG = {
  version: "0.1.0-beta.1",
  modoCadena: leerModo(),
  chainId: leerChainId(),
  direcciones: {
    reportRegistry: process.env.NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS ?? "",
    tokenReward: process.env.NEXT_PUBLIC_TOKEN_REWARD_ADDRESS ?? "",
    identityEscrow: process.env.NEXT_PUBLIC_IDENTITY_ESCROW_ADDRESS ?? "",
  },
  walletAbstraction: {
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  },
  ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/",
} as const;

/** Hay contratos publicados y modo arbitrum activo. */
export function integracionCadenaLista(): boolean {
  return CONFIG.modoCadena === "arbitrum" && CONFIG.direcciones.reportRegistry !== "";
}
