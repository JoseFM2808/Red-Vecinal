import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { auth } from "@/auth";
import { googleConfigurado } from "@/lib/auth/config";
import {
  CHAIN_ID_GOTEO,
  MONTO_GOTEO_WEI,
  decidirGoteo,
  esDireccionValida,
} from "@/lib/gas-goteo";

/**
 * Grifo automatico de gas de testnet (ADR-051).
 *
 * POST { direccion } -> si la wallet embebida esta seca, la plataforma le deposita
 * una gota de ETH de Sepolia para que el vecino ancle sin saber que es el gas.
 * Se dispara solo al activar la firma (PuenteFirma): cero pasos manuales.
 *
 * DEFENSAS, en orden:
 *  - Solo Arbitrum Sepolia (CHAIN_ID_GOTEO): en mainnet esta ruta se niega a existir.
 *  - Sesion obligatoria cuando el login esta configurado (misma valvula de siempre).
 *  - La decision vive en gas-goteo.ts (pura, con tests): umbral de saldo, ventana de
 *    6 h por wallet, direccion validada.
 *  - La clave del grifo (GAS_DRIP_PRIVATE_KEY) es secreto de servidor: jamas se
 *    loggea, jamas viaja, y la ruta solo la usa para UNA cosa — enviar el monto fijo
 *    a la direccion validada. No firma nada mas.
 *  - Tope global en memoria por instancia: 30 goteos/hora. Basta para una prueba y
 *    corta un drenado masivo aun sin KV.
 */

export const maxDuration = 30;

const TOPE_GLOBAL_POR_HORA = 30;

/** Ultimo goteo por direccion + contador global. En memoria: suficiente en testnet. */
const ultimoGoteo = new Map<string, number>();
let ventanaGlobal = { hora: 0, cuenta: 0 };

function excedeTopeGlobal(ahora: number): boolean {
  const hora = Math.floor(ahora / 3_600_000);
  if (ventanaGlobal.hora !== hora) ventanaGlobal = { hora, cuenta: 0 };
  ventanaGlobal.cuenta += 1;
  return ventanaGlobal.cuenta > TOPE_GLOBAL_POR_HORA;
}

export async function POST(solicitud: NextRequest): Promise<NextResponse> {
  // La misma valvula que el resto de la app: con login configurado, sesion o nada.
  if (googleConfigurado()) {
    const sesion = await auth();
    if (!sesion?.user) {
      return NextResponse.json({ error: "El grifo pide una cuenta." }, { status: 401 });
    }
  }

  const clave = process.env.GAS_DRIP_PRIVATE_KEY;
  if (!clave || !/^0x[0-9a-fA-F]{64}$/.test(clave)) {
    // Sin grifo configurado la app sigue: la tarjeta de Cuenta lo dice y el equipo
    // puede gotear a mano como respaldo.
    return NextResponse.json(
      { ok: false, goteado: false, codigo: "sin_grifo", mensaje: "El grifo no esta configurado." },
      { status: 503 },
    );
  }

  const chainIdConfigurado = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? CHAIN_ID_GOTEO);

  let direccion: string;
  try {
    const cuerpo = (await solicitud.json()) as { direccion?: unknown };
    direccion = typeof cuerpo.direccion === "string" ? cuerpo.direccion : "";
  } catch {
    return NextResponse.json({ error: "Cuerpo ilegible." }, { status: 400 });
  }

  if (!esDireccionValida(direccion)) {
    return NextResponse.json({ error: "Direccion invalida." }, { status: 400 });
  }

  const ahora = Date.now();
  if (excedeTopeGlobal(ahora)) {
    return NextResponse.json(
      { ok: false, goteado: false, codigo: "tope_global", mensaje: "El grifo descansa un rato." },
      { status: 429 },
    );
  }

  const rpc = http("https://sepolia-rollup.arbitrum.io/rpc");
  const publico = createPublicClient({ chain: arbitrumSepolia, transport: rpc });

  let saldoWei: bigint;
  try {
    saldoWei = await publico.getBalance({ address: direccion as `0x${string}` });
  } catch (error) {
    console.warn("[vecino-seguro] el grifo no pudo leer el saldo", error);
    return NextResponse.json(
      { ok: false, goteado: false, codigo: "rpc_caido", mensaje: "No se pudo leer el saldo." },
      { status: 502 },
    );
  }

  const decision = decidirGoteo({
    chainId: chainIdConfigurado,
    direccion,
    saldoWei,
    ultimoGoteoEn: ultimoGoteo.get(direccion.toLowerCase()) ?? null,
    ahora,
  });

  if (!decision.gotear) {
    return NextResponse.json({ ok: true, goteado: false, codigo: decision.codigo });
  }

  try {
    const cuenta = privateKeyToAccount(clave as `0x${string}`);
    const grifo = createWalletClient({ account: cuenta, chain: arbitrumSepolia, transport: rpc });

    // Se marca ANTES de enviar: si dos pedidos de la misma wallet llegan pegados,
    // el segundo cae en "en_espera" en vez de duplicar el goteo.
    ultimoGoteo.set(direccion.toLowerCase(), ahora);
    if (ultimoGoteo.size > 500) ultimoGoteo.clear();

    const txHash = await grifo.sendTransaction({
      to: direccion as `0x${string}`,
      value: MONTO_GOTEO_WEI,
    });

    return NextResponse.json({ ok: true, goteado: true, codigo: "goteado", txHash });
  } catch (error) {
    // El detalle va al log del servidor; al cliente nunca le viaja el error crudo
    // (podria traer restos de la transaccion del grifo).
    console.warn("[vecino-seguro] el goteo fallo", error);
    ultimoGoteo.delete(direccion.toLowerCase());
    return NextResponse.json(
      { ok: false, goteado: false, codigo: "goteo_fallido", mensaje: "El grifo no pudo enviar." },
      { status: 502 },
    );
  }
}
