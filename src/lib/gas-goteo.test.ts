import { describe, expect, it } from "vitest";
import {
  CHAIN_ID_GOTEO,
  ESPERA_ENTRE_GOTEOS_MS,
  MONTO_GOTEO_WEI,
  UMBRAL_GOTEO_WEI,
  decidirGoteo,
} from "./gas-goteo";

/**
 * Politica del grifo de gas (ADR-051). El caso que motivo todo: la wallet embebida
 * 0x81ba... recien activada, con 0 ETH, que no podia pagar su primer anclaje.
 */

const AHORA = 1_754_500_000_000;

const entrada = (over: Partial<Parameters<typeof decidirGoteo>[0]> = {}) => ({
  chainId: CHAIN_ID_GOTEO,
  direccion: "0x81ba352815bF7487c89d0f7fD7c16B0dCfBA3466",
  saldoWei: 0n,
  ultimoGoteoEn: null,
  ahora: AHORA,
  ...over,
});

describe("decidirGoteo — el grifo automatico de testnet", () => {
  it("gotea a una wallet recien nacida con 0 ETH", () => {
    expect(decidirGoteo(entrada())).toEqual({ gotear: true, codigo: "gotear" });
  });

  it("NO gotea fuera de Arbitrum Sepolia, pase lo que pase: es la condicion de seguridad", () => {
    // Ni en Arbitrum One con saldo cero...
    expect(decidirGoteo(entrada({ chainId: 42161 })).codigo).toBe("red_equivocada");
    // ...ni en una red inventada.
    expect(decidirGoteo(entrada({ chainId: 1 })).gotear).toBe(false);
  });

  it("no gotea a quien ya tiene saldo por encima del umbral", () => {
    expect(decidirGoteo(entrada({ saldoWei: UMBRAL_GOTEO_WEI })).codigo).toBe("saldo_suficiente");
  });

  it("gotea a quien quedo justo por debajo del umbral (recarga, no solo estreno)", () => {
    expect(decidirGoteo(entrada({ saldoWei: UMBRAL_GOTEO_WEI - 1n })).gotear).toBe(true);
  });

  it("respeta la ventana de espera entre goteos a la misma wallet", () => {
    const reciente = entrada({ ultimoGoteoEn: AHORA - ESPERA_ENTRE_GOTEOS_MS + 60_000 });
    expect(decidirGoteo(reciente).codigo).toBe("en_espera");

    const vencida = entrada({ ultimoGoteoEn: AHORA - ESPERA_ENTRE_GOTEOS_MS - 1 });
    expect(decidirGoteo(vencida).gotear).toBe(true);
  });

  it("rechaza direcciones malformadas antes de mirar nada mas", () => {
    expect(decidirGoteo(entrada({ direccion: "0x123" })).codigo).toBe("direccion_invalida");
    expect(decidirGoteo(entrada({ direccion: "no-es-direccion" })).gotear).toBe(false);
  });

  it("el monto del goteo cubre decenas de anclajes y supera el umbral", () => {
    // Si el monto no superara el umbral, una wallet goteada seguiria "sin gas" y
    // pediria goteo en cada sesion: el grifo se vaciaria sin que nadie ancle nada.
    expect(MONTO_GOTEO_WEI > UMBRAL_GOTEO_WEI).toBe(true);
  });
});
