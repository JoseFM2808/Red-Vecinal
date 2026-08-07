import type { ContactoCirculo } from "./circulo";
import { RADIO_AVISO_POR_DEFECTO_M } from "./circulo";
import type { Coordenada } from "./tipos";

/**
 * Persistencia del circulo en el dispositivo (rama Lab_Dai).
 *
 * Los telefonos de tus familiares son el dato mas sensible que maneja la app, asi que
 * no salen de aqui: no hay servidor al que enviarlos y no viajan en ningun reporte.
 */

const CLAVE_CONTACTOS = "vecino-seguro:circulo:v1";
const CLAVE_AVISADOS = "vecino-seguro:circulo-avisados:v1";

/**
 * Puntos base de los contactos sembrados. Estan junto a los reportes de demo para que
 * el aviso de cercania se dispare en la demostracion sin tener que esperar.
 */
export const BASES_DEMO: ReadonlyArray<{ id: string; base: Coordenada }> = [
  { id: "demo-mama", base: { lat: -11.9762, lng: -76.9941 } },
  { id: "demo-hermana", base: { lat: -12.2118, lng: -76.9382 } },
  { id: "demo-papa", base: { lat: -12.0431, lng: -76.9973 } },
];

export function contactosSembrados(ahora: number): ContactoCirculo[] {
  return [
    {
      id: "demo-mama",
      nombre: "Rosa (mama)",
      telefono: "+51 987 654 321",
      relacion: "Madre",
      alias: "vecina-3311",
      compartiendo: true,
      coordenada: BASES_DEMO[0]?.base ?? null,
      actualizadoEn: ahora,
      radioAvisoM: RADIO_AVISO_POR_DEFECTO_M,
    },
    {
      id: "demo-hermana",
      nombre: "Karina (hermana)",
      telefono: "+51 954 118 002",
      relacion: "Hermana",
      alias: "vecina-6620",
      compartiendo: true,
      coordenada: BASES_DEMO[1]?.base ?? null,
      actualizadoEn: ahora,
      radioAvisoM: 1000,
    },
    {
      id: "demo-papa",
      nombre: "Luis (papa)",
      telefono: "+51 999 300 145",
      relacion: "Padre",
      alias: "vecino-1284",
      // Sirve para mostrar el estado: compartir es del contacto, no tuyo.
      compartiendo: false,
      coordenada: null,
      actualizadoEn: 0,
      radioAvisoM: RADIO_AVISO_POR_DEFECTO_M,
    },
  ];
}

function esContacto(valor: unknown): valor is ContactoCirculo {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v.id === "string" && typeof v.nombre === "string" && typeof v.telefono === "string"
  );
}

export function cargarContactos(): ContactoCirculo[] | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CLAVE_CONTACTOS);
    if (!bruto) return null;
    const parseado: unknown = JSON.parse(bruto);
    return Array.isArray(parseado) ? parseado.filter(esContacto) : null;
  } catch {
    return null;
  }
}

export function guardarContactos(contactos: readonly ContactoCirculo[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_CONTACTOS, JSON.stringify(contactos));
  } catch {
    console.warn("[vecino-seguro] no se pudo guardar el circulo");
  }
}

export function cargarAvisados(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const bruto = window.localStorage.getItem(CLAVE_AVISADOS);
    if (!bruto) return new Set();
    const parseado: unknown = JSON.parse(bruto);
    return new Set(Array.isArray(parseado) ? parseado.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function guardarAvisados(claves: ReadonlySet<string>): void {
  if (typeof window === "undefined") return;
  try {
    // Se conservan solo las ultimas: la lista no tiene por que crecer sin limite.
    window.localStorage.setItem(CLAVE_AVISADOS, JSON.stringify([...claves].slice(-200)));
  } catch {
    // sin almacenamiento: los avisos podrian repetirse tras recargar
  }
}

export function limpiarCirculo(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE_CONTACTOS);
    window.localStorage.removeItem(CLAVE_AVISADOS);
  } catch {
    // nada que limpiar
  }
}
