import type { Coordenada } from "./tipos";

/**
 * Vinculos del circulo de cuidado (ADR-046): el modelo de WhatsApp.
 *
 * Quien quiere VER genera una invitacion y la muestra como QR o la manda como enlace.
 * Quien la acepta es quien COMPARTE: al aceptar elige por cuanto tiempo (15 min, 1 h,
 * 8 h o indefinido) y puede cortar en cualquier momento con "Dejar de compartir" —
 * la revocacion es inmediata y unilateral, no pide permiso a nadie.
 *
 * La invitacion viaja en el fragmento (#) del enlace a proposito: el fragmento nunca
 * llega al servidor, asi que la clave de cifrado solo existe en los dos telefonos.
 *
 * Todo aqui es puro y sincrono: recibe `ahora`, no lee el reloj ni toca la red.
 */

/* --- Duraciones ------------------------------------------------------------------- */

export interface DuracionCompartir {
  id: string;
  etiqueta: string;
  /** null = indefinida: se comparte hasta que la persona lo detenga. */
  ms: number | null;
}

export const DURACIONES_COMPARTIR: readonly DuracionCompartir[] = [
  { id: "15m", etiqueta: "15 minutos", ms: 15 * 60_000 },
  { id: "1h", etiqueta: "1 hora", ms: 60 * 60_000 },
  { id: "8h", etiqueta: "8 horas", ms: 8 * 60 * 60_000 },
  { id: "indefinida", etiqueta: "Hasta que lo detenga", ms: null },
] as const;

export function duracionPorId(id: string): DuracionCompartir | null {
  return DURACIONES_COMPARTIR.find((d) => d.id === id) ?? null;
}

/* --- Invitacion (lado de quien quiere ver) ----------------------------------------- */

export interface InvitacionCirculo {
  /** Version del formato, por si algun dia cambia. */
  v: 1;
  /** Identificador del canal, 16 bytes base64url. */
  id: string;
  /** Clave AES base64url. Solo existe en los dos telefonos. */
  k: string;
  /** Alias publico de quien invita, para que quien acepta sepa a quien le comparte. */
  alias: string;
}

const B64URL = /^[A-Za-z0-9_-]+$/;

export function esInvitacionValida(valor: unknown): valor is InvitacionCirculo {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    v.v === 1 &&
    typeof v.id === "string" &&
    B64URL.test(v.id) &&
    v.id.length >= 16 &&
    v.id.length <= 64 &&
    typeof v.k === "string" &&
    B64URL.test(v.k) &&
    typeof v.alias === "string" &&
    v.alias.length <= 40
  );
}

/** Serializa la invitacion a un token base64url apto para QR y fragmento de URL. */
export function codificarInvitacion(invitacion: InvitacionCirculo): string {
  const json = JSON.stringify(invitacion);
  // btoa espera latin1; el alias puede traer no-ASCII, asi que se pasa por UTF-8.
  const utf8 = new TextEncoder().encode(json);
  let binario = "";
  for (const b of utf8) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Lee una invitacion desde lo que sea que la persona pego o escaneo: el token pelado,
 * el enlace completo, o una URL con #v=. Devuelve null ante cualquier cosa malformada —
 * este texto llega de un QR ajeno y es hostil hasta que se demuestre lo contrario.
 */
export function decodificarInvitacion(texto: string): InvitacionCirculo | null {
  const limpio = texto.trim();
  if (limpio === "" || limpio.length > 2048) return null;

  // Si es un enlace, quedarse con lo que sigue a #v=
  let token = limpio;
  const marca = limpio.indexOf("#v=");
  if (marca !== -1) token = limpio.slice(marca + 3);
  if (!B64URL.test(token)) return null;

  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    const parseado: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return esInvitacionValida(parseado) ? parseado : null;
  } catch {
    return null;
  }
}

/** El enlace que se comparte por WhatsApp cuando el QR no es practico. */
export function enlaceDeInvitacion(origen: string, invitacion: InvitacionCirculo): string {
  return `${origen.replace(/\/$/, "")}/circulo#v=${codificarInvitacion(invitacion)}`;
}

/* --- Otorgamiento (lado de quien comparte) ------------------------------------------ */

export interface OtorgamientoCirculo {
  vinculoId: string;
  /** La clave del sobre: la misma que trajo la invitacion. */
  clave: string;
  /** Alias de quien te va a ver. */
  aliasObservador: string;
  otorgadoEn: number;
  /** null = indefinido: hasta que la persona lo revoque. */
  expiraEn: number | null;
  revocadoEn: number | null;
}

export type VigenciaOtorgamiento = "activo" | "expirado" | "revocado";

export function vigenciaDe(
  otorgamiento: Pick<OtorgamientoCirculo, "expiraEn" | "revocadoEn">,
  ahora: number,
): VigenciaOtorgamiento {
  // La revocacion gana siempre: es la decision explicita de la persona.
  if (otorgamiento.revocadoEn !== null) return "revocado";
  if (otorgamiento.expiraEn !== null && ahora >= otorgamiento.expiraEn) return "expirado";
  return "activo";
}

/** Texto corto del tiempo restante: "43 min", "7 h", "hasta que lo detengas". */
export function restanteLegible(expiraEn: number | null, ahora: number): string {
  if (expiraEn === null) return "hasta que lo detengas";
  const ms = expiraEn - ahora;
  if (ms <= 0) return "expirado";
  if (ms < 60_000) return "menos de 1 min";
  if (ms < 60 * 60_000) return `${Math.round(ms / 60_000).toString()} min`;
  return `${Math.round(ms / (60 * 60_000)).toString()} h`;
}

/* --- Lo que viaja dentro del sobre cifrado ------------------------------------------ */

/**
 * Contenido del sobre que publica quien comparte. El campo expiraEn viaja CIFRADO para
 * que quien observa sepa cuando dejar de esperar; el servidor no lo ve.
 */
export interface PosicionCompartida {
  coordenada: Coordenada;
  precisionM: number | null;
  timestamp: number;
  alias: string;
  expiraEn: number | null;
  /** true = tumba: la persona corto el compartir. Es el ultimo sobre que se publica. */
  revocado?: boolean;
}

export function esPosicionCompartida(valor: unknown): valor is PosicionCompartida {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  if (v.revocado === true) return typeof v.timestamp === "number";
  const c = v.coordenada as Record<string, unknown> | undefined;
  return (
    typeof c === "object" &&
    c !== null &&
    typeof c.lat === "number" &&
    typeof c.lng === "number" &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180 &&
    typeof v.timestamp === "number" &&
    typeof v.alias === "string"
  );
}
