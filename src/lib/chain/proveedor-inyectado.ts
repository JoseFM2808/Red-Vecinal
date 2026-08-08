import type { EIP1193Provider } from "viem";

/**
 * Punto de reemplazo aislado (ADR-030, cerrado en ADR-050).
 *
 * El adaptador de Arbitrum firma con lo que exponga esta funcion. Hay dos fuentes,
 * en orden de preferencia:
 *
 *  1. El proveedor EMBEBIDO que registra la integracion de Privy (ADR-050): la wallet
 *     que Privy crea para quien entro con Google y no tiene MetaMask. Se registra en
 *     runtime porque nace de un hook de React, no de un global del navegador.
 *  2. `window.ethereum` (MetaMask u otra extension), el comportamiento original.
 *
 * El embebido gana: si alguien tiene ambos, la experiencia sin popups de extension
 * es la que el producto quiere. Quien prefiera su MetaMask puede simplemente no
 * activar la firma embebida en Cuenta.
 */

let proveedorEmbebido: EIP1193Provider | null = null;

/** Lo llama el puente de Privy cuando la wallet embebida esta lista (o se va). */
export function registrarProveedorEmbebido(proveedor: EIP1193Provider | null): void {
  proveedorEmbebido = proveedor;
}

export function obtenerProveedorInyectado(): EIP1193Provider | null {
  if (proveedorEmbebido) return proveedorEmbebido;
  if (typeof window === "undefined") return null;
  const proveedor = (window as { ethereum?: EIP1193Provider }).ethereum;
  return proveedor ?? null;
}
