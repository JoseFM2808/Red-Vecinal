import { evaluarReporte, type CodigoEvaluacion, type ReporteEvaluable } from "./antisybil";
import { obtenerCategoria } from "./categorias";
import type { AdaptadorCadena } from "./chain";
import { aMicrogrados, truncarCoordenada, zonaIdDe } from "./geo";
import { calcularContentHash } from "./hash";
import type { AdaptadorEvidencia } from "./storage";
import type { Coordenada, Evidencia, IdCategoria, Identidad, Reporte } from "./tipos";
import { nombreDeZona } from "./zonas";

/**
 * Orquestador del reporte: la tuberia completa, en un solo lugar y sin React.
 *
 *   validar -> subir evidencia -> hashear -> anclar en cadena -> guardar
 *
 * Recibe los adaptadores por parametro, asi que se puede ejecutar en un test sin
 * navegador y sin cadena. La UI solo se suscribe a `onEtapa` para mostrar en que
 * paso va — y esas etapas son las reales, no una animacion decorativa.
 */

export type EtapaFlujo =
  | "validando"
  | "subiendo_evidencia"
  | "calculando_hash"
  | "anclando"
  | "listo";

export interface DependenciasFlujo {
  cadena: AdaptadorCadena;
  evidencia: AdaptadorEvidencia;
  ahora: () => number;
}

export interface SolicitudReporte {
  categoria: IdCategoria;
  descripcion: string;
  /** Coordenada cruda del GPS. Se trunca aqui, antes de cualquier otra cosa. */
  coordenada: Coordenada;
  archivo: File | null;
  identidad: Identidad;
  reportesPrevios: readonly Reporte[];
  /**
   * Distrito elegido a mano por el vecino cuando la deteccion automatica se equivoca
   * (ADR-020). Solo cambia la ETIQUETA que se muestra y se envia a la autoridad.
   * `zonaId`, que es lo que usa la politica anti-Sybil, se sigue derivando de la
   * coordenada: si fuera editable, seria un modo trivial de saltarse el limite por zona.
   */
  zonaNombreManual?: string | null;
}

export type ResultadoFlujo =
  | { ok: true; reporte: Reporte }
  | {
      ok: false;
      codigo: CodigoEvaluacion | "error";
      mensaje: string;
      proximoPermitidoEn: number | null;
    };

const aEvaluable = (r: Reporte): ReporteEvaluable => ({
  autorDireccion: r.autorDireccion,
  zonaId: r.zonaId,
  categoria: r.categoria,
  coordenada: r.coordenada,
  creadoEn: r.creadoEn,
});

export async function crearReporte(
  solicitud: SolicitudReporte,
  deps: DependenciasFlujo,
  onEtapa: (etapa: EtapaFlujo) => void = () => {},
): Promise<ResultadoFlujo> {
  const ahora = deps.ahora();
  const coordenada = truncarCoordenada(solicitud.coordenada);
  const zonaId = zonaIdDe(coordenada);

  // 1. Validar contra la politica anti-Sybil ANTES de subir nada ni gastar gas.
  onEtapa("validando");
  const evaluacion = evaluarReporte({
    autorDireccion: solicitud.identidad.direccion,
    zonaId,
    categoria: solicitud.categoria,
    coordenada,
    ahora,
    reportesPrevios: solicitud.reportesPrevios.map(aEvaluable),
  });

  if (!evaluacion.permitido) {
    return {
      ok: false,
      codigo: evaluacion.codigo,
      mensaje: evaluacion.mensaje,
      proximoPermitidoEn: evaluacion.proximoPermitidoEn,
    };
  }

  try {
    // 2. La evidencia va a IPFS; la foto nunca pasa por un servidor nuestro.
    let evidencia: Evidencia | null = null;
    if (solicitud.archivo) {
      onEtapa("subiendo_evidencia");
      evidencia = await deps.evidencia.subir(solicitud.archivo);
    }

    // 3. Hash canonico: lo unico del contenido que llegara a la cadena.
    onEtapa("calculando_hash");
    const contentHash = await calcularContentHash({
      cid: evidencia?.cid ?? null,
      coordenada,
      categoria: solicitud.categoria,
      creadoEnSegundos: Math.floor(ahora / 1000),
      autor: solicitud.identidad.direccion,
    });

    // 4. Anclaje en Arbitrum (simulado mientras no haya contratos desplegados).
    onEtapa("anclando");
    const categoria = obtenerCategoria(solicitud.categoria);
    const recibo = await deps.cadena.anclarReporte({
      contentHash,
      latE6: aMicrogrados(coordenada.lat),
      lngE6: aMicrogrados(coordenada.lng),
      categoriaIndice: categoria.indiceContrato,
      zonaId,
      cid: evidencia?.cid ?? null,
    });

    onEtapa("listo");

    return {
      ok: true,
      reporte: {
        id: `${ahora.toString(36)}-${contentHash.slice(2, 10)}`,
        categoria: solicitud.categoria,
        descripcion: solicitud.descripcion.trim(),
        coordenada,
        zonaId,
        zonaNombre: solicitud.zonaNombreManual?.trim() || nombreDeZona(coordenada),
        creadoEn: ahora,
        autorSeudonimo: solicitud.identidad.seudonimo,
        autorDireccion: solicitud.identidad.direccion,
        contentHash,
        evidencia,
        cadena: recibo,
        estadoAnclaje: "anclado",
        recompensa: evaluacion.recompensa,
        corroboraciones: evaluacion.corroboraciones,
        escalamiento: null,
        esSemilla: false,
      },
    };
  } catch (error) {
    return {
      ok: false,
      codigo: "error",
      mensaje:
        error instanceof Error
          ? `No se pudo completar el reporte: ${error.message}`
          : "No se pudo completar el reporte.",
      proximoPermitidoEn: null,
    };
  }
}

/** Texto de cada etapa, para la pantalla de progreso. */
export const TEXTO_ETAPA: Record<EtapaFlujo, string> = {
  validando: "Revisando limites anti-bots",
  subiendo_evidencia: "Subiendo evidencia a IPFS",
  calculando_hash: "Calculando hash del reporte",
  anclando: "Anclando en Arbitrum",
  listo: "Reporte publicado",
};
