import { distanciaMetros } from "./geo";
import type { Coordenada, IdCategoria, Reporte } from "./tipos";

/**
 * Circulo de cuidado (ADR-101).
 *
 * La idea: alguien de tu familia comparte su ubicacion contigo. Cuando ocurre un
 * reporte cerca de DONDE ESTA ESA PERSONA — no donde estas tu — te llega un aviso,
 * y tienes su numero a un toque para llamarla.
 *
 * Es una funcionalidad exploratoria: vive en una rama aparte y no esta en el alcance
 * del MVP del 12 de agosto.
 *
 * Lo que si es real aqui: la geometria, las reglas de frescura y la deduplicacion de
 * avisos son funciones puras con tests. Lo simulado es el transporte — hoy la ubicacion
 * del contacto se mueve localmente; en la version real llegaria desde su dispositivo.
 */

/** Pasado este tiempo sin recibir posicion, se considera que no hay senal. */
export const FRESCURA_UBICACION_MS = 15 * 60 * 1000;

/** Los reportes mas viejos que esto ya no generan aviso. */
export const VENTANA_AVISO_MS = 30 * 60 * 1000;

/** Radio por defecto alrededor del contacto. */
export const RADIO_AVISO_POR_DEFECTO_M = 500;

export const RADIOS_DISPONIBLES_M = [200, 500, 1000, 2000] as const;

export interface ContactoCirculo {
  id: string;
  nombre: string;
  /** Se muestra tal cual y alimenta el enlace tel:. Nunca sale del dispositivo. */
  telefono: string;
  relacion: string;
  /** Alias del contacto en la red. No revela su identidad real. */
  alias: string;
  /** El contacto acepto compartir su ubicacion contigo. */
  compartiendo: boolean;
  coordenada: Coordenada | null;
  /** Ultima vez que llego su posicion. */
  actualizadoEn: number;
  radioAvisoM: number;
  /**
   * De donde sale su posicion (ADR-046):
   *  - "vinculo": llega cifrada por el canal real; vinculoId y clave abren los sobres.
   *  - "demo": contacto sembrado, se mueve con la simulacion (solo con datos de demo).
   *  - "manual" (o ausente, datos viejos): solo nombre y telefono; sin posicion hasta
   *    que la persona acepte un vinculo. Ya no se le inventa movimiento.
   */
  origen?: "vinculo" | "demo" | "manual";
  /** Solo con origen "vinculo". */
  vinculoId?: string;
  /** Clave AES base64url del vinculo. Vive solo en este dispositivo. */
  clave?: string;
  /** El contacto corto el compartir (tumba recibida). Distinto de nunca haber compartido. */
  dejoDeCompartir?: boolean;
}

export type EstadoContacto = "sin_compartir" | "sin_senal" | "en_linea";

export interface AvisoCercania {
  /** Clave estable contacto+reporte: evita avisar dos veces por lo mismo. */
  clave: string;
  contactoId: string;
  contactoNombre: string;
  contactoTelefono: string;
  reporteId: string;
  categoria: IdCategoria;
  distanciaM: number;
  zonaNombre: string;
  descripcion: string;
  creadoEn: number;
}

export function estadoDeContacto(contacto: ContactoCirculo, ahora: number): EstadoContacto {
  if (!contacto.compartiendo || !contacto.coordenada) return "sin_compartir";
  if (ahora - contacto.actualizadoEn > FRESCURA_UBICACION_MS) return "sin_senal";
  return "en_linea";
}

export const claveAviso = (contactoId: string, reporteId: string) => `${contactoId}:${reporteId}`;

/**
 * Reportes recientes que caen dentro del radio de algun contacto que este compartiendo.
 *
 * `yaAvisados` son las claves ya notificadas: la funcion no lleva estado, se lo pasa
 * quien la llama. Asi es pura y se puede testear sin simular el paso del tiempo.
 */
export function evaluarAvisos(
  contactos: readonly ContactoCirculo[],
  reportes: readonly Reporte[],
  ahora: number,
  yaAvisados: ReadonlySet<string>,
): AvisoCercania[] {
  const avisos: AvisoCercania[] = [];

  for (const contacto of contactos) {
    if (estadoDeContacto(contacto, ahora) !== "en_linea") continue;
    const posicion = contacto.coordenada;
    if (!posicion) continue;

    for (const reporte of reportes) {
      if (reporte.creadoEn > ahora) continue;
      if (ahora - reporte.creadoEn > VENTANA_AVISO_MS) continue;

      const clave = claveAviso(contacto.id, reporte.id);
      if (yaAvisados.has(clave)) continue;

      const distancia = distanciaMetros(posicion, reporte.coordenada);
      if (distancia > contacto.radioAvisoM) continue;

      avisos.push({
        clave,
        contactoId: contacto.id,
        contactoNombre: contacto.nombre,
        contactoTelefono: contacto.telefono,
        reporteId: reporte.id,
        categoria: reporte.categoria,
        distanciaM: Math.round(distancia),
        zonaNombre: reporte.zonaNombre,
        descripcion: reporte.descripcion,
        creadoEn: reporte.creadoEn,
      });
    }
  }

  // Lo mas cercano primero: es lo que mas urge mirar.
  return avisos.sort((a, b) => a.distanciaM - b.distanciaM);
}

/** Reporte mas cercano a un contacto, para mostrar su situacion aunque no haya aviso nuevo. */
export function reporteMasCercano(
  contacto: ContactoCirculo,
  reportes: readonly Reporte[],
  ahora: number,
): { reporte: Reporte; distanciaM: number } | null {
  const posicion = contacto.coordenada;
  if (!posicion) return null;

  let mejor: { reporte: Reporte; distanciaM: number } | null = null;

  for (const reporte of reportes) {
    if (reporte.creadoEn > ahora) continue;
    if (ahora - reporte.creadoEn > VENTANA_AVISO_MS) continue;

    const distanciaM = Math.round(distanciaMetros(posicion, reporte.coordenada));
    if (!mejor || distanciaM < mejor.distanciaM) mejor = { reporte, distanciaM };
  }

  return mejor;
}

/** Normaliza el telefono para el enlace tel:, conservando el + inicial. */
export function telefonoParaLlamar(telefono: string): string {
  const limpio = telefono.replace(/[^\d+]/g, "");
  return limpio.startsWith("+") ? limpio : limpio.replace(/\+/g, "");
}
