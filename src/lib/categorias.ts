import type { IdCategoria } from "./tipos";

/**
 * Catalogo cerrado de categorias.
 *
 * `indiceContrato` es el `uint8 category` que recibe ReportRegistry.submitReport().
 * Si se agrega una categoria, el indice nuevo va al final: los indices ya usados
 * estan escritos en la cadena y no se pueden reordenar.
 *
 * Historia del catalogo: arranco con dos categorias (ADR-008) y se sumo "sismo sentido"
 * como tercera (ADR-019), en la version liviana que docs/PROYECTO.md seccion 6 declara
 * viable: reporte comunitario tipo "Did You Feel It?" del USGS, sin motor de deteccion
 * propio y sin tocar la economia del token.
 */
export interface Categoria {
  id: IdCategoria;
  indiceContrato: number;
  nombre: string;
  descripcionCorta: string;
  ejemplos: string;
  /** Clave del icono en src/components/ui/Icono.tsx */
  icono: "alerta" | "foco" | "sismo";
  /** Color de acento, usado en marcadores del mapa y en la UI. */
  color: string;
  /** Las urgentes ofrecen escalamiento a la autoridad al terminar el reporte. */
  urgente: boolean;
  /**
   * Textos de un toque para la descripcion. Bajan la friccion en el momento en que
   * la persona esta nerviosa y escribir es lo ultimo que quiere hacer.
   * En sismos hacen las veces de escala de intensidad en lenguaje llano.
   */
  sugerencias: readonly string[];
}

export const CATEGORIAS: readonly Categoria[] = [
  {
    id: "actividad_sospechosa",
    indiceContrato: 0,
    nombre: "Actividad sospechosa",
    descripcionCorta: "Alguien merodeando, un robo, una situacion que no cuadra",
    ejemplos: "Personas vigilando casas, vehiculo sin placa dando vueltas, arrebato",
    icono: "alerta",
    color: "#ff5c5c",
    urgente: true,
    sugerencias: [
      "Personas merodeando la cuadra",
      "Vehiculo sospechoso estacionado",
      "Robo en curso",
    ],
  },
  {
    id: "infraestructura",
    indiceContrato: 1,
    nombre: "Infraestructura en riesgo",
    descripcionCorta: "Lo que vuelve peligrosa la cuadra aunque no pase nada hoy",
    ejemplos: "Poste sin luz, cable colgando, buzon abierto, esquina a oscuras",
    icono: "foco",
    color: "#f5b544",
    urgente: false,
    sugerencias: ["Poste sin luz", "Cable colgando", "Buzon o zanja sin senalizar"],
  },
  {
    id: "sismo_sentido",
    indiceContrato: 2,
    nombre: "Sismo sentido",
    descripcionCorta: "Lo sentiste? Reportalo y mira quien mas lo sintio cerca",
    ejemplos: "Se movieron los muebles, se escucho crujir la estructura, no pudiste caminar",
    icono: "sismo",
    color: "#62a8ff",
    urgente: false,
    sugerencias: [
      "Leve: apenas se sintio",
      "Moderado: se movieron las cosas",
      "Fuerte: dificil mantenerse en pie",
    ],
  },
] as const;

export function obtenerCategoria(id: IdCategoria): Categoria {
  const encontrada = CATEGORIAS.find((c) => c.id === id);
  if (!encontrada) {
    // Imposible por tipos, pero el catalogo tambien se lee desde datos persistidos.
    throw new Error(`Categoria desconocida: ${id}`);
  }
  return encontrada;
}

export function categoriaPorIndice(indice: number): Categoria | undefined {
  return CATEGORIAS.find((c) => c.indiceContrato === indice);
}

/** Los ids validos, para saber si un dato guardado o un parametro de URL es de fiar. */
export function esIdCategoria(valor: string): valor is IdCategoria {
  return CATEGORIAS.some((c) => c.id === valor);
}
