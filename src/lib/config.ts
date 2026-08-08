/**
 * Configuracion leida del entorno. Un solo lugar donde `process.env` aparece.
 *
 * La beta arranca sin ninguna variable definida: todos los adaptadores caen en
 * modo simulado.
 *
 * Para pasar a Arbitrum hacen falta DOS cosas, no una: que exista
 * `ArbitrumChainAdapter` (ver docs/SIGUIENTES-PASOS-ARBITRUM.md) y que se ponga
 * NEXT_PUBLIC_CHAIN_MODE=arbitrum con las direcciones en Vercel, seguido de un
 * redeploy. Solo con las variables, la app sigue en simulado y avisa por consola.
 *
 * Recordar: las NEXT_PUBLIC_* se incrustan en el bundle durante el BUILD. Cambiarlas
 * en el panel de Vercel no afecta a un deploy ya publicado; hay que redesplegar.
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

/** Bloque de despliegue de ReportRegistry: evita paginar getLogs desde el genesis. */
function leerBloqueDespliegue(): bigint {
  const bruto = process.env.NEXT_PUBLIC_REPORT_REGISTRY_DEPLOY_BLOCK;
  try {
    const valor = bruto ? BigInt(bruto) : 0n;
    return valor >= 0n ? valor : 0n;
  } catch {
    return 0n;
  }
}

export const CONFIG = {
  version: "0.1.0-beta.2",
  modoCadena: leerModo(),
  chainId: leerChainId(),
  direcciones: {
    reportRegistry: process.env.NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS ?? "",
    tokenReward: process.env.NEXT_PUBLIC_TOKEN_REWARD_ADDRESS ?? "",
    identityEscrow: process.env.NEXT_PUBLIC_IDENTITY_ESCROW_ADDRESS ?? "",
  },
  reportRegistryDeployBlock: leerBloqueDespliegue(),
  walletAbstraction: {
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  },
  ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/",
} as const;

/** Hay contratos publicados y modo arbitrum activo. */
export function integracionCadenaLista(): boolean {
  return CONFIG.modoCadena === "arbitrum" && CONFIG.direcciones.reportRegistry !== "";
}
