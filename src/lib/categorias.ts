import type { IdCategoria } from "./tipos";

/**
 * Catalogo cerrado de categorias (ADR-008: dos, ni una mas hasta el 12 de agosto).
 *
 * `indiceContrato` es el `uint8 category` que recibe ReportRegistry.submitReport().
 * Si se agrega una categoria, el indice nuevo va al final: los indices ya usados
 * estan escritos en la cadena y no se pueden reordenar.
 */
export interface Categoria {
  id: IdCategoria;
  indiceContrato: number;
  nombre: string;
  descripcionCorta: string;
  ejemplos: string;
  /** Clave del icono en src/components/ui/Icono.tsx */
  icono: "alerta" | "foco";
  /** Color de acento, usado en marcadores del mapa y en la UI. */
  color: string;
  /** Las urgentes ofrecen escalamiento a la autoridad al terminar el reporte. */
  urgente: boolean;
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
