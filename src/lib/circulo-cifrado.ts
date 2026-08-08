/**
 * Cifrado de extremo a extremo del circulo (ADR-046).
 *
 * La posicion de una persona viaja SIEMPRE cifrada: la clave AES nace en el dispositivo
 * de quien invita, viaja dentro del QR o del enlace (en el fragmento #, que el navegador
 * nunca envia al servidor), y el canal solo ve un sobre opaco {iv, datos}. Ni el servidor
 * de la app ni el proveedor del canal pueden leer donde esta nadie. Es lo que permite
 * tener transporte real sin traicionar la promesa de no guardar datos de nadie.
 *
 * AES-GCM via WebCrypto: existe igual en el navegador y en Node 22, sin dependencias.
 * GCM autentica ademas de cifrar — un sobre manipulado no descifra a basura, descifra
 * a null y se descarta.
 */

export interface SobreCifrado {
  /** IV de 12 bytes, base64url. Uno nuevo por sobre: reutilizarlo rompe GCM. */
  iv: string;
  /** Ciphertext + tag GCM, base64url. */
  datos: string;
}

const aBase64url = (bytes: Uint8Array): string => {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const desdeBase64url = (texto: string): Uint8Array | null => {
  try {
    const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
};

/** Clave AES-128-GCM nueva, exportada como base64url (22 caracteres). */
export async function generarClave(): Promise<string> {
  const clave = await crypto.subtle.generateKey({ name: "AES-GCM", length: 128 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const cruda = new Uint8Array(await crypto.subtle.exportKey("raw", clave));
  return aBase64url(cruda);
}

async function importarClave(claveB64: string, uso: KeyUsage): Promise<CryptoKey | null> {
  const cruda = desdeBase64url(claveB64);
  if (!cruda || cruda.length !== 16) return null;
  try {
    return await crypto.subtle.importKey("raw", cruda as BufferSource, "AES-GCM", false, [uso]);
  } catch {
    return null;
  }
}

/** Cifra un objeto JSON. Lanza solo si la clave es invalida: eso es un bug, no un dato. */
export async function cifrarSobre(claveB64: string, contenido: unknown): Promise<SobreCifrado> {
  const clave = await importarClave(claveB64, "encrypt");
  if (!clave) throw new Error("Clave de circulo invalida");

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const texto = new TextEncoder().encode(JSON.stringify(contenido));
  const cifrado = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    clave,
    texto as BufferSource,
  );

  return { iv: aBase64url(iv), datos: aBase64url(new Uint8Array(cifrado)) };
}

/**
 * Descifra un sobre. Devuelve null ante CUALQUIER problema — clave equivocada, sobre
 * manipulado, base64 roto — porque un sobre ilegible es un dato hostil, no una excepcion.
 */
export async function descifrarSobre<T>(claveB64: string, sobre: SobreCifrado): Promise<T | null> {
  const clave = await importarClave(claveB64, "decrypt");
  const iv = desdeBase64url(sobre.iv);
  const datos = desdeBase64url(sobre.datos);
  if (!clave || !iv || iv.length !== 12 || !datos) return null;

  try {
    const plano = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      clave,
      datos as BufferSource,
    );
    return JSON.parse(new TextDecoder().decode(plano)) as T;
  } catch {
    return null;
  }
}

/** Identificador de vinculo: 16 bytes aleatorios en base64url. Inadivinable. */
export function generarVinculoId(): string {
  return aBase64url(crypto.getRandomValues(new Uint8Array(16)));
}
