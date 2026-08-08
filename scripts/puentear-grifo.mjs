#!/usr/bin/env node
/**
 * Puentea ETH del grifo desde Ethereum Sepolia (L1) hacia Arbitrum Sepolia (L2).
 *
 *   node scripts/puentear-grifo.mjs          -> deposita 0.04 ETH de testnet
 *   node scripts/puentear-grifo.mjs 0.03     -> otro monto (tope 0.1)
 *
 * Para cuando el faucet solo dio ETH en la L1 (le paso al equipo con el faucet de
 * Google, que no ofrece Arbitrum Sepolia): en vez de mendigar otro faucet, se llama
 * depositEth() en el Inbox oficial de Arbitrum Sepolia y el saldo aparece en la L2
 * en la MISMA direccion, tipicamente en ~10 minutos.
 *
 * Inbox verificado contra docs.arbitrum.io/build-decentralized-apps/reference/useful-addresses.
 * SOLO testnet. La clave se lee de .env.local y jamas se imprime.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createPublicClient, createWalletClient, formatEther, http, parseAbi, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, sepolia } from "viem/chains";

const INBOX_ARBITRUM_SEPOLIA = "0xaAe29B0366299461418F5324a79Afc425BE5ae21";
const ABI_INBOX = parseAbi(["function depositEth() payable returns (uint256)"]);

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rutaEnv = resolve(raiz, ".env.local");
const m = existsSync(rutaEnv)
  ? readFileSync(rutaEnv, "utf8").match(/^GAS_DRIP_PRIVATE_KEY=(0x[0-9a-fA-F]{64})\s*$/m)
  : null;
if (!m) {
  console.error("No hay GAS_DRIP_PRIVATE_KEY en .env.local. Primero: node scripts/crear-grifo.mjs");
  process.exit(1);
}
const cuenta = privateKeyToAccount(m[1]);

const monto = process.argv[2] ?? "0.04";
if (!/^\d+(\.\d+)?$/.test(monto) || Number(monto) <= 0 || Number(monto) > 0.1) {
  console.error("Monto invalido: entre 0 y 0.1 ETH de testnet.");
  process.exit(1);
}

const l1 = createPublicClient({ chain: sepolia, transport: http("https://ethereum-sepolia-rpc.publicnode.com") });
const l2 = createPublicClient({ chain: arbitrumSepolia, transport: http("https://sepolia-rollup.arbitrum.io/rpc") });
const billetera = createWalletClient({
  account: cuenta,
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

// Cinturon: el Inbox tiene que tener bytecode. Si un dia cambia, fallar aqui y no enviando.
const codigo = await l1.getCode({ address: INBOX_ARBITRUM_SEPOLIA });
if (!codigo || codigo === "0x") {
  console.error("El Inbox no tiene bytecode en la L1: no se envia nada. Revisar la direccion.");
  process.exit(1);
}

const saldoL1 = await l1.getBalance({ address: cuenta.address });
const saldoL2Antes = await l2.getBalance({ address: cuenta.address });
console.log(`Grifo: ${cuenta.address}`);
console.log(`  L1 (Ethereum Sepolia): ${formatEther(saldoL1)} ETH`);
console.log(`  L2 (Arbitrum Sepolia): ${formatEther(saldoL2Antes)} ETH`);

if (saldoL1 < parseEther(monto) + parseEther("0.005")) {
  console.error(`Saldo L1 insuficiente para depositar ${monto} y pagar el gas del deposito.`);
  process.exit(1);
}

console.log(`Depositando ${monto} ETH de testnet al Inbox de Arbitrum Sepolia...`);
const tx = await billetera.writeContract({
  address: INBOX_ARBITRUM_SEPOLIA,
  abi: ABI_INBOX,
  functionName: "depositEth",
  value: parseEther(monto),
});
console.log(`tx L1: https://sepolia.etherscan.io/tx/${tx}`);

const recibo = await l1.waitForTransactionReceipt({ hash: tx });
if (recibo.status !== "success") {
  console.error("El deposito revirtio en la L1. Nada llego al puente.");
  process.exit(1);
}
console.log("Deposito confirmado en la L1. El credito en la L2 tarda ~10 minutos.");

// Espera acotada: si no llega dentro del limite, se sale avisando — el credito llega igual.
const LIMITE_MS = 7 * 60 * 1000;
const inicio = Date.now();
process.stdout.write("Esperando el credito en la L2");
while (Date.now() - inicio < LIMITE_MS) {
  await new Promise((r) => setTimeout(r, 20_000));
  const saldo = await l2.getBalance({ address: cuenta.address });
  if (saldo > saldoL2Antes) {
    console.log(`\nLLEGO: saldo del grifo en Arbitrum Sepolia: ${formatEther(saldo)} ETH`);
    process.exit(0);
  }
  process.stdout.write(".");
}
console.log("\nAun en camino (normal hasta ~15 min). Verificar luego con el saldo en la L2.");
