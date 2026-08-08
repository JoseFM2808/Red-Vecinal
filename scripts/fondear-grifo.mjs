#!/usr/bin/env node
/**
 * Fondea el grifo de gas (ADR-051) desde la wallet del despliegue, sin faucet ni captcha.
 *
 *   node scripts/fondear-grifo.mjs           -> envia 0.03 ETH de Sepolia al grifo
 *   node scripts/fondear-grifo.mjs 0.05      -> envia otro monto (maximo 0.1)
 *
 * Lee GAS_DRIP_PRIVATE_KEY de .env.local (el destino) y DEPLOYER_PRIVATE_KEY de
 * contracts/.env (el origen). Ninguna clave se imprime nunca. SOLO Arbitrum Sepolia:
 * el script esta clavado a esa red a proposito.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function leerClave(ruta, nombre) {
  if (!existsSync(ruta)) return null;
  const m = readFileSync(ruta, "utf8").match(new RegExp(`^${nombre}=(0x[0-9a-fA-F]{64})\\s*$`, "m"));
  return m ? m[1] : null;
}

const claveGrifo = leerClave(resolve(raiz, ".env.local"), "GAS_DRIP_PRIVATE_KEY");
if (!claveGrifo) {
  console.error("No hay GAS_DRIP_PRIVATE_KEY en .env.local. Primero: node scripts/crear-grifo.mjs");
  process.exit(1);
}
const grifo = privateKeyToAccount(claveGrifo).address;

const claveOrigen = leerClave(resolve(raiz, "contracts", ".env"), "DEPLOYER_PRIVATE_KEY");
if (!claveOrigen) {
  console.error("No hay DEPLOYER_PRIVATE_KEY en contracts/.env en esta maquina.");
  console.error("Opciones: correr este script en la maquina que desplego los contratos,");
  console.error(`o fondear a mano desde cualquier wallet enviando ETH de Sepolia a:`);
  console.error(`  ${grifo}`);
  process.exit(1);
}

const monto = process.argv[2] ?? "0.03";
if (!/^\d+(\.\d+)?$/.test(monto) || Number(monto) <= 0 || Number(monto) > 0.1) {
  console.error("Monto invalido: entre 0 y 0.1 ETH de testnet.");
  process.exit(1);
}

const transporte = http("https://sepolia-rollup.arbitrum.io/rpc");
const publico = createPublicClient({ chain: arbitrumSepolia, transport: transporte });
const origen = privateKeyToAccount(claveOrigen);
const billetera = createWalletClient({ account: origen, chain: arbitrumSepolia, transport: transporte });

const saldoOrigen = await publico.getBalance({ address: origen.address });
console.log(`Origen  (despliegue): ${origen.address} — ${formatEther(saldoOrigen)} ETH`);
console.log(`Destino (grifo)     : ${grifo}`);

if (saldoOrigen < parseEther(monto)) {
  console.error(`La wallet del despliegue no tiene ${monto} ETH de Sepolia disponibles.`);
  process.exit(1);
}

console.log(`Enviando ${monto} ETH de Sepolia...`);
const tx = await billetera.sendTransaction({ to: grifo, value: parseEther(monto) });
console.log(`tx: https://sepolia.arbiscan.io/tx/${tx}`);

await publico.waitForTransactionReceipt({ hash: tx });
const saldoGrifo = await publico.getBalance({ address: grifo });
console.log(`Listo. Saldo del grifo: ${formatEther(saldoGrifo)} ETH de Sepolia.`);
console.log("Ultimo paso: reiniciar el servidor para que lea el .env.local nuevo.");
