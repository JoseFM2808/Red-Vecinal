import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Matriz de activacion por variables de entorno (ADR-030). Cada caso recarga el modulo desde
 * cero con `vi.resetModules()` porque `CONFIG` se calcula una sola vez al importar
 * `src/lib/config.ts`, y `chain/index.ts` cachea el adaptador en una variable de modulo.
 */

async function cargarAdaptador() {
  vi.resetModules();
  const mod = await import("./index");
  return mod.obtenerAdaptadorDeCadena();
}

describe("obtenerAdaptadorDeCadena — activacion por configuracion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sin ninguna variable de entorno, usa el adaptador simulado (comportamiento por defecto de la beta)", async () => {
    const adaptador = await cargarAdaptador();
    expect(adaptador.id).toBe("simulado");
    expect(adaptador.simulado).toBe(true);
  });

  it("con CHAIN_MODE=arbitrum pero sin direcciones, sigue en simulado sin intentar el adaptador real", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "arbitrum");
    const adaptador = await cargarAdaptador();
    expect(adaptador.simulado).toBe(true);
  });

  it("con CHAIN_MODE=arbitrum y una direccion mal formada, cae a simulado avisando por consola", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "arbitrum");
    vi.stubEnv("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS", "0xNoEsUnaDireccionValida");

    const adaptador = await cargarAdaptador();

    expect(adaptador.simulado).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("con CHAIN_MODE=arbitrum y una direccion valida, activa el adaptador real sin avisos", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "arbitrum");
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "421614");
    vi.stubEnv("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS", "0x1111111111111111111111111111111111111111");

    const adaptador = await cargarAdaptador();

    expect(adaptador.id).toBe("arbitrum");
    expect(adaptador.simulado).toBe(false);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("con un CHAIN_ID sin red de viem asociada, cae a simulado avisando por consola", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "arbitrum");
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "999999");
    vi.stubEnv("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS", "0x1111111111111111111111111111111111111111");

    const adaptador = await cargarAdaptador();

    expect(adaptador.simulado).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
