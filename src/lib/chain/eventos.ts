import { createPublicClient, http, parseAbi, parseAbiItem, formatUnits, type Address } from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import type { CONFIG } from "../config";
import { categoriaPorIndice } from "../categorias";
import { desdeMicrogrados, zonaIdDe } from "../geo";
import { seudonimoDeDireccion } from "../identidad";
import type { Coordenada, Evidencia, IdCategoria, Reporte } from "../tipos";
import { nombreDeZona } from "../zonas";
import { ABI_TOKEN_REWARD, EVENTO_REPORT_SUBMITTED } from "./abis";
import { obtenerRed, urlTransaccion } from "./redes";

/**
 * Indice compartido via eventos (ADR-032, docs/SIGUIENTES-PASOS-ARBITRUM.md §6).
 *
 * `leerReportesDesdeCadena` hace la parte con IO (getLogs + lectura de recompensa).
 * `fusionarConCadena` es pura y con test: decide que se muestra cuando el mismo
 * reporte existe local y remoto, y que campos quedan incompletos para los que
 * solo se conocen por el evento (sin descripcion, sin corroboraciones todavia).
 */

const ABI_TOKEN = parseAbi(ABI_TOKEN_REWARD);
const EVENTO_ANALIZADO = parseAbiItem(EVENTO_REPORT_SUBMITTED);

/** Rango de bloques por llamada a getLogs: los RPC publicos limitan el rango. */
const TAMANO_LOTE_BLOQUES = 100_000n;

const CADENA_VIEM_POR_ID: Record<number, typeof arbitrumSepolia | typeof arbitrum> = {
  421614: arbitrumSepolia,
  42161: arbitrum,
};

/** Lo que se puede reconstruir de un reporte a partir de ReportSubmitted + TokenReward. */
export interface ReporteRemoto {
  reportId: bigint;
  contentHash: string;
  autorDireccion: string;
  coordenada: Coordenada;
  categoria: IdCategoria;
  creadoEn: number;
  cid: string;
  txHash: string;
  bloque: number;
  chainId: number;
  recompensaMonto: number;
  recompensaOtorgada: boolean;
}

type Config = typeof CONFIG;

export async function leerReportesDesdeCadena(config: Config): Promise<ReporteRemoto[]> {
  const red = obtenerRed(config.chainId);
  const cadenaViem = CADENA_VIEM_POR_ID[config.chainId];
  if (!cadenaViem || !config.direcciones.reportRegistry) return [];

  const publicClient = createPublicClient({ chain: cadenaViem, transport: http(red.rpcPublico) });
  const direccionRegistry = config.direcciones.reportRegistry as Address;
  const direccionToken = config.direcciones.tokenReward as Address | "";

  const obtenerLote = (desde: bigint, hasta: bigint) =>
    publicClient.getLogs({
      address: direccionRegistry,
      event: EVENTO_ANALIZADO,
      fromBlock: desde,
      toBlock: hasta,
    });

  const bloqueActual = await publicClient.getBlockNumber();
  const logs: Awaited<ReturnType<typeof obtenerLote>> = [];

  for (let desde = config.reportRegistryDeployBlock; desde <= bloqueActual; desde += TAMANO_LOTE_BLOQUES) {
    const hasta = desde + TAMANO_LOTE_BLOQUES - 1n > bloqueActual ? bloqueActual : desde + TAMANO_LOTE_BLOQUES - 1n;
    const lote = await obtenerLote(desde, hasta);
    logs.push(...lote);
  }

  const remotos: ReporteRemoto[] = [];
  for (const log of logs) {
    const args = log.args as {
      reportId?: bigint;
      contentHash?: string;
      latE6?: number;
      lngE6?: number;
      category?: number;
      timestamp?: bigint;
      cid?: string;
      reporter?: string;
    };
    if (
      args.reportId === undefined ||
      !args.contentHash ||
      args.latE6 === undefined ||
      args.lngE6 === undefined ||
      args.category === undefined ||
      !args.reporter
    ) {
      continue;
    }

    const categoria = categoriaPorIndice(args.category);
    if (!categoria) continue;

    let recompensaMonto = 0;
    let recompensaOtorgada = false;
    if (direccionToken) {
      try {
        const [monto, liberado] = await publicClient.readContract({
          address: direccionToken,
          abi: ABI_TOKEN,
          functionName: "pendingReward",
          args: [args.reportId],
        });
        recompensaMonto = Number(formatUnits(monto, 18));
        recompensaOtorgada = liberado;
      } catch {
        // TokenReward no desplegado aun o llamada fallida: se muestra sin recompensa.
      }
    }

    remotos.push({
      reportId: args.reportId,
      contentHash: args.contentHash,
      autorDireccion: args.reporter,
      coordenada: { lat: desdeMicrogrados(args.latE6), lng: desdeMicrogrados(args.lngE6) },
      categoria: categoria.id,
      creadoEn: args.timestamp ? Number(args.timestamp) * 1000 : Date.now(),
      cid: args.cid ?? "",
      txHash: log.transactionHash ?? "",
      bloque: log.blockNumber ? Number(log.blockNumber) : 0,
      chainId: red.chainId,
      recompensaMonto,
      recompensaOtorgada,
    });
  }

  return remotos;
}

function evidenciaDeRemoto(remoto: ReporteRemoto): Evidencia | null {
  if (!remoto.cid) return null;
  return { cid: remoto.cid, miniatura: null, bytes: 0, simulado: false };
}

function reporteDeRemoto(remoto: ReporteRemoto): Reporte {
  const zonaId = zonaIdDe(remoto.coordenada);
  return {
    id: `onchain-${remoto.reportId.toString()}`,
    categoria: remoto.categoria,
    // Sin descripcion: el evento no la lleva y no hay indice off-chain que la resuelva
    // todavia. Queda declarado como limite, no oculto (ver ADR-032).
    descripcion: "",
    coordenada: remoto.coordenada,
    zonaId,
    zonaNombre: nombreDeZona(remoto.coordenada),
    creadoEn: remoto.creadoEn,
    autorSeudonimo: seudonimoDeDireccion(remoto.autorDireccion),
    autorDireccion: remoto.autorDireccion,
    contentHash: remoto.contentHash,
    evidencia: evidenciaDeRemoto(remoto),
    cadena: {
      txHash: remoto.txHash,
      bloque: remoto.bloque,
      chainId: remoto.chainId,
      urlExplorador: urlTransaccion(remoto.chainId, remoto.txHash),
      costoGasUsd: 0,
      confirmadoEn: remoto.creadoEn,
      simulado: false,
    },
    estadoAnclaje: "anclado",
    recompensa: {
      monto: remoto.recompensaMonto,
      simbolo: "VSG",
      multiplicador: 1,
      estado: remoto.recompensaOtorgada ? "otorgada" : "pendiente_corroboracion",
      motivo: "Sincronizado desde Arbitrum. Las corroboraciones de otros dispositivos aun no se leen en esta version.",
    },
    // No se leen eventos de TokenReward.corroborate() todavia (fuera de alcance, ADR-032).
    corroboraciones: [],
    escalamiento: null,
    esSemilla: false,
  };
}

/**
 * Combina lo local (siempre completo, tiene descripcion y evidencia con miniatura)
 * con lo remoto (best-effort). Si el mismo `contentHash` ya esta local, gana lo
 * local: es el propio dispositivo el que lo reporto, no hace falta la version pobre.
 */
export function fusionarConCadena(
  locales: readonly Reporte[],
  remotos: readonly ReporteRemoto[],
): Reporte[] {
  const hashesLocales = new Set(locales.map((r) => r.contentHash.toLowerCase()));
  const nuevos = remotos
    .filter((r) => !hashesLocales.has(r.contentHash.toLowerCase()))
    .map((r) => reporteDeRemoto(r));

  return [...locales, ...nuevos].sort((a, b) => b.creadoEn - a.creadoEn);
}
