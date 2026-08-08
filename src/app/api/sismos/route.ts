import { NextResponse } from "next/server";
import { FUENTE_SISMOS, normalizarSismosIgp, type SismoOficial } from "@/lib/sismos-oficiales";

/**
 * Sismos oficiales del IGP (ADR-042).
 *
 * POR QUE PASA POR EL SERVIDOR Y NO SE LLAMA DESDE EL NAVEGADOR:
 *
 *   1. CORS. El endpoint del IGP no declara Access-Control-Allow-Origin, asi que un
 *      fetch desde la pagina lo bloquea el navegador.
 *   2. CSP. Llamarlo desde el cliente obligaria a abrir `connect-src` a un dominio mas
 *      en next.config.ts. Desde el servidor, la pagina solo habla con su propio origen.
 *   3. Peso. El IGP devuelve el anio entero (medio megabyte, ~535 sismos). Aqui se
 *      recorta a lo reciente antes de mandarlo al telefono de nadie.
 *
 * La normalizacion vive en src/lib/sismos-oficiales.ts, que es puro y tiene tests.
 * Esta ruta solo trae los bytes y los recorta.
 */

export const maxDuration = 10;

/** El IGP publica por anio; la ruta pide el anio en curso. */
const URL_IGP = (anio: number) =>
  `https://ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/${anio.toString()}`;

const TIMEOUT_MS = 6000;

/** Cuantos sismos se devuelven como maximo. La lista de la app no muestra mas. */
const MAX_SISMOS = 30;

/**
 * Cache en el borde: 60 s de frescura y hasta 5 min sirviendo el anterior mientras
 * revalida. El IGP tarda minutos en publicar un sismo, asi que pedirselo mas seguido
 * no adelanta nada y solo castiga a un servicio publico gratuito.
 */
export const revalidate = 60;

interface RespuestaSismos {
  sismos: SismoOficial[];
  fuente: typeof FUENTE_SISMOS;
  /** Epoch de cuando se consulto. El cliente lo usa para saber si el dato es viejo. */
  consultadoEn: number;
  /** true si la fuente fallo y esto es una respuesta vacia, no una ausencia de sismos. */
  degradado: boolean;
}

export async function GET(): Promise<NextResponse<RespuestaSismos>> {
  const consultadoEn = Date.now();
  const anio = new Date(consultadoEn).getUTCFullYear();

  const responder = (sismos: SismoOficial[], degradado: boolean) =>
    NextResponse.json<RespuestaSismos>(
      { sismos, fuente: FUENTE_SISMOS, consultadoEn, degradado },
      {
        headers: {
          // Mismo criterio que `revalidate`, tambien para cualquier CDN intermedio.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );

  try {
    const respuesta = await fetch(URL_IGP(anio), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
      next: { revalidate },
    });

    if (!respuesta.ok) {
      console.warn(`[vecino-seguro] el IGP respondio ${respuesta.status.toString()}`);
      return responder([], true);
    }

    const crudos: unknown = await respuesta.json();
    const sismos = normalizarSismosIgp(crudos).slice(0, MAX_SISMOS);

    // Una respuesta valida pero vacia tambien es sospechosa: se marca como degradada
    // para que la interfaz no diga "no hay sismos" cuando en realidad no lo sabe.
    return responder(sismos, sismos.length === 0);
  } catch (error) {
    // Timeout, DNS, o el IGP caido. Nunca se propaga: la app tiene que seguir viva.
    console.warn("[vecino-seguro] no se pudo consultar el IGP", error);
    return responder([], true);
  }
}
