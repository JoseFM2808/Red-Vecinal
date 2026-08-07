import datosArquitectura from "@/data/arquitectura.json";
import datosDecisiones from "@/data/decisiones.json";

/**
 * Tipado de las fuentes de verdad que alimentan la pestana Arquitectura (ADR-006).
 *
 * Los mismos JSON generan docs/ARQUITECTURA.md y docs/DECISIONES.md, asi que lo que
 * el jurado ve en la app y lo que el equipo lee en el repositorio no pueden divergir.
 * `npm run validate` verifica la forma; aqui solo se le pone tipo.
 */

export type EstadoModulo = "listo" | "simulado" | "pendiente-equipo";

export interface Capa {
  id: string;
  nombre: string;
  rol: string;
  estado: EstadoModulo;
  tecnologias: string[];
  archivos: string[];
}

export interface PasoFlujo {
  n: number;
  titulo: string;
  detalle: string;
  capa: string;
  onchain: boolean;
}

export interface Contrato {
  nombre: string;
  red: string;
  estado: EstadoModulo;
  responsabilidad: string;
  funciones: { firma: string; nota: string }[];
}

export interface Decision {
  id: string;
  titulo: string;
  fecha: string;
  autor: string;
  estado: string;
  contexto: string;
  opciones: { nombre: string; descartada_porque: string }[];
  decision: string;
  consecuencias: string[];
  reversibilidad: string;
  costo_de_revertir: string;
  criterios_rubrica: string[];
  evidencia: string[];
  requiere_validacion_humana: boolean;
  nota_para_humano?: string;
}

interface Arquitectura {
  meta: { nombre: string; version: string; actualizado: string; resumen: string };
  problema: {
    tesis: string;
    evidencia: { dato: string; detalle: string; fuente: string }[];
    usuarios: { perfil: string; necesidad: string }[];
  };
  principios: string[];
  capas: Capa[];
  flujo: PasoFlujo[];
  contratos: Contrato[];
  arbitrum: {
    porQue: string;
    usos: { titulo: string; detalle: string }[];
    redes: { nombre: string; chainId: number; uso: string }[];
  };
  limites: { tema: string; queHacemos: string; queFaltaria: string }[];
  siguientesPasos: { titulo: string; responsable: string; detalle: string; bloquea: string }[];
  rubrica: { criterio: string; peso: number; evidencia: string[] }[];
}

export const ARQUITECTURA = datosArquitectura as Arquitectura;

export const DECISIONES = (datosDecisiones as { decisiones: Decision[] }).decisiones;

export const DECISIONES_PENDIENTES = DECISIONES.filter((d) => d.requiere_validacion_humana);

export const NOMBRE_CRITERIO: Record<string, string> = {
  problema: "Problema e impacto",
  ux: "Producto y UX",
  tecnica: "Implementacion tecnica",
  arbitrum: "Ecosistema Arbitrum",
  pitch: "Pitch y demo",
};
