import type { Coordenada } from "./tipos";
import type { ContactoCirculo } from "./circulo";

/**
 * Movimiento simulado de los contactos.
 *
 * ESTO ES LO UNICO FALSO DE LA FUNCIONALIDAD. En la version real, la posicion llega
 * desde el dispositivo del contacto y este archivo desaparece: el resto — geometria,
 * frescura, avisos, deduplicacion — ya funciona con datos reales.
 *
 * Es determinista a proposito: la misma semilla y el mismo instante dan siempre la
 * misma posicion. Nada de Math.random, para que una demo se pueda repetir igual.
 */

/** Amplitud del vagabundeo, en grados. 0.0035 ~ 390 m. */
const AMPLITUD_GRADOS = 0.0035;

/** Cada cuanto se recalculan las posiciones. */
export const INTERVALO_SIMULACION_MS = 20_000;

/** Semilla estable a partir del id del contacto (hash FNV-1a de 32 bits). */
export function semillaDeTexto(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

/**
 * Posicion del contacto en el instante `ahora`, vagando alrededor de su punto base.
 * Dos senoidales con periodos distintos evitan que el recorrido sea un circulo obvio.
 */
export function posicionSimulada(base: Coordenada, semilla: number, ahora: number): Coordenada {
  const minutos = ahora / 60_000;
  const fase = semilla * Math.PI * 2;

  return {
    lat: base.lat + AMPLITUD_GRADOS * Math.sin(minutos * 0.35 + fase),
    lng: base.lng + AMPLITUD_GRADOS * Math.cos(minutos * 0.23 + fase * 1.7),
  };
}

/** Aplica el movimiento a los contactos que estan compartiendo. */
export function moverContactos(
  contactos: readonly ContactoCirculo[],
  bases: ReadonlyMap<string, Coordenada>,
  ahora: number,
): ContactoCirculo[] {
  return contactos.map((contacto) => {
    if (!contacto.compartiendo) return contacto;
    const base = bases.get(contacto.id);
    if (!base) return contacto;

    return {
      ...contacto,
      coordenada: posicionSimulada(base, semillaDeTexto(contacto.id), ahora),
      actualizadoEn: ahora,
    };
  });
}
