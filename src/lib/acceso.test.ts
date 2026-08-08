import { describe, expect, it } from "vitest";
import { rutaRequiereSesion } from "./acceso";

describe("rutaRequiereSesion", () => {
  it("no exige sesion para navegar la app", () => {
    expect(rutaRequiereSesion("/")).toBe(false);
    expect(rutaRequiereSesion("/mapa")).toBe(false);
    expect(rutaRequiereSesion("/arquitectura")).toBe(false);
    expect(rutaRequiereSesion("/cuenta")).toBe(false);
  });

  it("exige sesion para reportar", () => {
    expect(rutaRequiereSesion("/reportar")).toBe(true);
  });

  it("exige sesion para el circulo", () => {
    expect(rutaRequiereSesion("/circulo")).toBe(true);
  });

  it("tambien protege subrutas", () => {
    expect(rutaRequiereSesion("/reportar/confirmar")).toBe(true);
    expect(rutaRequiereSesion("/circulo/contactos")).toBe(true);
  });

  it("no confunde una ruta que solo empieza igual", () => {
    expect(rutaRequiereSesion("/reportaralgomasqueno")).toBe(false);
  });
});
