import { describe, expect, it } from "vitest";
import { describirZona, listaDistritos, nombreDeZona } from "./zonas";

/**
 * Regresion de ADR-020: con 16 distritos y 12 km de tolerancia, medio Lima aparecia
 * en Miraflores. Estos casos fijan que eso no vuelva a pasar.
 */

describe("distritos que antes caian mal en Miraflores", () => {
  const casos = [
    { nombre: "Surquillo", punto: { lat: -12.112, lng: -77.01 } },
    { nombre: "Barranco", punto: { lat: -12.147, lng: -77.02 } },
    { nombre: "San Borja", punto: { lat: -12.1, lng: -76.999 } },
    { nombre: "Jesus Maria", punto: { lat: -12.074, lng: -77.048 } },
    { nombre: "Lince", punto: { lat: -12.087, lng: -77.035 } },
    { nombre: "Santiago de Surco", punto: { lat: -12.145, lng: -76.993 } },
    { nombre: "Magdalena del Mar", punto: { lat: -12.09, lng: -77.07 } },
  ];

  for (const caso of casos) {
    it(`ubica ${caso.nombre} en su propio distrito, no en Miraflores`, () => {
      const zona = describirZona(caso.punto);
      expect(zona.distrito).toBe(caso.nombre);
      expect(zona.confiable).toBe(true);
    });
  }
});

describe("honestidad del resultado", () => {
  it("no afirma un distrito cuando el punto esta lejos del centroide", () => {
    // Mar afuera frente a la Costa Verde: cerca de Lima, pero no dentro de un distrito.
    const zona = describirZona({ lat: -12.11, lng: -77.09 });
    expect(zona.confiable).toBe(false);
    expect(zona.etiqueta.startsWith("Cerca de")).toBe(true);
  });

  it("devuelve 'Zona sin referencia' fuera del area cubierta", () => {
    // Cusco: no es Lima Metropolitana.
    expect(nombreDeZona({ lat: -13.5319, lng: -71.9675 })).toBe("Zona sin referencia");
    expect(describirZona({ lat: -13.5319, lng: -71.9675 }).distrito).toBeNull();
  });

  it("informa la distancia al centroide para poder auditar la estimacion", () => {
    const zona = describirZona({ lat: -12.121, lng: -77.03 });
    expect(zona.distanciaM).not.toBeNull();
    expect(zona.distanciaM).toBeLessThan(200);
  });
});

describe("catalogo de distritos", () => {
  it("cubre Lima Metropolitana y el Callao", () => {
    const lista = listaDistritos();
    expect(lista.length).toBeGreaterThanOrEqual(45);
    for (const esperado of ["Miraflores", "Surquillo", "Callao", "Ventanilla", "Pucusana"]) {
      expect(lista).toContain(esperado);
    }
  });

  it("no tiene nombres repetidos", () => {
    const lista = listaDistritos();
    expect(new Set(lista).size).toBe(lista.length);
  });

  it("viene ordenado para el selector", () => {
    const lista = listaDistritos();
    expect(lista).toEqual([...lista].sort((a, b) => a.localeCompare(b, "es")));
  });
});
