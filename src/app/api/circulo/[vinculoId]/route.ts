import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { googleConfigurado } from "@/lib/auth/config";

/**
 * Canal del circulo de cuidado (ADR-046): un buzon efimero de sobres cifrados.
 *
 * QUE VE ESTE SERVIDOR: un id inadivinable y un blob cifrado {iv, datos}. Nada mas.
 * La clave viaja en el fragmento del enlace de invitacion, que el navegador nunca envia,
 * asi que aqui no se puede leer la posicion de nadie ni con acceso total al servidor.
 *
 * DONDE SE GUARDA:
 *   - Con UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN: en Redis con TTL — cada
 *     sobre caduca solo. Es lo que hace falta en Vercel, donde cada invocacion puede
 *     caer en una instancia distinta.
 *   - Sin ellas: en un Map del proceso. Funciona completo en `next dev` (un solo
 *     proceso) y en la demo local; en Vercel sin KV el canal seria una loteria de
 *     instancias, por eso la respuesta avisa `efimero: true`.
 *
 * Sesion obligatoria en todos los metodos: el circulo entero exige cuenta (ADR-102) y
 * este buzon no es una excepcion. La sesion ademas alimenta el limite de frecuencia.
 */

export const maxDuration = 10;

/** TTL maximo por sobre. Compartir "indefinido" es re-publicar, no un sobre eterno. */
const TTL_MAX_SEGUNDOS = 900;
const TTL_MIN_SEGUNDOS = 60;

/** Un sobre AES-GCM de una posicion pesa ~300 bytes; 4 KB ya es otra cosa. */
const MAX_BYTES_SOBRE = 4096;

const VINCULO_VALIDO = /^[A-Za-z0-9_-]{16,64}$/;
const B64URL = /^[A-Za-z0-9_-]+$/;

/** Limite por sesion: 12 escrituras por minuto alcanzan para un latido de 20 s. */
const ESCRITURAS_POR_MINUTO = 12;

interface SobreGuardado {
  iv: string;
  datos: string;
  publicadoEn: number;
  expiraEn: number;
}

/* --- Respaldo en memoria (dev y despliegues sin KV) --------------------------------- */

const memoria = new Map<string, SobreGuardado>();

function barrerMemoria(ahora: number): void {
  if (memoria.size < 500) return;
  for (const [clave, sobre] of memoria) {
    if (sobre.expiraEn <= ahora) memoria.delete(clave);
  }
}

/* --- KV via Upstash REST (sin dependencias: es HTTP plano) --------------------------- */

function configKv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function kvSet(clave: string, valor: SobreGuardado, ttlSegundos: number): Promise<void> {
  const kv = configKv();
  if (!kv) throw new Error("sin kv");
  const respuesta = await fetch(`${kv.url}/set/${clave}?EX=${ttlSegundos.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kv.token}` },
    body: JSON.stringify(valor),
    signal: AbortSignal.timeout(4000),
  });
  if (!respuesta.ok) throw new Error(`kv set ${respuesta.status.toString()}`);
}

async function kvGet(clave: string): Promise<SobreGuardado | null> {
  const kv = configKv();
  if (!kv) throw new Error("sin kv");
  const respuesta = await fetch(`${kv.url}/get/${clave}`, {
    headers: { Authorization: `Bearer ${kv.token}` },
    signal: AbortSignal.timeout(4000),
  });
  if (!respuesta.ok) throw new Error(`kv get ${respuesta.status.toString()}`);
  const cuerpo = (await respuesta.json()) as { result: string | null };
  if (!cuerpo.result) return null;
  try {
    return JSON.parse(cuerpo.result) as SobreGuardado;
  } catch {
    return null;
  }
}

async function kvDel(clave: string): Promise<void> {
  const kv = configKv();
  if (!kv) throw new Error("sin kv");
  await fetch(`${kv.url}/del/${clave}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kv.token}` },
    signal: AbortSignal.timeout(4000),
  });
}

/* --- Limite de escrituras por sesion -------------------------------------------------- */

const escrituras = new Map<string, { ventana: number; cuenta: number }>();

function excedeLimite(sesionId: string, ahora: number): boolean {
  const ventana = Math.floor(ahora / 60_000);
  const actual = escrituras.get(sesionId);
  if (!actual || actual.ventana !== ventana) {
    escrituras.set(sesionId, { ventana, cuenta: 1 });
    if (escrituras.size > 1000) escrituras.clear();
    return false;
  }
  actual.cuenta += 1;
  return actual.cuenta > ESCRITURAS_POR_MINUTO;
}

/* --- Handlers ------------------------------------------------------------------------ */

type Contexto = { params: Promise<{ vinculoId: string }> };

async function validarAcceso(contexto: Contexto): Promise<
  | { ok: true; vinculoId: string; sesionId: string }
  | { ok: false; respuesta: NextResponse }
> {
  // La misma valvula que la puerta de acceso: sin login configurado no puede existir
  // ninguna sesion, y exigirla dejaria el canal muerto en local y en despliegues sin
  // variables. El contenido va cifrado de extremo a extremo de todas formas.
  let sesionId = "sin-login-configurado";
  if (googleConfigurado()) {
    const sesion = await auth();
    if (!sesion?.user) {
      return {
        ok: false,
        respuesta: NextResponse.json({ error: "El circulo pide una cuenta." }, { status: 401 }),
      };
    }
    sesionId = sesion.user.id ?? sesion.user.email ?? "anonima";
  }

  const { vinculoId } = await contexto.params;
  if (!VINCULO_VALIDO.test(vinculoId)) {
    return {
      ok: false,
      respuesta: NextResponse.json({ error: "Vinculo invalido." }, { status: 400 }),
    };
  }

  return { ok: true, vinculoId, sesionId };
}

export async function PUT(solicitud: NextRequest, contexto: Contexto): Promise<NextResponse> {
  const acceso = await validarAcceso(contexto);
  if (!acceso.ok) return acceso.respuesta;

  const ahora = Date.now();
  if (excedeLimite(acceso.sesionId, ahora)) {
    return NextResponse.json({ error: "Demasiadas publicaciones. Espera un momento." }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    const crudo = await solicitud.text();
    if (crudo.length > MAX_BYTES_SOBRE) {
      return NextResponse.json({ error: "Sobre demasiado grande." }, { status: 413 });
    }
    cuerpo = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "Cuerpo ilegible." }, { status: 400 });
  }

  const c = cuerpo as { iv?: unknown; datos?: unknown; ttlSegundos?: unknown };
  if (
    typeof c.iv !== "string" ||
    !B64URL.test(c.iv) ||
    c.iv.length > 24 ||
    typeof c.datos !== "string" ||
    !B64URL.test(c.datos) ||
    c.datos.length > MAX_BYTES_SOBRE
  ) {
    return NextResponse.json({ error: "Sobre malformado." }, { status: 400 });
  }

  const ttl = Math.min(
    TTL_MAX_SEGUNDOS,
    Math.max(TTL_MIN_SEGUNDOS, typeof c.ttlSegundos === "number" ? Math.floor(c.ttlSegundos) : 300),
  );

  const sobre: SobreGuardado = {
    iv: c.iv,
    datos: c.datos,
    publicadoEn: ahora,
    expiraEn: ahora + ttl * 1000,
  };

  let efimero = true;
  if (configKv()) {
    try {
      await kvSet(`circulo:${acceso.vinculoId}`, sobre, ttl);
      efimero = false;
    } catch (error) {
      console.warn("[vecino-seguro] KV del circulo fallo; se usa memoria", error);
      memoria.set(acceso.vinculoId, sobre);
    }
  } else {
    barrerMemoria(ahora);
    memoria.set(acceso.vinculoId, sobre);
  }

  return NextResponse.json({ ok: true, efimero });
}

export async function GET(_solicitud: NextRequest, contexto: Contexto): Promise<NextResponse> {
  const acceso = await validarAcceso(contexto);
  if (!acceso.ok) return acceso.respuesta;

  const ahora = Date.now();
  let sobre: SobreGuardado | null = null;

  if (configKv()) {
    try {
      sobre = await kvGet(`circulo:${acceso.vinculoId}`);
    } catch (error) {
      console.warn("[vecino-seguro] KV del circulo fallo al leer", error);
      sobre = memoria.get(acceso.vinculoId) ?? null;
    }
  } else {
    sobre = memoria.get(acceso.vinculoId) ?? null;
  }

  if (sobre && sobre.expiraEn <= ahora) {
    memoria.delete(acceso.vinculoId);
    sobre = null;
  }

  return NextResponse.json(
    sobre
      ? { sobre: { iv: sobre.iv, datos: sobre.datos }, publicadoEn: sobre.publicadoEn }
      : { sobre: null, publicadoEn: null },
    // El observador re-consulta cada 20 s; nada de caches intermedios.
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(_solicitud: NextRequest, contexto: Contexto): Promise<NextResponse> {
  const acceso = await validarAcceso(contexto);
  if (!acceso.ok) return acceso.respuesta;

  memoria.delete(acceso.vinculoId);
  if (configKv()) {
    try {
      await kvDel(`circulo:${acceso.vinculoId}`);
    } catch (error) {
      console.warn("[vecino-seguro] KV del circulo fallo al borrar", error);
    }
  }

  return NextResponse.json({ ok: true });
}
