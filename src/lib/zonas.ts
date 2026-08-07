import { distanciaMetros } from "./geo";
import type { Coordenada } from "./tipos";

/**
 * Nombre legible de la zona, solo para la interfaz.
 *
 * NO es geocodificacion: es el distrito de referencia mas cercano de una lista local.
 * Se hace asi a proposito — llamar a un servicio de geocoding inverso enviaria la
 * coordenada del vecino a un tercero, que es justo lo que el producto promete no hacer
 * (ADR-015).
 *
 * ADR-020: la primera version tenia 16 distritos y un radio de tolerancia de 12 km, asi
 * que desde casi cualquier punto de Lima devolvia un distrito equivocado con total
 * seguridad — quien estaba en Surquillo o Barranco aparecia en Miraflores. Ahora la lista
 * cubre Lima Metropolitana y el Callao, el radio es realista, y cuando el punto no cae
 * claramente dentro de un distrito el texto lo dice ("Cerca de X") en vez de afirmarlo.
 *
 * Limite que queda y que hay que conocer: los distritos grandes (San Juan de Lurigancho,
 * Ate, Carabayllo) tienen el centroide lejos de sus bordes, asi que cerca del limite el
 * resultado puede seguir siendo el vecino de al lado. Por eso el vecino puede corregirlo
 * a mano antes de publicar, y por eso lo que se envia a la autoridad es la coordenada,
 * no el nombre.
 */

interface Referencia {
  nombre: string;
  coordenada: Coordenada;
}

/** Lima Metropolitana y Provincia Constitucional del Callao. */
const REFERENCIAS: readonly Referencia[] = [
  // Lima Norte
  { nombre: "Ancon", coordenada: { lat: -11.775, lng: -77.176 } },
  { nombre: "Santa Rosa", coordenada: { lat: -11.798, lng: -77.166 } },
  { nombre: "Carabayllo", coordenada: { lat: -11.897, lng: -77.033 } },
  { nombre: "Puente Piedra", coordenada: { lat: -11.865, lng: -77.075 } },
  { nombre: "Comas", coordenada: { lat: -11.949, lng: -77.062 } },
  { nombre: "Los Olivos", coordenada: { lat: -11.97, lng: -77.07 } },
  { nombre: "Independencia", coordenada: { lat: -11.989, lng: -77.053 } },
  { nombre: "San Martin de Porres", coordenada: { lat: -12.009, lng: -77.085 } },

  // Lima Este
  { nombre: "San Juan de Lurigancho", coordenada: { lat: -11.975, lng: -76.995 } },
  { nombre: "Lurigancho-Chosica", coordenada: { lat: -11.94, lng: -76.7 } },
  { nombre: "Chaclacayo", coordenada: { lat: -11.98, lng: -76.768 } },
  { nombre: "Ate", coordenada: { lat: -12.026, lng: -76.918 } },
  { nombre: "Santa Anita", coordenada: { lat: -12.043, lng: -76.97 } },
  { nombre: "El Agustino", coordenada: { lat: -12.042, lng: -76.995 } },
  { nombre: "La Molina", coordenada: { lat: -12.079, lng: -76.944 } },
  { nombre: "Cieneguilla", coordenada: { lat: -12.115, lng: -76.81 } },

  // Lima Centro
  { nombre: "Rimac", coordenada: { lat: -12.027, lng: -77.029 } },
  { nombre: "Cercado de Lima", coordenada: { lat: -12.0464, lng: -77.0428 } },
  { nombre: "Brena", coordenada: { lat: -12.059, lng: -77.05 } },
  { nombre: "La Victoria", coordenada: { lat: -12.067, lng: -77.015 } },
  { nombre: "San Luis", coordenada: { lat: -12.076, lng: -76.999 } },
  { nombre: "Jesus Maria", coordenada: { lat: -12.074, lng: -77.048 } },
  { nombre: "Pueblo Libre", coordenada: { lat: -12.074, lng: -77.063 } },
  { nombre: "Magdalena del Mar", coordenada: { lat: -12.09, lng: -77.07 } },
  { nombre: "San Miguel", coordenada: { lat: -12.077, lng: -77.092 } },
  { nombre: "Lince", coordenada: { lat: -12.087, lng: -77.035 } },
  { nombre: "San Isidro", coordenada: { lat: -12.097, lng: -77.036 } },
  { nombre: "San Borja", coordenada: { lat: -12.1, lng: -76.999 } },
  { nombre: "Surquillo", coordenada: { lat: -12.112, lng: -77.01 } },
  { nombre: "Miraflores", coordenada: { lat: -12.121, lng: -77.03 } },
  { nombre: "Barranco", coordenada: { lat: -12.147, lng: -77.02 } },
  { nombre: "Santiago de Surco", coordenada: { lat: -12.145, lng: -76.993 } },

  // Lima Sur
  { nombre: "Chorrillos", coordenada: { lat: -12.172, lng: -77.018 } },
  { nombre: "San Juan de Miraflores", coordenada: { lat: -12.159, lng: -76.97 } },
  { nombre: "Villa Maria del Triunfo", coordenada: { lat: -12.158, lng: -76.94 } },
  { nombre: "Villa El Salvador", coordenada: { lat: -12.213, lng: -76.937 } },
  { nombre: "Pachacamac", coordenada: { lat: -12.229, lng: -76.858 } },
  { nombre: "Lurin", coordenada: { lat: -12.274, lng: -76.872 } },
  { nombre: "Punta Hermosa", coordenada: { lat: -12.332, lng: -76.825 } },
  { nombre: "Punta Negra", coordenada: { lat: -12.364, lng: -76.793 } },
  { nombre: "San Bartolo", coordenada: { lat: -12.388, lng: -76.779 } },
  { nombre: "Santa Maria del Mar", coordenada: { lat: -12.405, lng: -76.774 } },
  { nombre: "Pucusana", coordenada: { lat: -12.479, lng: -76.796 } },

  // Callao
  { nombre: "Callao", coordenada: { lat: -12.057, lng: -77.118 } },
  { nombre: "Bellavista", coordenada: { lat: -12.062, lng: -77.12 } },
  { nombre: "La Perla", coordenada: { lat: -12.07, lng: -77.117 } },
  { nombre: "La Punta", coordenada: { lat: -12.07, lng: -77.166 } },
  { nombre: "Carmen de la Legua", coordenada: { lat: -12.04, lng: -77.093 } },
  { nombre: "Ventanilla", coordenada: { lat: -11.876, lng: -77.125 } },
  { nombre: "Mi Peru", coordenada: { lat: -11.855, lng: -77.121 } },
];

/** Hasta aqui se afirma el distrito sin matizar. */
const RADIO_CONFIABLE_M = 2_500;

/** Mas alla de esto no se nombra ningun distrito. */
const RADIO_MAXIMO_M = 8_000;

export interface DescripcionZona {
  /** Texto listo para mostrar: "Miraflores", "Cerca de Comas" o "Zona sin referencia". */
  etiqueta: string;
  /** Distrito de referencia mas cercano, aunque no sea confiable. */
  distrito: string | null;
  /** Distancia al centroide del distrito, en metros. */
  distanciaM: number | null;
  /** El punto cae claramente dentro del distrito. */
  confiable: boolean;
}

const SIN_REFERENCIA: DescripcionZona = {
  etiqueta: "Zona sin referencia",
  distrito: null,
  distanciaM: null,
  confiable: false,
};

/** Todos los distritos, ordenados, para que el vecino pueda corregir la deteccion. */
export function listaDistritos(): string[] {
  return REFERENCIAS.map((r) => r.nombre).sort((a, b) => a.localeCompare(b, "es"));
}

export function describirZona(coordenada: Coordenada): DescripcionZona {
  let mejor: Referencia | null = null;
  let mejorDistancia = Number.POSITIVE_INFINITY;

  for (const referencia of REFERENCIAS) {
    const d = distanciaMetros(coordenada, referencia.coordenada);
    if (d < mejorDistancia) {
      mejorDistancia = d;
      mejor = referencia;
    }
  }

  if (!mejor || mejorDistancia > RADIO_MAXIMO_M) return SIN_REFERENCIA;

  const confiable = mejorDistancia <= RADIO_CONFIABLE_M;
  return {
    etiqueta: confiable ? mejor.nombre : `Cerca de ${mejor.nombre}`,
    distrito: mejor.nombre,
    distanciaM: Math.round(mejorDistancia),
    confiable,
  };
}

/** Atajo para los sitios donde solo hace falta el texto. */
export function nombreDeZona(coordenada: Coordenada): string {
  return describirZona(coordenada).etiqueta;
}
