import { describe, expect, it } from "vitest";
import { rutaRequiereSesion } from "./acceso";

describe("rutaRequiereSesion (ADR-043 + ADR-044)", () => {
  it("la vitrina publica no exige sesion: inicio, mapa, landing y arquitectura", () => {
    expect(rutaRequiereSesion("/")).toBe(false);
    expect(rutaRequiereSesion("/mapa")).toBe(false);
    expect(rutaRequiereSesion("/landing")).toBe(false);
    // ADR-044: el escaparate tecnico se queda abierto aunque no haya sesion.
    expect(rutaRequiereSesion("/arquitectura")).toBe(false);
  });

  it("exige sesion para reportar", () => {
    expect(rutaRequiereSesion("/reportar")).toBe(true);
  });

  it("exige sesion para el circulo", () => {
    expect(rutaRequiereSesion("/circulo")).toBe(true);
  });

  it("exige sesion para la cuenta", () => {
    expect(rutaRequiereSesion("/cuenta")).toBe(true);
  });

  it("tambien protege subrutas", () => {
    expect(rutaRequiereSesion("/reportar/confirmar")).toBe(true);
    expect(rutaRequiereSesion("/circulo/contactos")).toBe(true);
  });

  it("no confunde una ruta que solo empieza igual", () => {
    expect(rutaRequiereSesion("/reportaralgomasqueno")).toBe(false);
  });
});
