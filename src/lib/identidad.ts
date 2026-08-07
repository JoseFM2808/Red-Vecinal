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

/** Prefijo de dominio para que el hash no coincida con el de ningun otro sistema. */
const SAL_DERIVACION = "vecino-seguro:identidad:v1:";

function hexAleatorio(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Alias legible a partir de una direccion. Mismo formato para todas las identidades. */
export function seudonimoDeDireccion(direccion: string): string {
  const bruto = parseInt(direccion.slice(-4), 16);
  const numero = Number.isNaN(bruto) ? 0 : bruto % 10000;
  return `vecino-${numero.toString().padStart(4, "0")}`;
}

function crearIdentidad(): Identidad {
  const direccion = `0x${hexAleatorio(20)}`;
  return {
    seudonimo: seudonimoDeDireccion(direccion),
    direccion,
    creadoEn: Date.now(),
    simulado: true,
  };
}

/**
 * Identidad derivada de la cuenta de Google (ADR-021).
 *
 * Entrar desde otro telefono devuelve el MISMO alias y la misma direccion, asi que
 * los reportes siguen siendo del mismo vecino. Es lo que resuelve el login: continuidad
 * entre dispositivos sin pedirle a nadie que copie una seed phrase.
 *
 * Limite declarado: esto es una derivacion de demostracion, no una funcion de derivacion
 * de claves. No produce una llave con la que firmar — produce un identificador estable.
 * La version de produccion usa wallet abstraction (Privy/Web3Auth) y el vinculo cifrado
 * lo custodia IdentityEscrow.
 */
export async function derivarIdentidadDeCuenta(
  idCuenta: string,
  creadoEn: number,
): Promise<Identidad> {
  const datos = new TextEncoder().encode(`${SAL_DERIVACION}${idCuenta}`);
  const digest = await crypto.subtle.digest("SHA-256", datos);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const direccion = `0x${hex.slice(0, 40)}`;

  return {
    seudonimo: seudonimoDeDireccion(direccion),
    direccion,
    creadoEn,
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
