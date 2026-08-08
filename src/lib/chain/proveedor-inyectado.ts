import type { EIP1193Provider } from "viem";

/**
 * Punto de reemplazo aislado (ADR-030).
 *
 * El adaptador de Arbitrum firma con lo que exponga esta funcion. Hoy es
 * `window.ethereum` (MetaMask u otra wallet inyectada) porque el equipo aun no
 * decidio Privy vs Web3Auth. Una wallet embebida expone el mismo tipo de
 * proveedor EIP-1193, asi que cuando se decida, esta funcion es lo unico que
 * cambia — el adaptador no se toca.
 */
export function obtenerProveedorInyectado(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  const proveedor = (window as { ethereum?: EIP1193Provider }).ethereum;
  return proveedor ?? null;
}
