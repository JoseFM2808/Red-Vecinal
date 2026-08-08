import type { SobreCifrado } from "./circulo-cifrado";

/**
 * Cliente del canal del circulo (ADR-046). Lado navegador de /api/circulo/[vinculoId].
 *
 * Deliberadamente tonto: sube y baja sobres opacos. Cifrar y descifrar es asunto de
 * quien tiene la clave (circulo-cifrado.ts); decidir que hacer con el contenido es del
 * proveedor. Los errores no lanzan: compartir ubicacion es best-effort y un fallo de
 * red no debe tumbar el latido — se reintenta en el siguiente.
 */

export interface ResultadoPublicar {
  ok: boolean;
  /** true = el canal es memoria de un solo proceso (sin KV): sirve en dev, no en Vercel. */
  efimero: boolean;
}

export async function publicarSobre(
  vinculoId: string,
  sobre: SobreCifrado,
  ttlSegundos: number,
): Promise<ResultadoPublicar> {
  try {
    const respuesta = await fetch(`/api/circulo/${encodeURIComponent(vinculoId)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ iv: sobre.iv, datos: sobre.datos, ttlSegundos }),
    });
    if (!respuesta.ok) return { ok: false, efimero: true };
    const cuerpo = (await respuesta.json()) as { efimero?: boolean };
    return { ok: true, efimero: cuerpo.efimero !== false };
  } catch {
    return { ok: false, efimero: true };
  }
}

export async function leerSobre(vinculoId: string): Promise<SobreCifrado | null> {
  try {
    const respuesta = await fetch(`/api/circulo/${encodeURIComponent(vinculoId)}`);
    if (!respuesta.ok) return null;
    const cuerpo = (await respuesta.json()) as { sobre: SobreCifrado | null };
    return cuerpo.sobre;
  } catch {
    return null;
  }
}

export async function borrarSobre(vinculoId: string): Promise<void> {
  try {
    await fetch(`/api/circulo/${encodeURIComponent(vinculoId)}`, { method: "DELETE" });
  } catch {
    // La tumba cifrada ya aviso al observador; el borrado es cortesia con el canal.
  }
}
