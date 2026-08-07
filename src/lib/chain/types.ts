import type { ReciboCadena } from "../tipos";
import type { RedArbitrum } from "./redes";

/**
 * LA COSTURA CON ARBITRUM (ADR-001).
 *
 * El equipo de contratos implementa esta misma interfaz con viem y el frontend
 * no cambia una linea. Ninguna pantalla importa un adaptador concreto: todas
 * llaman a `obtenerAdaptadorDeCadena()`.
 *
 * Guia de implementacion: docs/SIGUIENTES-PASOS-ARBITRUM.md
 */

/** Payload exacto de ReportRegistry.submitReport(). */
export interface EntradaAnclaje {
  contentHash: string;
  latE6: number;
  lngE6: number;
  categoriaIndice: number;
  zonaId: string;
  cid: string | null;
}

export interface AdaptadorCadena {
  readonly id: "simulado" | "arbitrum";
  readonly red: RedArbitrum;
  /** true mientras no se este escribiendo de verdad en Arbitrum. */
  readonly simulado: boolean;
  /** Motivo por el que se esta usando este adaptador, para mostrarlo en la UI. */
  readonly explicacion: string;

  /** Escribe el hash del reporte en la cadena y devuelve el comprobante. */
  anclarReporte(entrada: EntradaAnclaje): Promise<ReciboCadena>;

  /** Saldo de VSG de una direccion. */
  saldoRecompensas(direccion: string): Promise<number>;
}
