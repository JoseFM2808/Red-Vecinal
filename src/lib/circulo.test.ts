import { describe, expect, it } from "vitest";
import {
  FRESCURA_UBICACION_MS,
  claveAviso,
  estadoDeContacto,
  evaluarAvisos,
  reporteMasCercano,
  telefonoParaLlamar,
  type ContactoCirculo,
} from "./circulo";
import type { Reporte } from "./tipos";

const AHORA = 1_754_500_000_000;
const MINUTO = 60_000;

const CASA = { lat: -12.0464, lng: -77.0428 };
const A_200_M = { lat: -12.0482, lng: -77.0428 };
const A_2_KM = { lat: -12.0644, lng: -77.0428 };

const contacto = (over: Partial<ContactoCirculo> = {}): ContactoCirculo => ({
  id: "c1",
  nombre: "Mama",
  telefono: "+51 987 654 321",
  relacion: "Madre",
  alias: "vecina-3311",
  compartiendo: true,
  coordenada: CASA,
  actualizadoEn: AHORA - MINUTO,
  radioAvisoM: 500,
  ...over,
});

const reporte = (over: Partial<Reporte> = {}): Reporte =>
  ({
    id: "r1",
    categoria: "actividad_sospechosa",
    descripcion: "Moto dando vueltas",
    coordenada: A_200_M,
    zonaId: "z1",
    zonaNombre: "Cercado de Lima",
    creadoEn: AHORA - 5 * MINUTO,
    autorSeudonimo: "vecino-0001",
    autorDireccion: "0xotro",
    contentHash: "0xabc",
    evidencia: null,
    cadena: null,
    estadoAnclaje: "anclado",
    recompensa: {
      monto: 10,
      simbolo: "VSG",
      multiplicador: 1,
      estado: "pendiente_corroboracion",
      motivo: "",
    },
    corroboraciones: [],
    escalamiento: null,
    esSemilla: false,
    ...over,
  }) as Reporte;

describe("estado del contacto", () => {
  it("en linea cuando comparte y su posicion es fresca", () => {
    expect(estadoDeContacto(contacto(), AHORA)).toBe("en_linea");
  });

  it("sin senal cuando la ultima posicion es vieja", () => {
    const viejo = contacto({ actualizadoEn: AHORA - FRESCURA_UBICACION_MS - MINUTO });
    expect(estadoDeContacto(viejo, AHORA)).toBe("sin_senal");
  });

  it("sin compartir cuando lo desactivo", () => {
    expect(estadoDeContacto(contacto({ compartiendo: false }), AHORA)).toBe("sin_compartir");
  });

  it("sin compartir cuando nunca llego una posicion", () => {
    expect(estadoDeContacto(contacto({ coordenada: null }), AHORA)).toBe("sin_compartir");
  });
});

describe("avisos por cercania al contacto", () => {
  it("avisa cuando el reporte cae dentro del radio", () => {
    const avisos = evaluarAvisos([contacto()], [reporte()], AHORA, new Set());
    expect(avisos).toHaveLength(1);
    expect(avisos[0]?.contactoNombre).toBe("Mama");
    expect(avisos[0]?.distanciaM).toBeGreaterThan(150);
    expect(avisos[0]?.distanciaM).toBeLessThan(250);
  });

  it("no avisa si el reporte esta fuera del radio", () => {
    const avisos = evaluarAvisos([contacto()], [reporte({ coordenada: A_2_KM })], AHORA, new Set());
    expect(avisos).toEqual([]);
  });

  it("respeta un radio mas amplio configurado por el usuario", () => {
    const lejos = contacto({ radioAvisoM: 2500 });
    const avisos = evaluarAvisos([lejos], [reporte({ coordenada: A_2_KM })], AHORA, new Set());
    expect(avisos).toHaveLength(1);
  });

  it("no avisa por reportes viejos", () => {
    const avisos = evaluarAvisos(
      [contacto()],
      [reporte({ creadoEn: AHORA - 31 * MINUTO })],
      AHORA,
      new Set(),
    );
    expect(avisos).toEqual([]);
  });

  it("ignora reportes con fecha futura", () => {
    const avisos = evaluarAvisos(
      [contacto()],
      [reporte({ creadoEn: AHORA + MINUTO })],
      AHORA,
      new Set(),
    );
    expect(avisos).toEqual([]);
  });

  it("no avisa por un contacto que dejo de compartir", () => {
    const avisos = evaluarAvisos([contacto({ compartiendo: false })], [reporte()], AHORA, new Set());
    expect(avisos).toEqual([]);
  });

  it("no avisa si el contacto perdio la senal", () => {
    const sinSenal = contacto({ actualizadoEn: AHORA - 20 * MINUTO });
    expect(evaluarAvisos([sinSenal], [reporte()], AHORA, new Set())).toEqual([]);
  });

  it("no repite un aviso ya emitido", () => {
    const yaAvisados = new Set([claveAviso("c1", "r1")]);
    expect(evaluarAvisos([contacto()], [reporte()], AHORA, yaAvisados)).toEqual([]);
  });

  it("un mismo reporte avisa por cada contacto cercano", () => {
    const avisos = evaluarAvisos(
      [contacto(), contacto({ id: "c2", nombre: "Hermano" })],
      [reporte()],
      AHORA,
      new Set(),
    );
    expect(avisos.map((a) => a.contactoNombre).sort()).toEqual(["Hermano", "Mama"]);
  });

  it("ordena los avisos del mas cercano al mas lejano", () => {
    const cerca = reporte({ id: "cerca", coordenada: CASA });
    const lejos = reporte({ id: "lejos", coordenada: A_200_M });
    const avisos = evaluarAvisos([contacto()], [lejos, cerca], AHORA, new Set());
    expect(avisos.map((a) => a.reporteId)).toEqual(["cerca", "lejos"]);
  });

  it("la clave del aviso identifica el par contacto-reporte", () => {
    const avisos = evaluarAvisos([contacto()], [reporte()], AHORA, new Set());
    expect(avisos[0]?.clave).toBe("c1:r1");
  });
});

describe("reporte mas cercano al contacto", () => {
  it("devuelve el mas proximo aunque este fuera del radio de aviso", () => {
    const resultado = reporteMasCercano(contacto(), [reporte({ coordenada: A_2_KM })], AHORA);
    expect(resultado?.distanciaM).toBeGreaterThan(1500);
  });

  it("devuelve null si el contacto no comparte ubicacion", () => {
    expect(reporteMasCercano(contacto({ coordenada: null }), [reporte()], AHORA)).toBeNull();
  });

  it("devuelve null cuando no hay reportes recientes", () => {
    expect(reporteMasCercano(contacto(), [], AHORA)).toBeNull();
  });
});

describe("telefono para llamar", () => {
  it("quita espacios y guiones conservando el prefijo internacional", () => {
    expect(telefonoParaLlamar("+51 987 654 321")).toBe("+51987654321");
    expect(telefonoParaLlamar("987-654-321")).toBe("987654321");
  });

  it("no deja un + en medio del numero", () => {
    expect(telefonoParaLlamar("51 9+87")).toBe("51987");
  });
});
