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

/**
 * Timeout de 30 s y no los 5 s por defecto.
 *
 * `vi.resetModules()` obliga a reimportar `./index`, que arrastra el adaptador de Arbitrum
 * y con el todo el grafo de viem. La primera vez que Vitest lo transforma, en una maquina
 * lenta o con el cache frio, eso pasa de 5 s y el test cae por timeout aunque el codigo
 * bajo prueba sea instantaneo — medido: 3.5 s con cache caliente, mas de 5 s en frio.
 *
 * El margen es para la transformacion, no para la logica: si `obtenerAdaptadorDeCadena()`
 * empezara a tardar de verdad, seguiria fallando por las aserciones y no por el reloj.
 */
describe("obtenerAdaptadorDeCadena — activacion por configuracion", { timeout: 30_000 }, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /*
   * Cada caso fija TODO su entorno con stubs, incluso los "vacios": la maquina de
   * desarrollo tiene un .env.local con el modo arbitrum real (que vitest carga), y sin
   * los stubs explicitos estos tests dependerian de que archivo tenga cada quien.
   */
  it("sin ninguna variable de entorno, usa el adaptador simulado (comportamiento por defecto de la beta)", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS", "");
    const adaptador = await cargarAdaptador();
    expect(adaptador.id).toBe("simulado");
    expect(adaptador.simulado).toBe(true);
  });

  it("con CHAIN_MODE=arbitrum pero sin direcciones, sigue en simulado sin intentar el adaptador real", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "arbitrum");
    vi.stubEnv("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS", "");
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

  /**
   * ADR-049 — el caso de la prueba real: modo arbitrum activo (direcciones en Vercel) y un
   * telefono con login de Google pero SIN wallet inyectada. Sin el respaldo, anclarReporte
   * lanzaba "instala MetaMask" y publicar moria para casi todos los usuarios de la prueba.
   */
  it("sin wallet inyectada, el modo arbitrum ancla con comprobante simulado en vez de morir", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_CHAIN_MODE", "arbitrum");
    vi.stubEnv("NEXT_PUBLIC_CHAIN_ID", "421614");
    vi.stubEnv("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS", "0x1111111111111111111111111111111111111111");

    const adaptador = await cargarAdaptador();
    expect(adaptador.id).toBe("arbitrum");
    // Las lecturas siguen siendo reales: el adaptador NO es el simulado.
    expect(adaptador.simulado).toBe(false);

    // En node no existe window.ethereum: es exactamente el telefono sin wallet.
    const recibo = await adaptador.anclarReporte({
      contentHash: `0x${"ab".repeat(32)}`,
      latE6: -12046400,
      lngE6: -77042800,
      categoriaIndice: 0,
      zonaId: "z-2391_-15409",
      cid: null,
    });

    expect(recibo.simulado).toBe(true);
    expect(recibo.txHash).toMatch(/^0x/);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
