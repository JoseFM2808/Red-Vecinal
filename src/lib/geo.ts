import type { Coordenada } from "./tipos";

/**
 * Geometria del dominio. Funciones puras, sin dependencias, testeadas.
 *
 * Dos decisiones viven aqui y tienen consecuencias de privacidad:
 *
 * 1. Las coordenadas se truncan a 4 decimales (~11 m) ANTES de salir del dispositivo.
 *    Suficiente para ubicar la esquina, insuficiente para senalar una puerta.
 * 2. La zona es una celda de ~550 m. Es la unidad con la que la politica anti-Sybil
 *    limita el farmeo y con la que se agregan los mapas de riesgo que se venden
 *    a municipios y aseguradoras, siempre anonimizados.
 */

/** Decimales conservados al truncar. 4 decimales ~ 11 m en el ecuador. */
export const DECIMALES_PRECISION = 4;

/** Lado de la celda de zona en grados. 0.005 ~ 550 m. */
export const LADO_ZONA_GRADOS = 0.005;

const RADIO_TIERRA_M = 6_371_000;

export function truncarCoordenada(c: Coordenada): Coordenada {
  const factor = 10 ** DECIMALES_PRECISION;
  return {
    lat: Math.round(c.lat * factor) / factor,
    lng: Math.round(c.lng * factor) / factor,
  };
}

/**
 * Microgrados enteros: el formato exacto que reciben los contratos
 * (`int32 latE6`, `int32 lngE6`). Los enteros evitan que dos clientes con
 * distinta representacion de punto flotante produzcan hashes distintos.
 */
export function aMicrogrados(valor: number): number {
  return Math.round(valor * 1_000_000);
}

export function desdeMicrogrados(valor: number): number {
  return valor / 1_000_000;
}

/** Identificador estable de la celda que contiene la coordenada. */
export function zonaIdDe(c: Coordenada): string {
  const celdaLat = Math.floor(c.lat / LADO_ZONA_GRADOS);
  const celdaLng = Math.floor(c.lng / LADO_ZONA_GRADOS);
  return `z${celdaLat}_${celdaLng}`;
}

/** Distancia en metros entre dos puntos (haversine). */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const radianes = (grados: number) => (grados * Math.PI) / 180;
  const dLat = radianes(b.lat - a.lat);
  const dLng = radianes(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radianes(a.lat)) * Math.cos(radianes(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatearCoordenada(c: Coordenada): string {
  return `${c.lat.toFixed(DECIMALES_PRECISION)}, ${c.lng.toFixed(DECIMALES_PRECISION)}`;
}
