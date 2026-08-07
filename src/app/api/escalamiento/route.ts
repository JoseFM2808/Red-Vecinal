import { NextResponse } from "next/server";

/**
 * Puente con la autoridad (ADR-010).
 *
 * Es la segunda ruta de respuesta del producto: la red vecinal se entera siempre,
 * y ademas el vecino puede escalar a serenazgo, policia o ambulancia.
 *
 * Aqui el destino es simulado porque no hay convenio con ningun municipio para el
 * hackathon — pero el contrato de integracion es real: valida el payload, emite un
 * folio y, si existe ESCALATION_WEBHOOK_URL, lo reenvia de verdad. Conectar un
 * serenazgo es configurar una variable de entorno, no reescribir esta ruta.
 *
 * Lo que se envia NO incluye identidad: hash del reporte, categoria, zona y
 * coordenada ya truncada. El vinculo con la persona sigue en IdentityEscrow.
 */

/**
 * Tope de la funcion serverless en Vercel. El fetch al municipio ya se aborta a los 4 s,
 * asi que esto es solo el cinturon de seguridad de segundo nivel.
 */
export const maxDuration = 10;

/** Si el canal de la autoridad no responde en 4 s, se corta y se devuelve el respaldo. */
const TIMEOUT_WEBHOOK_MS = 4000;

const DESTINOS = new Set(["serenazgo", "policia", "ambulancia"]);

interface CuerpoEscalamiento {
  contentHash: string;
  categoria: string;
  destino: string;
  coordenada: { lat: number; lng: number };
  zonaNombre: string;
  cid: string | null;
}

function validar(datos: unknown): CuerpoEscalamiento | null {
  if (typeof datos !== "object" || datos === null) return null;
  const d = datos as Record<string, unknown>;

  const coordenada = d.coordenada as { lat?: unknown; lng?: unknown } | undefined;
  if (
    typeof d.contentHash !== "string" ||
    !/^0x[0-9a-f]{64}$/i.test(d.contentHash) ||
    typeof d.categoria !== "string" ||
    typeof d.destino !== "string" ||
    !DESTINOS.has(d.destino) ||
    typeof coordenada !== "object" ||
    coordenada === null ||
    typeof coordenada.lat !== "number" ||
    typeof coordenada.lng !== "number"
  ) {
    return null;
  }

  return {
    contentHash: d.contentHash,
    categoria: d.categoria,
    destino: d.destino,
    coordenada: { lat: coordenada.lat, lng: coordenada.lng },
    zonaNombre: typeof d.zonaNombre === "string" ? d.zonaNombre : "Zona sin referencia",
    cid: typeof d.cid === "string" ? d.cid : null,
  };
}

/** Folio derivado del hash del reporte: el mismo reporte no genera dos folios. */
function generarFolio(contentHash: string): string {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `VS-${fecha}-${contentHash.slice(2, 8).toUpperCase()}`;
}

const ETIQUETA_DESTINO: Record<string, string> = {
  serenazgo: "Central de serenazgo del distrito",
  policia: "Comisaria de la jurisdiccion",
  ambulancia: "Central de emergencias medicas",
};

export async function POST(request: Request) {
  let datos: unknown;
  try {
    datos = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const cuerpo = validar(datos);
  if (!cuerpo) {
    return NextResponse.json(
      { error: "Faltan campos o el hash del reporte no es valido" },
      { status: 422 },
    );
  }

  const folio = generarFolio(cuerpo.contentHash);
  const webhook = process.env.ESCALATION_WEBHOOK_URL;

  // Payload exacto que recibiria el municipio. Sin identidad del reportante.
  const aviso = {
    folio,
    origen: "vecino-seguro",
    destino: cuerpo.destino,
    categoria: cuerpo.categoria,
    zona: cuerpo.zonaNombre,
    coordenada: cuerpo.coordenada,
    evidenciaCid: cuerpo.cid,
    pruebaOnChain: cuerpo.contentHash,
    emitidoEn: new Date().toISOString(),
  };

  if (webhook) {
    try {
      const respuesta = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(aviso),
        // Sin esto, un municipio con el servidor caido dejaria la funcion colgada hasta
        // el limite de Vercel y el vecino mirando un boton que gira. El aviso vale poco
        // si tarda un minuto: se corta a los 4 s y se responde con el respaldo.
        signal: AbortSignal.timeout(TIMEOUT_WEBHOOK_MS),
      });
      return NextResponse.json({
        folio,
        simulado: false,
        aceptado: respuesta.ok,
        mensaje: respuesta.ok
          ? `Aviso entregado a ${ETIQUETA_DESTINO[cuerpo.destino]}.`
          : "El canal de la autoridad no respondio. El reporte sigue publicado en la red vecinal.",
        aviso,
      });
    } catch {
      return NextResponse.json({
        folio,
        simulado: false,
        aceptado: false,
        mensaje: "No se pudo contactar al canal de la autoridad. El reporte sigue en la red vecinal.",
        aviso,
      });
    }
  }

  return NextResponse.json({
    folio,
    simulado: true,
    aceptado: true,
    mensaje: `Aviso preparado para ${ETIQUETA_DESTINO[cuerpo.destino]}. Sin convenio municipal activo, el envio es simulado.`,
    aviso,
  });
}
