import { distanciaMetros } from "./geo";
import type { Coordenada, IdCategoria, Recompensa } from "./tipos";

/**
 * Politica anti-Sybil y de recompensa.
 *
 * ESTE ARCHIVO ES LA ESPECIFICACION DE TokenReward.sol (ADR-002).
 * Las constantes de abajo son las que el equipo de contratos porta a Solidity, y los
 * tests de `antisybil.test.ts` describen los casos limite que el contrato debe respetar.
 * El cliente valida antes de gastar gas; la cadena revalida y tiene la ultima palabra.
 *
 * Que problema resuelve: el equipo descarto explicitamente recompensar "tiempo de app
 * abierta" porque se farmea sin salir de casa. La aproximacion a prueba de presencia que
 * si cabe antes del 12 de agosto es esta: limitar frecuencia por wallet y por zona, y
 * pagar completo solo cuando otro vecino distinto corrobora el hecho cerca y a tiempo
 * (ADR-014). Estar presente es caro de falsificar; tener la app abierta no.
 */

export const POLITICA_RECOMPENSA = {
  simbolo: "VSG",
  /** Recompensa base por reporte valido, antes de multiplicadores. */
  recompensaBase: 10,
  /** Maximo de reportes de una misma wallet dentro de la ventana. */
  maxReportesPorVentana: 3,
  /** Ventana del limite por wallet: 1 hora. */
  ventanaMs: 60 * 60 * 1000,
  /** Espera obligatoria entre dos reportes de la misma wallet en la misma zona: 15 min. */
  esperaMismaZonaMs: 15 * 60 * 1000,
  /** Radio dentro del cual otro reporte cuenta como corroboracion. */
  radioCorroboracionM: 300,
  /** Ventana temporal para que dos reportes se corroboren entre si: 30 min. */
  ventanaCorroboracionMs: 30 * 60 * 1000,
  /** Multiplicador cuando hay al menos una corroboracion independiente. */
  multiplicadorCorroborado: 1.5,
} as const;

/** Proyeccion minima de un reporte: lo unico que la politica necesita mirar. */
export interface ReporteEvaluable {
  autorDireccion: string;
  zonaId: string;
  categoria: IdCategoria;
  coordenada: Coordenada;
  creadoEn: number;
}

export interface EntradaEvaluacion {
  autorDireccion: string;
  zonaId: string;
  categoria: IdCategoria;
  coordenada: Coordenada;
  /** Instante de referencia. Se pasa siempre: la funcion no lee el reloj. */
  ahora: number;
  /** Reportes ya existentes en la red, propios y ajenos. */
  reportesPrevios: readonly ReporteEvaluable[];
}

export type CodigoEvaluacion = "ok" | "limite_horario" | "zona_en_espera";

export interface ResultadoEvaluacion {
  permitido: boolean;
  codigo: CodigoEvaluacion;
  mensaje: string;
  /** Epoch en el que el autor podra volver a reportar, si fue rechazado. */
  proximoPermitidoEn: number | null;
  recompensa: Recompensa;
  /** Direcciones distintas que corroboran este reporte. */
  corroboraciones: string[];
}

const mismaDireccion = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Direcciones distintas del autor que reportaron lo mismo, cerca y a tiempo.
 * Es la senal de presencia: coincidir en el espacio y en el minuto con desconocidos.
 */
export function buscarCorroboraciones(entrada: EntradaEvaluacion): string[] {
  const { ahora, autorDireccion, categoria, coordenada, reportesPrevios } = entrada;
  const encontradas = new Set<string>();

  for (const previo of reportesPrevios) {
    if (mismaDireccion(previo.autorDireccion, autorDireccion)) continue;
    if (previo.categoria !== categoria) continue;
    if (ahora - previo.creadoEn > POLITICA_RECOMPENSA.ventanaCorroboracionMs) continue;
    if (previo.creadoEn > ahora) continue;
    if (distanciaMetros(previo.coordenada, coordenada) > POLITICA_RECOMPENSA.radioCorroboracionM) {
      continue;
    }
    encontradas.add(previo.autorDireccion.toLowerCase());
  }

  return [...encontradas];
}

function construirRecompensa(corroboraciones: number): Recompensa {
  const corroborado = corroboraciones > 0;
  const multiplicador = corroborado ? POLITICA_RECOMPENSA.multiplicadorCorroborado : 1;

  return {
    monto: Math.round(POLITICA_RECOMPENSA.recompensaBase * multiplicador),
    simbolo: POLITICA_RECOMPENSA.simbolo,
    multiplicador,
    estado: corroborado ? "otorgada" : "pendiente_corroboracion",
    motivo: corroborado
      ? `${corroboraciones} vecino(s) confirmaron el hecho cerca y a tiempo: recompensa completa x${multiplicador}.`
      : "Se libera cuando otro vecino confirme el hecho a menos de 300 m dentro de 30 minutos.",
  };
}

const recompensaRechazada = (motivo: string): Recompensa => ({
  monto: 0,
  simbolo: POLITICA_RECOMPENSA.simbolo,
  multiplicador: 0,
  estado: "rechazada",
  motivo,
});

/**
 * Decide si el reporte entra y cuanto paga. Pura: mismo input, mismo output.
 * El orden de las reglas importa — primero el limite duro por wallet, luego la zona.
 */
export function evaluarReporte(entrada: EntradaEvaluacion): ResultadoEvaluacion {
  const { ahora, autorDireccion, zonaId, reportesPrevios } = entrada;

  const propios = reportesPrevios.filter(
    (r) => mismaDireccion(r.autorDireccion, autorDireccion) && r.creadoEn <= ahora,
  );

  // Regla 1 — frecuencia por wallet.
  const enVentana = propios.filter((r) => ahora - r.creadoEn < POLITICA_RECOMPENSA.ventanaMs);
  if (enVentana.length >= POLITICA_RECOMPENSA.maxReportesPorVentana) {
    const masAntiguo = Math.min(...enVentana.map((r) => r.creadoEn));
    const mensaje = `Llegaste al limite de ${POLITICA_RECOMPENSA.maxReportesPorVentana} reportes por hora. Es el freno anti-bots.`;
    return {
      permitido: false,
      codigo: "limite_horario",
      mensaje,
      proximoPermitidoEn: masAntiguo + POLITICA_RECOMPENSA.ventanaMs,
      recompensa: recompensaRechazada(mensaje),
      corroboraciones: [],
    };
  }

  // Regla 2 — espera por zona: evita repetir la misma esquina para acumular tokens.
  const enZona = propios.filter((r) => r.zonaId === zonaId);
  const ultimoEnZona = enZona.length > 0 ? Math.max(...enZona.map((r) => r.creadoEn)) : null;
  if (ultimoEnZona !== null && ahora - ultimoEnZona < POLITICA_RECOMPENSA.esperaMismaZonaMs) {
    const minutos = Math.ceil(
      (POLITICA_RECOMPENSA.esperaMismaZonaMs - (ahora - ultimoEnZona)) / 60000,
    );
    const mensaje = `Ya reportaste en esta zona hace poco. Puedes volver a reportar aqui en ${minutos} min.`;
    return {
      permitido: false,
      codigo: "zona_en_espera",
      mensaje,
      proximoPermitidoEn: ultimoEnZona + POLITICA_RECOMPENSA.esperaMismaZonaMs,
      recompensa: recompensaRechazada(mensaje),
      corroboraciones: [],
    };
  }

  const corroboraciones = buscarCorroboraciones(entrada);

  return {
    permitido: true,
    codigo: "ok",
    mensaje: "Reporte valido.",
    proximoPermitidoEn: null,
    recompensa: construirRecompensa(corroboraciones.length),
    corroboraciones,
  };
}

/**
 * Recalcula la recompensa de un reporte ya publicado cuando llega una corroboracion
 * posterior. En cadena esto corresponde a TokenReward.corroborate().
 */
export function recompensaTrasCorroborar(corroboraciones: number): Recompensa {
  return construirRecompensa(corroboraciones);
}

/** Texto de la politica para mostrarla al vecino sin que tenga que leer el codigo. */
export function describirPolitica(): string[] {
  return [
    `Recompensa base: ${POLITICA_RECOMPENSA.recompensaBase} ${POLITICA_RECOMPENSA.simbolo} por reporte valido.`,
    `Maximo ${POLITICA_RECOMPENSA.maxReportesPorVentana} reportes por hora desde la misma cuenta.`,
    `Una misma cuenta espera ${POLITICA_RECOMPENSA.esperaMismaZonaMs / 60000} minutos para volver a reportar en la misma zona.`,
    `Si otro vecino confirma el hecho a menos de ${POLITICA_RECOMPENSA.radioCorroboracionM} m dentro de ${POLITICA_RECOMPENSA.ventanaCorroboracionMs / 60000} minutos, la recompensa se multiplica por ${POLITICA_RECOMPENSA.multiplicadorCorroborado}.`,
    "Sin corroboracion la recompensa queda pendiente: se premia estar donde pasan las cosas, no tener la app abierta.",
  ];
}
