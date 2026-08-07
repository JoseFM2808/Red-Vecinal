import { aMicrogrados } from "./geo";
import type { Coordenada, IdCategoria } from "./tipos";

/**
 * Hash canonico del reporte: lo unico del contenido que llega a la cadena.
 *
 * El problema que resuelve: si dos clientes serializan el mismo reporte con las
 * claves en otro orden, producen hashes distintos y la prueba deja de servir.
 * Por eso la serializacion es explicita, ordenada y con enteros — nunca
 * `JSON.stringify(objeto)` a secas.
 *
 * ADR-003: SHA-256 (Web Crypto, sin dependencias) produce 32 bytes, que entran
 * directo como `bytes32 contentHash`. Si el equipo de contratos prefiere keccak256,
 * se cambia solo `calcularContentHash`.
 */

export interface EntradaHash {
  /** CID de la evidencia en IPFS, o null si el reporte no lleva foto. */
  cid: string | null;
  coordenada: Coordenada;
  categoria: IdCategoria;
  /** Epoch en segundos: es lo que guarda el contrato (`uint64 timestamp`). */
  creadoEnSegundos: number;
  /** Direccion pseudonima del autor. No revela identidad real. */
  autor: string;
}

/**
 * Serializacion canonica: claves en orden fijo, coordenadas en microgrados enteros.
 * El resultado es el string exacto que se hashea, y cualquiera puede reconstruirlo.
 */
export function serializarCanonico(entrada: EntradaHash): string {
  const campos: Array<[string, string | number]> = [
    ["autor", entrada.autor.toLowerCase()],
    ["categoria", entrada.categoria],
    ["cid", entrada.cid ?? ""],
    ["latE6", aMicrogrados(entrada.coordenada.lat)],
    ["lngE6", aMicrogrados(entrada.coordenada.lng)],
    ["ts", Math.floor(entrada.creadoEnSegundos)],
  ];
  return campos.map(([clave, valor]) => `${clave}=${valor}`).join("|");
}

function aHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 del payload canonico, con prefijo 0x. 32 bytes exactos. */
export async function calcularContentHash(entrada: EntradaHash): Promise<string> {
  const datos = new TextEncoder().encode(serializarCanonico(entrada));
  const digest = await crypto.subtle.digest("SHA-256", datos);
  return `0x${aHex(digest)}`;
}

/** SHA-256 de un archivo, base del CID en el adaptador de evidencia simulado. */
export async function hashDeArchivo(archivo: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", archivo);
  return aHex(digest);
}
