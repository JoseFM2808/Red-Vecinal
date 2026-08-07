/**
 * Modelo de dominio de Vecino Seguro.
 *
 * Estos tipos son el vocabulario compartido entre el frontend y los contratos.
 * Lo que aqui se llama `contentHash` es literalmente el `bytes32` que recibe
 * ReportRegistry.submitReport(). Cambiar un nombre aqui implica hablar con el
 * equipo de contratos, no solo refactorizar.
 */

export type IdCategoria = "actividad_sospechosa" | "infraestructura";

export type DestinoEscalamiento = "serenazgo" | "policia" | "ambulancia";

/** Coordenada en grados decimales. Siempre truncada antes de salir del dispositivo. */
export interface Coordenada {
  lat: number;
  lng: number;
}

/** Estado del reporte respecto de la cadena. */
export type EstadoAnclaje = "local" | "anclando" | "anclado" | "error";

/** Comprobante devuelto por el adaptador de cadena tras anclar un reporte. */
export interface ReciboCadena {
  txHash: string;
  bloque: number;
  chainId: number;
  urlExplorador: string;
  /** Costo estimado del anclaje. En Arbitrum son fracciones de centavo: ese es el punto. */
  costoGasUsd: number;
  confirmadoEn: number;
  /** true mientras corra el adaptador simulado. Se muestra en la UI. */
  simulado: boolean;
}

export type EstadoRecompensa = "pendiente_corroboracion" | "otorgada" | "rechazada";

export interface Recompensa {
  monto: number;
  simbolo: string;
  multiplicador: number;
  estado: EstadoRecompensa;
  /** Explicacion en lenguaje llano de por que ese monto. Se muestra al vecino. */
  motivo: string;
}

export interface Evidencia {
  /** CID de IPFS. En modo simulado se deriva del hash del archivo. */
  cid: string;
  /** Data URL reducida para mostrar en el mapa sin volver a descargar nada. */
  miniatura: string | null;
  bytes: number;
  simulado: boolean;
}

export interface Escalamiento {
  folio: string;
  destino: DestinoEscalamiento;
  creadoEn: number;
  simulado: boolean;
  mensaje: string;
}

export interface Reporte {
  id: string;
  categoria: IdCategoria;
  descripcion: string;
  /** Coordenada ya truncada a ~11 m. La exacta nunca se guarda ni se transmite. */
  coordenada: Coordenada;
  /** Celda de ~550 m usada por la politica anti-Sybil y por el contrato. */
  zonaId: string;
  /** Nombre legible de la zona, solo para la interfaz. */
  zonaNombre: string;
  creadoEn: number;
  autorSeudonimo: string;
  autorDireccion: string;
  contentHash: string;
  evidencia: Evidencia | null;
  cadena: ReciboCadena | null;
  estadoAnclaje: EstadoAnclaje;
  recompensa: Recompensa;
  /** Direcciones de otros vecinos que confirmaron el hecho. */
  corroboraciones: string[];
  escalamiento: Escalamiento | null;
  /** Dato sembrado para que la red se vea activa en la demo. */
  esSemilla: boolean;
}

export interface Identidad {
  seudonimo: string;
  direccion: string;
  creadoEn: number;
  /** true mientras no este integrado Privy/Web3Auth: la wallet no firma de verdad. */
  simulado: boolean;
}
