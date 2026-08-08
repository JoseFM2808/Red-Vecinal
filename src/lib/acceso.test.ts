import { describe, expect, it } from "vitest";
import { rutaRequiereSesion } from "./acceso";

describe("rutaRequiereSesion (ADR-043)", () => {
  it("la vitrina publica no exige sesion: inicio, mapa y landing", () => {
    expect(rutaRequiereSesion("/")).toBe(false);
    expect(rutaRequiereSesion("/mapa")).toBe(false);
    expect(rutaRequiereSesion("/landing")).toBe(false);
  });

  it("exige sesion para reportar", () => {
    expect(rutaRequiereSesion("/reportar")).toBe(true);
  });

  it("exige sesion para el circulo", () => {
    expect(rutaRequiereSesion("/circulo")).toBe(true);
  });

  it("exige sesion para la cuenta y la arquitectura", () => {
    expect(rutaRequiereSesion("/cuenta")).toBe(true);
    expect(rutaRequiereSesion("/arquitectura")).toBe(true);
  });

  it("tambien protege subrutas", () => {
    expect(rutaRequiereSesion("/reportar/confirmar")).toBe(true);
    expect(rutaRequiereSesion("/circulo/contactos")).toBe(true);
  });

  it("no confunde una ruta que solo empieza igual", () => {
    expect(rutaRequiereSesion("/reportaralgomasqueno")).toBe(false);
  });
});
