import { CONFIG } from "../config";
import { hashDeArchivo } from "../hash";
import type { Evidencia } from "../tipos";

/**
 * Adaptador de evidencia (IPFS).
 *
 * La foto es lo unico pesado del reporte y lo mas sensible. Nunca pasa por un
 * servidor nuestro: va a IPFS y a la cadena solo llega su CID dentro del hash.
 *
 * La beta usa el adaptador simulado, que deriva un CID determinista del SHA-256
 * del archivo. Conectar Pinata es implementar `subir()` con el JWT en variables
 * de entorno de Vercel — el JWT nunca se commitea.
 */

export interface AdaptadorEvidencia {
  readonly id: "simulado" | "pinata";
  readonly simulado: boolean;
  subir(archivo: File): Promise<Evidencia>;
  urlGateway(cid: string): string;
}

/** Ancho maximo de la miniatura guardada en el dispositivo. */
const ANCHO_MINIATURA = 640;
const CALIDAD_MINIATURA = 0.7;

/** Reduce la imagen antes de guardarla: una foto de 4 MB llena localStorage sola. */
async function generarMiniatura(archivo: File): Promise<string | null> {
  if (typeof document === "undefined" || !archivo.type.startsWith("image/")) return null;

  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen"));
      el.src = url;
    });

    const escala = Math.min(1, ANCHO_MINIATURA / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", CALIDAD_MINIATURA);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function crearAdaptadorSimulado(): AdaptadorEvidencia {
  return {
    id: "simulado",
    simulado: true,

    async subir(archivo: File): Promise<Evidencia> {
      const buffer = await archivo.arrayBuffer();
      const hash = await hashDeArchivo(buffer);
      return {
        // Prefijo "bafy" para que se vea como un CID v1 sin fingir que lo es:
        // el adaptador se declara simulado y la UI lo etiqueta.
        cid: `bafy${hash.slice(0, 46)}`,
        miniatura: await generarMiniatura(archivo),
        bytes: archivo.size,
        simulado: true,
      };
    },

    urlGateway(cid: string): string {
      return `${CONFIG.ipfsGateway}${cid}`;
    },
  };
}

let cache: AdaptadorEvidencia | null = null;

export function obtenerAdaptadorDeEvidencia(): AdaptadorEvidencia {
  cache ??= crearAdaptadorSimulado();
  return cache;
}
