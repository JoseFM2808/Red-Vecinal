import { describe, expect, it } from "vitest";
import { cifrarSobre, descifrarSobre, generarClave, generarVinculoId } from "./circulo-cifrado";
import {
  DURACIONES_COMPARTIR,
  codificarInvitacion,
  decodificarInvitacion,
  duracionPorId,
  enlaceDeInvitacion,
  esPosicionCompartida,
  restanteLegible,
  vigenciaDe,
  type InvitacionCirculo,
  type PosicionCompartida,
} from "./circulo-vinculos";

const AHORA = 1_754_500_000_000;

const invitacion = (over: Partial<InvitacionCirculo> = {}): InvitacionCirculo => ({
  v: 1,
  id: "AbCdEfGhIjKlMnOp",
  k: "MTIzNDU2Nzg5MDEyMzQ1Ng",
  alias: "vecina-4410",
  ...over,
});

describe("invitacion — codificar y decodificar", () => {
  it("hace el viaje de ida y vuelta", () => {
    const token = codificarInvitacion(invitacion());
    expect(decodificarInvitacion(token)).toEqual(invitacion());
  });

  it("acepta el enlace completo, no solo el token", () => {
    const enlace = enlaceDeInvitacion("https://vecino-seguro.vercel.app", invitacion());
    expect(enlace).toContain("/circulo#v=");
    expect(decodificarInvitacion(enlace)).toEqual(invitacion());
  });

  it("sobrevive alias con caracteres no ASCII", () => {
    const conTilde = invitacion({ alias: "María José ñ" });
    expect(decodificarInvitacion(codificarInvitacion(conTilde))).toEqual(conTilde);
  });

  it("rechaza basura: texto suelto, JSON ajeno, token corrupto", () => {
    expect(decodificarInvitacion("")).toBeNull();
    expect(decodificarInvitacion("hola que tal")).toBeNull();
    expect(decodificarInvitacion("eyJvdHJhIjoiY29zYSJ9")).toBeNull();
    expect(decodificarInvitacion(codificarInvitacion(invitacion()).slice(4))).toBeNull();
  });

  it("rechaza una invitacion con version desconocida o id corto", () => {
    const v2 = { ...invitacion(), v: 2 } as unknown as InvitacionCirculo;
    expect(decodificarInvitacion(codificarInvitacion(v2))).toBeNull();
    const corto = invitacion({ id: "abc" });
    expect(decodificarInvitacion(codificarInvitacion(corto))).toBeNull();
  });

  it("rechaza textos absurdamente largos sin intentar parsearlos", () => {
    expect(decodificarInvitacion("A".repeat(5000))).toBeNull();
  });
});

describe("duraciones y vigencia — la decision es de quien comparte", () => {
  it("ofrece 15 min, 1 h, 8 h e indefinida", () => {
    expect(DURACIONES_COMPARTIR.map((d) => d.id)).toEqual(["15m", "1h", "8h", "indefinida"]);
    expect(duracionPorId("indefinida")?.ms).toBeNull();
    expect(duracionPorId("no-existe")).toBeNull();
  });

  it("un otorgamiento con plazo expira solo", () => {
    const conPlazo = { expiraEn: AHORA + 60_000, revocadoEn: null };
    expect(vigenciaDe(conPlazo, AHORA)).toBe("activo");
    expect(vigenciaDe(conPlazo, AHORA + 60_000)).toBe("expirado");
  });

  it("el indefinido no expira nunca por si solo", () => {
    const indefinido = { expiraEn: null, revocadoEn: null };
    expect(vigenciaDe(indefinido, AHORA + 365 * 24 * 3_600_000)).toBe("activo");
  });

  it("la revocacion corta al instante y gana incluso al plazo vigente", () => {
    const revocado = { expiraEn: AHORA + 3_600_000, revocadoEn: AHORA };
    expect(vigenciaDe(revocado, AHORA + 1)).toBe("revocado");
  });

  it("describe el tiempo restante en lenguaje de persona", () => {
    expect(restanteLegible(null, AHORA)).toBe("hasta que lo detengas");
    expect(restanteLegible(AHORA + 43 * 60_000, AHORA)).toBe("43 min");
    expect(restanteLegible(AHORA + 7 * 3_600_000, AHORA)).toBe("7 h");
    expect(restanteLegible(AHORA - 1, AHORA)).toBe("expirado");
  });
});

describe("cifrado de extremo a extremo", () => {
  const posicion = (over: Partial<PosicionCompartida> = {}): PosicionCompartida => ({
    coordenada: { lat: -12.0464, lng: -77.0428 },
    precisionM: 15,
    timestamp: AHORA,
    alias: "vecino-9037",
    expiraEn: AHORA + 3_600_000,
    ...over,
  });

  it("cifra y descifra la posicion con la clave del vinculo", async () => {
    const clave = await generarClave();
    const sobre = await cifrarSobre(clave, posicion());
    const abierta = await descifrarSobre<PosicionCompartida>(clave, sobre);
    expect(abierta).toEqual(posicion());
  });

  it("con otra clave el sobre no se abre: devuelve null, no basura", async () => {
    const claveA = await generarClave();
    const claveB = await generarClave();
    const sobre = await cifrarSobre(claveA, posicion());
    expect(await descifrarSobre(claveB, sobre)).toBeNull();
  });

  it("un sobre manipulado se descarta: GCM autentica ademas de cifrar", async () => {
    const clave = await generarClave();
    const sobre = await cifrarSobre(clave, posicion());
    const manipulado = { ...sobre, datos: `${sobre.datos.slice(0, -4)}AAAA` };
    expect(await descifrarSobre(clave, manipulado)).toBeNull();
  });

  it("cada sobre lleva IV nuevo: el mismo contenido nunca produce el mismo cifrado", async () => {
    const clave = await generarClave();
    const a = await cifrarSobre(clave, posicion());
    const b = await cifrarSobre(clave, posicion());
    expect(a.iv).not.toBe(b.iv);
    expect(a.datos).not.toBe(b.datos);
  });

  it("los ids de vinculo salen distintos y en formato base64url", async () => {
    const ids = new Set([generarVinculoId(), generarVinculoId(), generarVinculoId()]);
    expect(ids.size).toBe(3);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{16,32}$/);
  });
});

describe("esPosicionCompartida — el sobre descifrado sigue siendo dato ajeno", () => {
  it("acepta una posicion bien formada y la tumba de revocacion", () => {
    expect(
      esPosicionCompartida({
        coordenada: { lat: -12, lng: -77 },
        precisionM: null,
        timestamp: AHORA,
        alias: "vecina-1",
        expiraEn: null,
      }),
    ).toBe(true);
    expect(esPosicionCompartida({ revocado: true, timestamp: AHORA })).toBe(true);
  });

  it("rechaza coordenadas fuera de rango o campos faltantes", () => {
    expect(
      esPosicionCompartida({
        coordenada: { lat: 91, lng: 0 },
        timestamp: AHORA,
        alias: "x",
      }),
    ).toBe(false);
    expect(esPosicionCompartida({ coordenada: { lat: -12, lng: -77 } })).toBe(false);
    expect(esPosicionCompartida(null)).toBe(false);
    expect(esPosicionCompartida("texto")).toBe(false);
  });
});
