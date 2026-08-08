import { describe, expect, it } from "vitest";
import { fusionarConCadena, type ReporteRemoto } from "./eventos";
import type { Reporte } from "../tipos";

const LOCAL: Reporte = {
  id: "abc123-def456",
  categoria: "infraestructura",
  descripcion: "Poste sin luz hace tres dias",
  coordenada: { lat: -12.09, lng: -77.02 },
  zonaId: "z-2418_-15404",
  zonaNombre: "San Isidro",
  creadoEn: 1_754_500_000_000,
  autorSeudonimo: "vecino-0001",
  autorDireccion: "0xaaaa000000000000000000000000000000aaaa",
  contentHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
  evidencia: { cid: "bafyLocal", miniatura: "data:image/jpeg;base64,xyz", bytes: 1000, simulado: true },
  cadena: null,
  estadoAnclaje: "local",
  recompensa: { monto: 10, simbolo: "VSG", multiplicador: 1, estado: "otorgada", motivo: "Reporte valido" },
  corroboraciones: [],
  escalamiento: null,
  esSemilla: false,
};

function remoto(overrides: Partial<ReporteRemoto> = {}): ReporteRemoto {
  return {
    reportId: 7n,
    contentHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    autorDireccion: "0xbbbb000000000000000000000000000000bbbb",
    coordenada: { lat: -12.1, lng: -77.03 },
    categoria: "actividad_sospechosa",
    creadoEn: 1_754_600_000_000,
    cid: "bafyRemoto",
    txHash: "0xtx",
    bloque: 90_000_123,
    chainId: 421614,
    recompensaMonto: 10,
    recompensaOtorgada: false,
    ...overrides,
  };
}

describe("fusionarConCadena", () => {
  it("agrega un reporte remoto que no existe localmente", () => {
    const resultado = fusionarConCadena([LOCAL], [remoto()]);
    expect(resultado).toHaveLength(2);
    const nuevo = resultado.find((r) => r.id !== LOCAL.id);
    expect(nuevo?.autorDireccion).toBe("0xbbbb000000000000000000000000000000bbbb");
    expect(nuevo?.descripcion).toBe("");
    expect(nuevo?.corroboraciones).toEqual([]);
  });

  it("no duplica un reporte cuyo contentHash ya esta local: gana la version local completa", () => {
    const mismoHash = remoto({ contentHash: LOCAL.contentHash });
    const resultado = fusionarConCadena([LOCAL], [mismoHash]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toBe(LOCAL);
  });

  it("la comparacion de contentHash no distingue mayusculas de minusculas", () => {
    const mismoHashMayus = remoto({ contentHash: LOCAL.contentHash.toUpperCase() });
    const resultado = fusionarConCadena([LOCAL], [mismoHashMayus]);
    expect(resultado).toHaveLength(1);
  });

  it("ordena el resultado por creadoEn descendente", () => {
    const viejo = remoto({ contentHash: "0x3333", creadoEn: 1 });
    const nuevo = remoto({ contentHash: "0x4444", creadoEn: 9_999_999_999_999 });
    const resultado = fusionarConCadena([], [viejo, nuevo]);
    expect(resultado[0]?.creadoEn).toBe(9_999_999_999_999);
  });

  it("sin evidencia (cid vacio) no genera un objeto Evidencia", () => {
    const sinCid = remoto({ contentHash: "0x5555", cid: "" });
    const [reconstruido] = fusionarConCadena([], [sinCid]);
    expect(reconstruido?.evidencia).toBeNull();
  });
});
