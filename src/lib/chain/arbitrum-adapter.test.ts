import { afterEach, describe, expect, it, vi } from "vitest";
import { CONFIG } from "../config";
import { crearAdaptadorArbitrum } from "./arbitrum-adapter";

/**
 * Cubre lo que se puede probar sin una red real: construccion del adaptador contra distintas
 * combinaciones de configuracion, y el comportamiento cuando no hay wallet inyectada (el
 * entorno de vitest no tiene `window`, igual que un render en servidor).
 *
 * Lo que SI necesita una cadena real (una transaccion de verdad, un contrato desplegado) esta
 * fuera de este archivo — ver docs/PLAN-DE-PRUEBAS-ARBITRUM.md.
 */

const DIRECCION_VALIDA = "0x1111111111111111111111111111111111111111";

const configBase = (): typeof CONFIG => ({
  ...CONFIG,
  chainId: 421614,
  direcciones: {
    reportRegistry: DIRECCION_VALIDA,
    tokenReward: "",
    identityEscrow: "",
  },
});

describe("crearAdaptadorArbitrum — construccion", () => {
  it("revierte si la direccion de ReportRegistry esta vacia", () => {
    const config = { ...configBase(), direcciones: { ...configBase().direcciones, reportRegistry: "" } };
    expect(() => crearAdaptadorArbitrum(config)).toThrow(/ReportRegistry/);
  });

  it("revierte si la direccion de ReportRegistry esta mal formada", () => {
    const config = {
      ...configBase(),
      direcciones: { ...configBase().direcciones, reportRegistry: "0xNoEsUnaDireccion" },
    };
    expect(() => crearAdaptadorArbitrum(config)).toThrow(/invalida/);
  });

  it("revierte si el chainId no tiene red de viem asociada (ej. una testnet no soportada)", () => {
    const config = { ...configBase(), chainId: 999999 };
    expect(() => crearAdaptadorArbitrum(config)).toThrow(/999999/);
  });

  it("construye el adaptador con id 'arbitrum' y simulado:false cuando la direccion es valida", () => {
    const adaptador = crearAdaptadorArbitrum(configBase());
    expect(adaptador.id).toBe("arbitrum");
    expect(adaptador.simulado).toBe(false);
    expect(adaptador.red.chainId).toBe(421614);
  });

  it("acepta chainId de Arbitrum One (42161) tambien", () => {
    const adaptador = crearAdaptadorArbitrum({ ...configBase(), chainId: 42161 });
    expect(adaptador.red.chainId).toBe(42161);
  });
});

describe("saldoRecompensas sin TokenReward configurado", () => {
  it("devuelve 0 sin llamar a la red si no hay direccion de TokenReward", async () => {
    const adaptador = crearAdaptadorArbitrum(configBase());
    await expect(adaptador.saldoRecompensas(DIRECCION_VALIDA)).resolves.toBe(0);
  });
});

describe("anclarReporte sin wallet inyectada (entorno de vitest: sin `window`)", () => {
  const entradaDePrueba = {
    contentHash: "0x" + "ab".repeat(32),
    latE6: -12046400,
    lngE6: -77042800,
    categoriaIndice: 0,
    zonaId: "z2391_-15409",
    cid: null,
  };

  it("lanza un error en espanol pidiendo instalar una wallet, sin tocar la red", async () => {
    const adaptador = crearAdaptadorArbitrum(configBase());
    await expect(adaptador.anclarReporte(entradaDePrueba)).rejects.toThrow(/wallet compatible/i);
  });
});

describe("anclarReporte con una wallet inyectada simulada", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const entradaDePrueba = {
    contentHash: "0x" + "ab".repeat(32),
    latE6: -12046400,
    lngE6: -77042800,
    categoriaIndice: 0,
    zonaId: "z2391_-15409",
    cid: null,
  };

  it("si la wallet no devuelve ninguna cuenta, lanza un error claro", async () => {
    vi.stubGlobal("window", { ethereum: { request: vi.fn().mockResolvedValue([]) } });
    const adaptador = crearAdaptadorArbitrum(configBase());
    await expect(adaptador.anclarReporte(entradaDePrueba)).rejects.toThrow(/ninguna cuenta/i);
  });

  it("si la wallet rechaza enviar la transaccion, envuelve el error en espanol", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_requestAccounts") return [DIRECCION_VALIDA];
      throw new Error("User rejected the request");
    });
    vi.stubGlobal("window", { ethereum: { request } });

    const adaptador = crearAdaptadorArbitrum(configBase());
    await expect(adaptador.anclarReporte(entradaDePrueba)).rejects.toThrow(/rechazo o no pudo enviar/i);
  });
});
