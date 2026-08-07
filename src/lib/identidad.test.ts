import { describe, expect, it } from "vitest";
import {
  abreviarDireccion,
  derivarIdentidadDeCuenta,
  seudonimoDeDireccion,
} from "./identidad";

const CREADO_EN = 1_754_500_000_000;

describe("identidad derivada de la cuenta (ADR-021)", () => {
  it("la misma cuenta produce siempre el mismo alias y la misma direccion", async () => {
    const a = await derivarIdentidadDeCuenta("117459302847561029384", CREADO_EN);
    const b = await derivarIdentidadDeCuenta("117459302847561029384", CREADO_EN + 999_999);

    expect(a.direccion).toBe(b.direccion);
    expect(a.seudonimo).toBe(b.seudonimo);
  });

  it("cuentas distintas producen identidades distintas", async () => {
    const a = await derivarIdentidadDeCuenta("117459302847561029384", CREADO_EN);
    const b = await derivarIdentidadDeCuenta("117459302847561029385", CREADO_EN);

    expect(a.direccion).not.toBe(b.direccion);
  });

  it("produce una direccion con el formato de una wallet", async () => {
    const { direccion } = await derivarIdentidadDeCuenta("cuenta-de-prueba", CREADO_EN);
    expect(direccion).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it("no filtra el identificador de la cuenta en la direccion", async () => {
    const id = "117459302847561029384";
    const { direccion, seudonimo } = await derivarIdentidadDeCuenta(id, CREADO_EN);

    expect(direccion).not.toContain(id);
    expect(seudonimo).not.toContain(id);
  });

  it("se marca como simulada mientras no haya wallet abstraction real", async () => {
    const identidad = await derivarIdentidadDeCuenta("cuenta-de-prueba", CREADO_EN);
    expect(identidad.simulado).toBe(true);
  });
});

describe("alias legible", () => {
  it("siempre tiene cuatro digitos", () => {
    expect(seudonimoDeDireccion("0x0000000000000000000000000000000000000001")).toBe("vecino-0001");
    expect(seudonimoDeDireccion("0xabcdefabcdefabcdefabcdefabcdefabcdef270f")).toBe("vecino-9999");
  });

  it("no revienta con una direccion malformada", () => {
    expect(seudonimoDeDireccion("0x")).toBe("vecino-0000");
  });
});

describe("presentacion de la direccion", () => {
  it("abrevia dejando el inicio y el final visibles", () => {
    expect(abreviarDireccion("0x7f3a19c4d2be51a8036fbc9e4471d2a8c5e60b41")).toBe("0x7f3a…0b41");
  });

  it("deja intactas las cadenas cortas", () => {
    expect(abreviarDireccion("0x1234")).toBe("0x1234");
  });
});
