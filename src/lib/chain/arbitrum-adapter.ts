import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  keccak256,
  parseAbi,
  stringToHex,
  type Address,
} from "viem";
import { arbitrumSepolia, arbitrum } from "viem/chains";
import type { CONFIG } from "../config";
import type { ReciboCadena } from "../tipos";
import { ABI_REPORT_REGISTRY, ABI_TOKEN_REWARD } from "./abis";
import { obtenerProveedorInyectado } from "./proveedor-inyectado";
import { obtenerRed, urlTransaccion } from "./redes";
import type { AdaptadorCadena, EntradaAnclaje } from "./types";

/**
 * ArbitrumChainAdapter (ADR-030).
 *
 * Implementa AdaptadorCadena contra los contratos reales. Firma con lo que
 * exponga `obtenerProveedorInyectado()` (MetaMask u otra wallet inyectada):
 * el equipo aun no eligio Privy/Web3Auth, y esta es la unica pieza que ese
 * reemplazo tocaria — ninguna pantalla, ni este archivo mas alla de esa
 * llamada.
 *
 * Guia de origen: docs/SIGUIENTES-PASOS-ARBITRUM.md
 */

const ABI_REGISTRY = parseAbi(ABI_REPORT_REGISTRY);
const ABI_TOKEN = parseAbi(ABI_TOKEN_REWARD);

const CADENA_VIEM_POR_ID: Record<number, typeof arbitrumSepolia | typeof arbitrum> = {
  421614: arbitrumSepolia,
  42161: arbitrum,
};

type Config = typeof CONFIG;

function requerirDireccion(valor: string, nombre: string): Address {
  if (!valor || !/^0x[0-9a-fA-F]{40}$/.test(valor)) {
    throw new Error(`Direccion de ${nombre} invalida o vacia. Revisa las variables de entorno.`);
  }
  return valor as Address;
}

export function crearAdaptadorArbitrum(config: Config): AdaptadorCadena {
  const red = obtenerRed(config.chainId);
  const cadenaViem = CADENA_VIEM_POR_ID[config.chainId];
  if (!cadenaViem) {
    throw new Error(`No hay definicion de viem para la red ${config.chainId}.`);
  }

  const direccionRegistry = requerirDireccion(config.direcciones.reportRegistry, "ReportRegistry");
  const direccionToken = config.direcciones.tokenReward
    ? requerirDireccion(config.direcciones.tokenReward, "TokenReward")
    : null;

  const publicClient = createPublicClient({ chain: cadenaViem, transport: http(red.rpcPublico) });

  return {
    id: "arbitrum",
    red,
    simulado: false,
    explicacion: `Anclando de verdad en ${red.nombre}.`,

    async anclarReporte(entrada: EntradaAnclaje): Promise<ReciboCadena> {
      const proveedor = obtenerProveedorInyectado();
      if (!proveedor) {
        throw new Error(
          "No se encontro una wallet compatible en el navegador. Instala MetaMask (u otra wallet " +
            "inyectada) y conectala a Arbitrum Sepolia para anclar tu reporte.",
        );
      }

      const [cuenta] = await proveedor.request({ method: "eth_requestAccounts" });
      if (!cuenta) {
        throw new Error("La wallet no devolvio ninguna cuenta. Desbloqueala e intenta de nuevo.");
      }

      const walletClient = createWalletClient({
        chain: cadenaViem,
        transport: custom(proveedor),
        account: cuenta as Address,
      });

      let txHash: `0x${string}`;
      try {
        txHash = await walletClient.writeContract({
          address: direccionRegistry,
          abi: ABI_REGISTRY,
          functionName: "submitReport",
          args: [
            entrada.contentHash as `0x${string}`,
            entrada.latE6,
            entrada.lngE6,
            entrada.categoriaIndice,
            // El zonaId del cliente es un string ("z2391_-15409"); bytes32 necesita
            // longitud fija, asi que se hashea. Es la opcion que el propio handoff
            // deja abierta (docs/SIGUIENTES-PASOS-ARBITRUM.md) — el equipo de
            // contratos puede pedir un formato distinto, ver ADR-030.
            keccak256(stringToHex(entrada.zonaId)),
            entrada.cid ?? "",
          ],
        });
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? `La wallet rechazo o no pudo enviar la transaccion: ${error.message}`
            : "La wallet rechazo o no pudo enviar la transaccion.",
        );
      }

      const recibo = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (recibo.status !== "success") {
        throw new Error("La transaccion se revirtio en Arbitrum. El reporte no quedo anclado.");
      }

      let costoGasUsd = red.costoAnclajeUsd;
      if (recibo.effectiveGasPrice) {
        const gasEth = Number(formatUnits(recibo.gasUsed * recibo.effectiveGasPrice, 18));
        // Estimacion de precio de ETH solo para mostrar un numero de referencia en la UI;
        // se reemplaza por la medicion real del equipo de contratos (ver checklist del handoff).
        costoGasUsd = gasEth * 2500;
      }

      return {
        txHash,
        bloque: Number(recibo.blockNumber),
        chainId: red.chainId,
        urlExplorador: urlTransaccion(red.chainId, txHash),
        costoGasUsd,
        confirmadoEn: Date.now(),
        simulado: false,
      };
    },

    async saldoRecompensas(direccion: string): Promise<number> {
      if (!direccionToken) return 0;
      const monto = await publicClient.readContract({
        address: direccionToken,
        abi: ABI_TOKEN,
        functionName: "balanceOf",
        args: [direccion as Address],
      });
      return Number(formatUnits(monto, 18));
    },
  };
}
