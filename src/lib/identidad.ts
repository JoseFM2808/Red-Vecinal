import type { Identidad } from "./tipos";

/**
 * Identidad pseudonima (ADR-005).
 *
 * El vecino no ve nunca una seed phrase: abre la app y ya tiene un alias.
 * Hoy ese alias se genera en el dispositivo y se guarda localmente; cuando entre
 * Privy o Web3Auth, esta funcion se reemplaza y las pantallas no se enteran.
 *
 * La identidad real NUNCA vive aqui. El vinculo cifrado wallet-persona lo custodia
 * IdentityEscrow.sol y solo se abre con 2 de 3 firmas.
 */

const CLAVE = "vecino-seguro:identidad:v1";

function hexAleatorio(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function crearIdentidad(): Identidad {
  const direccion = `0x${hexAleatorio(20)}`;
  const numero = parseInt(direccion.slice(-4), 16) % 10000;
  return {
    seudonimo: `vecino-${numero.toString().padStart(4, "0")}`,
    direccion,
    creadoEn: Date.now(),
    simulado: true,
  };
}

function esIdentidad(valor: unknown): valor is Identidad {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return typeof v.seudonimo === "string" && typeof v.direccion === "string";
}

/** Recupera la identidad del dispositivo o crea una nueva. Solo cliente. */
export function cargarOCrearIdentidad(): Identidad {
  if (typeof window === "undefined") {
    return { seudonimo: "vecino-0000", direccion: "0x", creadoEn: 0, simulado: true };
  }

  try {
    const guardada = window.localStorage.getItem(CLAVE);
    if (guardada) {
      const parseada: unknown = JSON.parse(guardada);
      if (esIdentidad(parseada)) return parseada;
    }
  } catch {
    // localStorage bloqueado o dato corrupto: se genera una identidad nueva.
  }

  const nueva = crearIdentidad();
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(nueva));
  } catch {
    // Modo privado sin almacenamiento: la identidad dura lo que la sesion.
  }
  return nueva;
}

/** Version corta de la direccion para mostrar: 0x1234…abcd */
export function abreviarDireccion(direccion: string): string {
  if (direccion.length <= 12) return direccion;
  return `${direccion.slice(0, 6)}…${direccion.slice(-4)}`;
}
