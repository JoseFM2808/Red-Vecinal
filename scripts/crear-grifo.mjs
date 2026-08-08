#!/usr/bin/env node
/**
 * Crea la wallet del grifo de gas (ADR-051) y la deja configurada.
 *
 *   node scripts/crear-grifo.mjs
 *
 * Genera una clave nueva y la escribe DIRECTO en .env.local como
 * GAS_DRIP_PRIVATE_KEY. La clave nunca se imprime: en pantalla solo sale la
 * direccion publica, que es lo unico que hace falta para fondearla.
 *
 * SOLO TESTNET: esta wallet es un grifo de ETH de Sepolia sin valor. Jamas
 * reutilizarla para nada real.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rutaEnv = resolve(raiz, ".env.local");

const contenido = existsSync(rutaEnv) ? readFileSync(rutaEnv, "utf8") : "";
const existente = contenido.match(/^GAS_DRIP_PRIVATE_KEY=(0x[0-9a-fA-F]{64})\s*$/m);

if (existente) {
  const cuenta = privateKeyToAccount(existente[1]);
  console.log("El grifo ya estaba configurado en .env.local — no se toca.");
  console.log(`Direccion del grifo (para fondearla): ${cuenta.address}`);
  process.exit(0);
}

const clave = generatePrivateKey();
const cuenta = privateKeyToAccount(clave);

const linea = `\n# Wallet del grifo de gas (ADR-051) — generada por scripts/crear-grifo.mjs.\n# SOLO testnet. La clave vive aqui y en Vercel (Sensitive), nunca en el chat ni en git.\nGAS_DRIP_PRIVATE_KEY=${clave}\n`;
writeFileSync(rutaEnv, contenido + linea, "utf8");

console.log("Grifo creado y guardado en .env.local (la clave no se muestra).");
console.log("");
console.log(`  Direccion del grifo: ${cuenta.address}`);
console.log("");
console.log("Siguiente paso: fondear esa direccion con ETH de Arbitrum Sepolia.");
console.log("  - Con la wallet del despliegue en contracts/.env: node scripts/fondear-grifo.mjs");
console.log("  - O desde cualquier wallet/faucet, enviando a la direccion de arriba.");
