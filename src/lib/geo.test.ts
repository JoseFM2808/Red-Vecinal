import { describe, expect, it } from "vitest";
import {
  DECIMALES_PRECISION,
  aMicrogrados,
  desdeMicrogrados,
  distanciaMetros,
  truncarCoordenada,
  zonaIdDe,
} from "./geo";

describe("privacidad de la coordenada", () => {
  it("trunca a 4 decimales antes de que la coordenada salga del dispositivo", () => {
    const exacta = { lat: -12.04638917, lng: -77.04279331 };
    expect(truncarCoordenada(exacta)).toEqual({ lat: -12.0464, lng: -77.0428 });
    expect(DECIMALES_PRECISION).toBe(4);
  });

  it("el truncado deja un error menor a 15 m", () => {
    const exacta = { lat: -12.04638917, lng: -77.04279331 };
    expect(distanciaMetros(exacta, truncarCoordenada(exacta))).toBeLessThan(15);
  });
});

describe("microgrados (formato de los contratos)", () => {
  it("convierte a entero ida y vuelta", () => {
    expect(aMicrogrados(-12.0464)).toBe(-12046400);
    expect(desdeMicrogrados(-12046400)).toBeCloseTo(-12.0464, 6);
  });

  it("entra en int32", () => {
    expect(Math.abs(aMicrogrados(-90))).toBeLessThan(2 ** 31);
    expect(Math.abs(aMicrogrados(180))).toBeLessThan(2 ** 31);
  });
});

describe("zonas", () => {
  it("dos puntos de la misma cuadra caen en la misma zona", () => {
    expect(zonaIdDe({ lat: -12.0464, lng: -77.0428 })).toBe(
      zonaIdDe({ lat: -12.0466, lng: -77.043 }),
    );
  });

  it("dos distritos distintos caen en zonas distintas", () => {
    expect(zonaIdDe({ lat: -12.0464, lng: -77.0428 })).not.toBe(
      zonaIdDe({ lat: -11.9895, lng: -77.0055 }),
    );
  });
});

describe("distancia", () => {
  it("un grado de latitud son ~111 km", () => {
    const d = distanciaMetros({ lat: -12, lng: -77 }, { lat: -13, lng: -77 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it("la distancia a si mismo es cero", () => {
    expect(distanciaMetros({ lat: -12.0464, lng: -77.0428 }, { lat: -12.0464, lng: -77.0428 })).toBe(
      0,
    );
  });
});
