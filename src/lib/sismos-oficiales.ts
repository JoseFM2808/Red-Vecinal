import { distanciaMetros } from "./geo";
import type { Coordenada } from "./tipos";

/**
 * Sismos desde fuente oficial (ADR-042).
 *
 * CAMBIO DE MODELO respecto de ADR-019. Antes el vecino reportaba "senti un sismo" y la
 * app agregaba esos reportes. Ahora el orden se invierte, que es como funciona de verdad:
 *
 *   1. El IGP detecta y publica el sismo (es su trabajo, tienen la red de sensores).
 *   2. La app avisa a quien esta lo bastante cerca como para que le importe.
 *   3. El vecino responde COMO LO SINTIO, no QUE lo sintio.
 *   4. Esas respuestas, agregadas por zona, dan el mapa de intensidad.
 *
 * Es el modelo "Did You Feel It?" del USGS, con la deteccion delegada a quien la puede
 * hacer bien. Seguimos sin medir nada: no hay acelerometro ni algoritmo propio, y eso
 * se dice igual que antes.
 *
 * Fuente: Centro Sismologico Nacional del IGP. La respuesta cruda trae la fecha y la hora
 * en campos separados, y la hora viene montada sobre el epoch (1970-01-01T19:06:33Z
 * significa "a las 19:06:33"). Combinarlas mal desplaza el sismo 56 anios, asi que la
 * normalizacion tiene test propio.
 *
 * Todo aqui es puro: recibe `ahora` y la ubicacion, nunca lee el reloj ni `navigator`.
 */

export const FUENTE_SISMOS = {
  nombre: "IGP",
  descripcion: "Centro Sismologico Nacional del Instituto Geofisico del Peru",
  url: "https://ultimosismo.igp.gob.pe/ultimo-sismo/sismos-reportados",
} as const;

export interface SismoOficial {
  /** Codigo del IGP, ej. "2026-0535". Es el identificador estable del evento. */
  id: string;
  fuente: string;
  /** Instante real del sismo, epoch en ms UTC. */
  ocurridoEn: number;
  magnitud: number;
  /** ML, Mw... El IGP a veces lo deja vacio; por defecto ML. */
  tipoMagnitud: string;
  profundidadKm: number;
  epicentro: Coordenada;
  /** Texto del IGP: "21 km al SO de Chupaca, Chupaca - Junin". */
  referencia: string;
  /** Intensidad maxima observada que reporta el IGP, ej. "III Chupaca". */
  intensidadMaxima: string | null;
}

/* --- Politica de alerta ------------------------------------------------------------ */

export const POLITICA_ALERTA = {
  /** Por debajo de esto casi nadie lo siente; alertar seria ruido que ensena a ignorar. */
  magnitudMinima: 3.5,
  /** Mas viejo que esto ya no es una alerta, es historial. */
  antiguedadMaximaMs: 60 * 60 * 1000,
  /**
   * Radio segun magnitud. Un sismo grande se siente mucho mas lejos, asi que un radio
   * fijo o satura de avisos en los pequenos o se queda corto en los grandes.
   */
  radioKmPorMagnitud: [
    { desde: 6.5, radioKm: 1000 },
    { desde: 5.5, radioKm: 600 },
    { desde: 4.5, radioKm: 350 },
    { desde: 0, radioKm: 150 },
  ],
} as const;

export function radioAlertaKm(magnitud: number): number {
  for (const tramo of POLITICA_ALERTA.radioKmPorMagnitud) {
    if (magnitud >= tramo.desde) return tramo.radioKm;
  }
  return 150;
}

/* --- Normalizacion de la respuesta del IGP ----------------------------------------- */

/** Forma cruda que devuelve el endpoint del IGP. Todo opcional: es una API ajena. */
interface SismoCrudoIgp {
  codigo?: unknown;
  fecha_utc?: unknown;
  hora_utc?: unknown;
  latitud?: unknown;
  longitud?: unknown;
  magnitud?: unknown;
  profundidad?: unknown;
  referencia?: unknown;
  tipomagnitud?: unknown;
  intensidad?: unknown;
}

/**
 * Convierte a numero o devuelve null.
 *
 * El caso vacio es explicito a proposito: `Number("")` es 0, no NaN, asi que sin este
 * guardia una magnitud vacia del IGP se convertia en un sismo de magnitud 0 en vez de
 * descartarse. Lo encontro el test de registros incompletos.
 */
const aNumero = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;

  const limpio = v.trim();
  if (limpio === "") return null;

  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
};

/**
 * Combina la fecha y la hora que el IGP manda por separado.
 *
 * `fecha_utc` trae el dia a medianoche y `hora_utc` trae la hora del dia sobre el epoch.
 * Se toma la parte de fecha de una y la de hora de la otra, y se interpreta como UTC.
 */
export function instanteIgp(fechaUtc: unknown, horaUtc: unknown): number | null {
  if (typeof fechaUtc !== "string" || typeof horaUtc !== "string") return null;

  const dia = fechaUtc.slice(0, 10);
  const hora = horaUtc.slice(11, 19);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !/^\d{2}:\d{2}:\d{2}$/.test(hora)) return null;

  const epoch = Date.parse(`${dia}T${hora}Z`);
  return Number.isFinite(epoch) ? epoch : null;
}

/** Convierte la respuesta cruda del IGP en sismos utilizables. Descarta lo que no cuadra. */
export function normalizarSismosIgp(crudos: unknown): SismoOficial[] {
  if (!Array.isArray(crudos)) return [];

  const sismos: SismoOficial[] = [];

  for (const bruto of crudos as SismoCrudoIgp[]) {
    const ocurridoEn = instanteIgp(bruto?.fecha_utc, bruto?.hora_utc);
    const lat = aNumero(bruto?.latitud);
    const lng = aNumero(bruto?.longitud);
    const magnitud = aNumero(bruto?.magnitud);
    const codigo = typeof bruto?.codigo === "string" ? bruto.codigo : null;

    // Sin instante, sin epicentro, sin magnitud o sin id no hay nada que mostrar.
    if (ocurridoEn === null || lat === null || lng === null || magnitud === null || !codigo) {
      continue;
    }

    const tipo = typeof bruto?.tipomagnitud === "string" ? bruto.tipomagnitud.trim() : "";
    const intensidad =
      typeof bruto?.intensidad === "string" && bruto.intensidad.trim() !== ""
        ? bruto.intensidad.trim()
        : null;

    sismos.push({
      id: codigo,
      fuente: FUENTE_SISMOS.nombre,
      ocurridoEn,
      magnitud,
      tipoMagnitud: tipo === "" ? "ML" : tipo,
      profundidadKm: aNumero(bruto?.profundidad) ?? 0,
      epicentro: { lat, lng },
      referencia: typeof bruto?.referencia === "string" ? bruto.referencia : "Sin referencia",
      intensidadMaxima: intensidad,
    });
  }

  // Mas reciente primero: es el orden en que importan.
  return sismos.sort((a, b) => b.ocurridoEn - a.ocurridoEn);
}

/* --- Distancia y rumbo -------------------------------------------------------------- */

const PUNTOS_CARDINALES = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
export type PuntoCardinal = (typeof PUNTOS_CARDINALES)[number];

/**
 * Rumbo desde `desde` hacia `hasta`, redondeado a los ocho puntos cardinales.
 * Se muestra junto a la distancia ("178 km, E") para que se entienda de un vistazo
 * por donde quedo el epicentro.
 */
export function rumboCardinal(desde: Coordenada, hasta: Coordenada): PuntoCardinal {
  const rad = Math.PI / 180;
  const dLng = (hasta.lng - desde.lng) * rad;
  const lat1 = desde.lat * rad;
  const lat2 = hasta.lat * rad;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const grados = (Math.atan2(y, x) / rad + 360) % 360;
  const indice = Math.round(grados / 45) % 8;
  return PUNTOS_CARDINALES[indice] ?? "N";
}

export function distanciaKm(a: Coordenada, b: Coordenada): number {
  return Math.round(distanciaMetros(a, b) / 1000);
}

/* --- Decision de alerta ------------------------------------------------------------- */

export type CodigoAlerta = "alertar" | "magnitud_baja" | "lejos" | "antiguo" | "sin_ubicacion";

export interface ResultadoAlerta {
  alertar: boolean;
  codigo: CodigoAlerta;
  distanciaKm: number | null;
  rumbo: PuntoCardinal | null;
  radioKm: number;
}

/**
 * Decide si este sismo merece sonar en el telefono de alguien que esta en `ubicacion`.
 *
 * Sin ubicacion NO se alerta: un aviso de un sismo a 900 km que no se sintio ensena a
 * la gente a silenciar la app, y entonces la alerta que importa tampoco se lee.
 */
export function evaluarAlerta(
  sismo: SismoOficial,
  ubicacion: Coordenada | null,
  ahora: number,
): ResultadoAlerta {
  const radioKm = radioAlertaKm(sismo.magnitud);
  const base = { alertar: false, distanciaKm: null, rumbo: null, radioKm };

  if (sismo.magnitud < POLITICA_ALERTA.magnitudMinima) {
    return { ...base, codigo: "magnitud_baja" };
  }
  if (ahora - sismo.ocurridoEn > POLITICA_ALERTA.antiguedadMaximaMs) {
    return { ...base, codigo: "antiguo" };
  }
  if (!ubicacion) {
    return { ...base, codigo: "sin_ubicacion" };
  }

  const km = distanciaKm(ubicacion, sismo.epicentro);
  const rumbo = rumboCardinal(ubicacion, sismo.epicentro);

  if (km > radioKm) {
    return { alertar: false, codigo: "lejos", distanciaKm: km, rumbo, radioKm };
  }

  return { alertar: true, codigo: "alertar", distanciaKm: km, rumbo, radioKm };
}

/* --- Como lo sentiste: la escala de intensidad -------------------------------------- */

/**
 * Escala simplificada, alineada con Mercalli abreviada y con lo que pregunta el USGS.
 * El `grado` es lo que se agrega para pintar el mapa de intensidad.
 */
export const NIVELES_INTENSIDAD = [
  { grado: 1, id: "no_senti", etiqueta: "No lo senti", detalle: "Ni cuenta me di." },
  { grado: 2, id: "leve", etiqueta: "Leve", detalle: "Apenas, como si pasara un camion." },
  {
    grado: 3,
    id: "moderado",
    etiqueta: "Moderado",
    detalle: "Se movieron las lamparas o el agua.",
  },
  { grado: 4, id: "fuerte", etiqueta: "Fuerte", detalle: "Se cayeron cosas, costo caminar." },
  {
    grado: 5,
    id: "muy_fuerte",
    etiqueta: "Muy fuerte",
    detalle: "Dificil mantenerse en pie. Panico.",
  },
] as const;

export type IdIntensidad = (typeof NIVELES_INTENSIDAD)[number]["id"];

export function nivelIntensidad(id: IdIntensidad) {
  return NIVELES_INTENSIDAD.find((n) => n.id === id) ?? NIVELES_INTENSIDAD[0];
}

/** Una respuesta de un vecino a "como lo sentiste". */
export interface RespuestaIntensidad {
  sismoId: string;
  intensidad: IdIntensidad;
  zonaId: string;
  zonaNombre: string;
  respondidoEn: number;
}

export interface ZonaIntensidad {
  zonaId: string;
  zonaNombre: string;
  respuestas: number;
  /** Promedio de grado, 1 a 5. Es lo que da el color del mapa. */
  gradoPromedio: number;
}

export interface MapaIntensidad {
  sismoId: string;
  totalRespuestas: number;
  zonas: ZonaIntensidad[];
}

/**
 * Agrega las respuestas por zona. Es el "mapa de intensidad": no mide nada, cuenta
 * personas — exactamente lo que el producto puede afirmar sin mentir.
 */
export function construirMapaIntensidad(
  sismoId: string,
  respuestas: readonly RespuestaIntensidad[],
): MapaIntensidad {
  const delSismo = respuestas.filter((r) => r.sismoId === sismoId);
  const porZona = new Map<string, { nombre: string; grados: number[] }>();

  for (const r of delSismo) {
    const actual = porZona.get(r.zonaId) ?? { nombre: r.zonaNombre, grados: [] };
    actual.grados.push(nivelIntensidad(r.intensidad).grado);
    porZona.set(r.zonaId, actual);
  }

  const zonas: ZonaIntensidad[] = [...porZona].map(([zonaId, { nombre, grados }]) => ({
    zonaId,
    zonaNombre: nombre,
    respuestas: grados.length,
    gradoPromedio:
      Math.round((grados.reduce((s, g) => s + g, 0) / Math.max(1, grados.length)) * 10) / 10,
  }));

  // De mas sentido a menos: en una emergencia, lo grave va arriba.
  zonas.sort((a, b) => b.gradoPromedio - a.gradoPromedio || b.respuestas - a.respuestas);

  return { sismoId, totalRespuestas: delSismo.length, zonas };
}
