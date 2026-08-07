import { describe, expect, it } from "vitest";
import { calcularContentHash, serializarCanonico, type EntradaHash } from "./hash";

const BASE: EntradaHash = {
  cid: "bafyDemoEvidencia",
  coordenada: { lat: -12.0464, lng: -77.0428 },
  categoria: "actividad_sospechosa",
  creadoEnSegundos: 1_754_500_000,
  autor: "0xAbC123",
};

describe("serializacion canonica", () => {
  it("emite los campos en orden fijo y las coordenadas en microgrados enteros", () => {
    expect(serializarCanonico(BASE)).toBe(
      "autor=0xabc123|categoria=actividad_sospechosa|cid=bafyDemoEvidencia|latE6=-12046400|lngE6=-77042800|ts=1754500000",
    );
  });

  it("no depende del orden de las claves del objeto de entrada", () => {
    const desordenado: EntradaHash = {
      autor: BASE.autor,
      creadoEnSegundos: BASE.creadoEnSegundos,
      categoria: BASE.categoria,
      coordenada: BASE.coordenada,
      cid: BASE.cid,
    };
    expect(serializarCanonico(desordenado)).toBe(serializarCanonico(BASE));
  });

  it("normaliza la direccion a minusculas", () => {
    const otro = { ...BASE, autor: "0xABC123" };
    expect(serializarCanonico(otro)).toBe(serializarCanonico(BASE));
  });

  it("representa la ausencia de evidencia como cadena vacia, no como 'null'", () => {
    expect(serializarCanonico({ ...BASE, cid: null })).toContain("|cid=|");
  });
});

describe("contentHash", () => {
  it("produce 32 bytes con prefijo 0x", async () => {
    const hash = await calcularContentHash(BASE);
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("es determinista", async () => {
    expect(await calcularContentHash(BASE)).toBe(await calcularContentHash({ ...BASE }));
  });

  it("cambia si se mueve la coordenada un microgrado", async () => {
    const movido = { ...BASE, coordenada: { lat: -12.046401, lng: -77.0428 } };
    expect(await calcularContentHash(movido)).not.toBe(await calcularContentHash(BASE));
  });

  it("cambia si cambia la evidencia", async () => {
    const otro = { ...BASE, cid: "bafyOtraEvidencia" };
    expect(await calcularContentHash(otro)).not.toBe(await calcularContentHash(BASE));
  });
});
