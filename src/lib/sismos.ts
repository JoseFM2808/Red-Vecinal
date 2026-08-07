import type { IdCategoria } from "./tipos";

/**
 * Agregado comunitario de sismos, al estilo "Did You Feel It?" del USGS (ADR-019).
 *
 * Lo que esto NO es: un detector de sismos. No hay acelerometros ni procesamiento de
 * senal — eso es un proyecto aparte y docs/PROYECTO.md lo descarta explicitamente como
 * nucleo. Lo que si hace, reutilizando la infraestructura que ya existe: si varios
 * vecinos reportan "lo senti" en la misma media hora, se muestra el agregado por zonas.
 *
 * Es DEDUCTIVO y solo informativo: no toca la economia del token. La recompensa de un
 * reporte de sismo se calcula con las mismas reglas que cualquier otro (src/lib/antisybil.ts),
 * sin radio especial. Ensanchar el radio de corroboracion para sismos habria hecho que dos
 * cuentas cualesquiera de Lima se corroboraran entre si — un agujero anti-Sybil a cambio de
 * nada, porque este panel no reparte tokens.
 *
 * Funcion pura: recibe `ahora`, no lee el reloj.
 */

export const CATEGORIA_SISMO: IdCategoria = "sismo_sentido";

/** Ventana en la que los reportes se consideran del mismo evento. */
export const VENTANA_SISMO_MS = 30 * 60 * 1000;

/** Con una sola persona no hay evento comunitario: puede ser un camion pasando. */
export const MINIMO_PERSONAS = 2;

export interface ReporteSismoEvaluable {
  categoria: IdCategoria;
  creadoEn: number;
  zonaNombre: string;
  descripcion: string;
  autorDireccion: string;
}

export interface ZonaSismo {
  nombre: string;
  total: number;
}

export interface ResumenSismo {
  /** Hay evento comunitario que mostrar. */
  activo: boolean;
  /** Reportes dentro de la ventana. */
  reportes: number;
  /** Direcciones distintas: es el numero que se le muestra al vecino. */
  personas: number;
  primeroEn: number | null;
  ultimoEn: number | null;
  zonas: ZonaSismo[];
  /** Intensidad mas repetida, deducida del texto. null si nadie la declaro. */
  intensidad: string | null;
}

/**
 * Escala en lenguaje llano. Coincide con las sugerencias de la categoria en
 * src/lib/categorias.ts, que es de donde sale el texto en la mayoria de reportes.
 */
const NIVELES = [
  { etiqueta: "Fuerte", patron: /fuerte/i, severidad: 3 },
  { etiqueta: "Moderado", patron: /moderad/i, severidad: 2 },
  { etiqueta: "Leve", patron: /leve/i, severidad: 1 },
] as const;

function clasificarIntensidad(descripcion: string): (typeof NIVELES)[number] | null {
  return NIVELES.find((n) => n.patron.test(descripcion)) ?? null;
}

const VACIO: ResumenSismo = {
  activo: false,
  reportes: 0,
  personas: 0,
  primeroEn: null,
  ultimoEn: null,
  zonas: [],
  intensidad: null,
};

export function resumirSismosRecientes(
  reportes: readonly ReporteSismoEvaluable[],
  ahora: number,
): ResumenSismo {
  const recientes = reportes.filter(
    (r) =>
      r.categoria === CATEGORIA_SISMO &&
      r.creadoEn <= ahora &&
      ahora - r.creadoEn <= VENTANA_SISMO_MS,
  );

  if (recientes.length === 0) return VACIO;

  const personas = new Set(recientes.map((r) => r.autorDireccion.toLowerCase()));

  const porZona = new Map<string, number>();
  for (const r of recientes) {
    porZona.set(r.zonaNombre, (porZona.get(r.zonaNombre) ?? 0) + 1);
  }
  const zonas = [...porZona.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));

  // Intensidad: la mas repetida; si empatan, gana la mas severa (mas prudente).
  const conteo = new Map<string, { veces: number; severidad: number }>();
  for (const r of recientes) {
    const nivel = clasificarIntensidad(r.descripcion);
    if (!nivel) continue;
    const previo = conteo.get(nivel.etiqueta);
    conteo.set(nivel.etiqueta, {
      veces: (previo?.veces ?? 0) + 1,
      severidad: nivel.severidad,
    });
  }
  const intensidad =
    [...conteo.entries()].sort(
      (a, b) => b[1].veces - a[1].veces || b[1].severidad - a[1].severidad,
    )[0]?.[0] ?? null;

  return {
    activo: personas.size >= MINIMO_PERSONAS,
    reportes: recientes.length,
    personas: personas.size,
    primeroEn: Math.min(...recientes.map((r) => r.creadoEn)),
    ultimoEn: Math.max(...recientes.map((r) => r.creadoEn)),
    zonas,
    intensidad,
  };
}
