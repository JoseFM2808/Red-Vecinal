// Carga contracts/.env (DEPLOYER_PRIVATE_KEY, RPCs) antes de que configVariable() los lea de
// process.env — Hardhat 3 no carga .env por si solo (ver configuration-variables.js).
import "dotenv/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// Mismos chainId y RPC publico que src/lib/chain/redes.ts (frontend) — mantener sincronizados.
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const ARBITRUM_ONE_CHAIN_ID = 42161;

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // Red local simulada, la que usan `hardhat test` y los .t.sol por defecto.
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    arbitrumSepolia: {
      type: "http",
      chainType: "l1",
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      // Default: RPC publico de src/lib/chain/redes.ts. Sobrescribible en contracts/.env si
      // el publico da rate-limit durante el despliegue.
      url: configVariable("ARBITRUM_SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    arbitrumOne: {
      type: "http",
      chainType: "l1",
      chainId: ARBITRUM_ONE_CHAIN_ID,
      url: configVariable("ARBITRUM_ONE_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    // Nodo local que imita el chainId de Arbitrum Sepolia (`hardhat node --chain-id 421614`),
    // para probar el flujo completo end-to-end (deploy + frontend firmando de verdad) sin gastar
    // ETH de testnet. La clave es la Account #0 publica y conocida de Hardhat/Foundry — nunca
    // usar en una red real, solo sirve contra este nodo local.
    arbitrumLocal: {
      type: "http",
      chainType: "l1",
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      url: "http://127.0.0.1:8545",
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
    },
  },
  // Arbiscan corre sobre la API unificada de Etherscan (multi-chain) desde 2024: la misma
  // API key sirve para Arbitrum Sepolia y Arbitrum One.
  verify: {
    etherscan: {
      apiKey: configVariable("ARBISCAN_API_KEY"),
    },
  },
});
