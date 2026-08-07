import { distanciaMetros } from "./geo";
import type { Coordenada } from "./tipos";

/**
 * Nombre legible de la zona, solo para la interfaz.
 *
 * No es geocodificacion: es el distrito de referencia mas cercano de una lista corta.
 * Se usa asi a proposito — llamar a un servicio de geocoding enviaria la coordenada
 * del vecino a un tercero, que es justo lo que el producto promete no hacer.
 */

interface Referencia {
  nombre: string;
  coordenada: Coordenada;
}

/** Distritos priorizados: los conos con menor cobertura de serenazgo, mas el centro. */
const REFERENCIAS: readonly Referencia[] = [
  { nombre: "San Juan de Lurigancho", coordenada: { lat: -11.975, lng: -76.995 } },
  { nombre: "Comas", coordenada: { lat: -11.949, lng: -77.062 } },
  { nombre: "Carabayllo", coordenada: { lat: -11.897, lng: -77.033 } },
  { nombre: "Independencia", coordenada: { lat: -11.989, lng: -77.053 } },
  { nombre: "San Martin de Porres", coordenada: { lat: -12.009, lng: -77.085 } },
  { nombre: "El Agustino", coordenada: { lat: -12.042, lng: -76.995 } },
  { nombre: "Ate", coordenada: { lat: -12.026, lng: -76.918 } },
  { nombre: "Rimac", coordenada: { lat: -12.027, lng: -77.029 } },
  { nombre: "Cercado de Lima", coordenada: { lat: -12.0464, lng: -77.0428 } },
  { nombre: "La Victoria", coordenada: { lat: -12.067, lng: -77.015 } },
  { nombre: "San Isidro", coordenada: { lat: -12.097, lng: -77.036 } },
  { nombre: "Miraflores", coordenada: { lat: -12.121, lng: -77.03 } },
  { nombre: "San Juan de Miraflores", coordenada: { lat: -12.159, lng: -76.97 } },
  { nombre: "Villa Maria del Triunfo", coordenada: { lat: -12.158, lng: -76.94 } },
  { nombre: "Chorrillos", coordenada: { lat: -12.172, lng: -77.018 } },
  { nombre: "Villa El Salvador", coordenada: { lat: -12.213, lng: -76.937 } },
];

/** Mas lejos de esto, no se afirma un distrito. */
const RADIO_MAXIMO_M = 12_000;

export function nombreDeZona(coordenada: Coordenada): string {
  let mejor: Referencia | null = null;
  let mejorDistancia = Number.POSITIVE_INFINITY;

  for (const referencia of REFERENCIAS) {
    const d = distanciaMetros(coordenada, referencia.coordenada);
    if (d < mejorDistancia) {
      mejorDistancia = d;
      mejor = referencia;
    }
  }

  if (!mejor || mejorDistancia > RADIO_MAXIMO_M) return "Zona sin referencia";
  return mejor.nombre;
}
