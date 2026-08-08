import { describe, expect, it } from "vitest";
import {
  POLITICA_ALERTA,
  construirMapaIntensidad,
  distanciaKm,
  evaluarAlerta,
  instanteIgp,
  normalizarSismosIgp,
  radioAlertaKm,
  rumboCardinal,
  type RespuestaIntensidad,
  type SismoOficial,
} from "./sismos-oficiales";

/**
 * El caso de referencia es un registro REAL del IGP (codigo 2026-0535), el mismo que
 * aparece en la captura que sirvio de referencia de diseno: 3.7 ML, 10 km, a las
 * 19:06:33 hora de Lima del 7 de agosto, 21 km al SO de Chupaca.
 */
const CRUDO_IGP_REAL = {
  codigo: "2026-0535",
  fecha_utc: "2026-08-08T00:00:00.000Z",
  hora_utc: "1970-01-01T00:06:33.000Z",
  latitud: "-12.23",
  longitud: "-75.37",
  magnitud: "3.7",
  profundidad: 10,
  referencia: "21 km al SO de Chupaca, Chupaca - Junín",
  tipomagnitud: "",
  intensidad: "III Chupaca",
};

const LIMA = { lat: -12.0464, lng: -77.0428 };

describe("instanteIgp — la fecha y la hora vienen en campos separados", () => {
  it("combina el dia de fecha_utc con la hora de hora_utc", () => {
    const epoch = instanteIgp(CRUDO_IGP_REAL.fecha_utc, CRUDO_IGP_REAL.hora_utc);
    expect(new Date(epoch!).toISOString()).toBe("2026-08-08T00:06:33.000Z");
  });

  it("la hora viene montada sobre el epoch: usar hora_utc tal cual daria 1970", () => {
    // Este es el fallo que el test existe para evitar: 56 anios de desfase.
    expect(new Date(Date.parse(CRUDO_IGP_REAL.hora_utc)).getUTCFullYear()).toBe(1970);
    expect(new Date(instanteIgp(CRUDO_IGP_REAL.fecha_utc, CRUDO_IGP_REAL.hora_utc)!).getUTCFullYear()).toBe(
      2026,
    );
  });

  it("devuelve null ante basura, en vez de una fecha inventada", () => {
    expect(instanteIgp(null, null)).toBeNull();
    expect(instanteIgp("no-es-fecha", CRUDO_IGP_REAL.hora_utc)).toBeNull();
    expect(instanteIgp(CRUDO_IGP_REAL.fecha_utc, "")).toBeNull();
  });
});

describe("normalizarSismosIgp", () => {
  it("normaliza el registro real del IGP", () => {
    const [sismo] = normalizarSismosIgp([CRUDO_IGP_REAL]);
    expect(sismo).toMatchObject({
      id: "2026-0535",
      fuente: "IGP",
      magnitud: 3.7,
      profundidadKm: 10,
      referencia: "21 km al SO de Chupaca, Chupaca - Junín",
      intensidadMaxima: "III Chupaca",
    });
    expect(sismo!.epicentro).toEqual({ lat: -12.23, lng: -75.37 });
  });

  it("pone ML cuando el IGP deja tipomagnitud vacio", () => {
    const [sismo] = normalizarSismosIgp([CRUDO_IGP_REAL]);
    expect(sismo!.tipoMagnitud).toBe("ML");
  });

  it("descarta registros sin epicentro, magnitud, codigo o fecha", () => {
    const basura = [
      { ...CRUDO_IGP_REAL, latitud: null },
      { ...CRUDO_IGP_REAL, magnitud: "" },
      { ...CRUDO_IGP_REAL, codigo: null },
      { ...CRUDO_IGP_REAL, fecha_utc: null },
    ];
    expect(normalizarSismosIgp(basura)).toEqual([]);
  });

  it("no revienta si la API devuelve algo que no es un arreglo", () => {
    expect(normalizarSismosIgp(null)).toEqual([]);
    expect(normalizarSismosIgp({ error: "500" })).toEqual([]);
    expect(normalizarSismosIgp("caida")).toEqual([]);
  });

  it("ordena del mas reciente al mas antiguo", () => {
    const viejo = { ...CRUDO_IGP_REAL, codigo: "2026-0001", fecha_utc: "2026-01-01T00:00:00.000Z" };
    const ids = normalizarSismosIgp([viejo, CRUDO_IGP_REAL]).map((s) => s.id);
    expect(ids).toEqual(["2026-0535", "2026-0001"]);
  });
});

describe("rumbo y distancia", () => {
  it("el epicentro de Chupaca queda al este de Lima, a ~180 km", () => {
    const [sismo] = normalizarSismosIgp([CRUDO_IGP_REAL]);
    // La captura de referencia decia "178km de tu ubicacion (E->)".
    expect(distanciaKm(LIMA, sismo!.epicentro)).toBeGreaterThan(160);
    expect(distanciaKm(LIMA, sismo!.epicentro)).toBeLessThan(200);
    expect(rumboCardinal(LIMA, sismo!.epicentro)).toBe("E");
  });

  it("resuelve los cuatro rumbos basicos", () => {
    expect(rumboCardinal(LIMA, { lat: LIMA.lat + 1, lng: LIMA.lng })).toBe("N");
    expect(rumboCardinal(LIMA, { lat: LIMA.lat - 1, lng: LIMA.lng })).toBe("S");
    expect(rumboCardinal(LIMA, { lat: LIMA.lat, lng: LIMA.lng + 1 })).toBe("E");
    expect(rumboCardinal(LIMA, { lat: LIMA.lat, lng: LIMA.lng - 1 })).toBe("O");
  });
});

describe("radioAlertaKm — un sismo grande se siente mas lejos", () => {
  it("crece con la magnitud", () => {
    expect(radioAlertaKm(3.6)).toBe(150);
    expect(radioAlertaKm(4.8)).toBe(350);
    expect(radioAlertaKm(5.8)).toBe(600);
    expect(radioAlertaKm(7.0)).toBe(1000);
  });
});

describe("evaluarAlerta", () => {
  const AHORA = Date.parse("2026-08-08T00:20:00.000Z");
  const sismo = (over: Partial<SismoOficial> = {}): SismoOficial => ({
    ...normalizarSismosIgp([CRUDO_IGP_REAL])[0]!,
    ...over,
  });

  it("alerta a quien esta dentro del radio, con distancia y rumbo", () => {
    // 4.8 sube el radio a 350 km, y Lima esta a ~180 km del epicentro.
    const r = evaluarAlerta(sismo({ magnitud: 4.8 }), LIMA, AHORA);
    expect(r.alertar).toBe(true);
    expect(r.rumbo).toBe("E");
    expect(r.distanciaKm).toBeGreaterThan(160);
  });

  it("NO alerta por un sismo pequeno aunque este cerca", () => {
    const r = evaluarAlerta(sismo({ magnitud: 3.0 }), LIMA, AHORA);
    expect(r.alertar).toBe(false);
    expect(r.codigo).toBe("magnitud_baja");
  });

  it("NO alerta si el epicentro cae fuera del radio de esa magnitud", () => {
    // 3.7 deja el radio en 150 km y Lima esta a ~180 km: justo fuera.
    const r = evaluarAlerta(sismo(), LIMA, AHORA);
    expect(r.alertar).toBe(false);
    expect(r.codigo).toBe("lejos");
    expect(r.distanciaKm).toBeGreaterThan(r.radioKm);
  });

  it("NO alerta por un sismo viejo: eso es historial, no alerta", () => {
    const viejo = AHORA + POLITICA_ALERTA.antiguedadMaximaMs + 60_000;
    expect(evaluarAlerta(sismo({ magnitud: 6 }), LIMA, viejo).codigo).toBe("antiguo");
  });

  it("NO alerta sin ubicacion: avisar de todo ensena a silenciar la app", () => {
    const r = evaluarAlerta(sismo({ magnitud: 6 }), null, AHORA);
    expect(r.alertar).toBe(false);
    expect(r.codigo).toBe("sin_ubicacion");
  });
});

describe("construirMapaIntensidad — cuenta personas, no mide sismos", () => {
  const respuesta = (over: Partial<RespuestaIntensidad> = {}): RespuestaIntensidad => ({
    sismoId: "2026-0535",
    intensidad: "moderado",
    zonaId: "z-lima",
    zonaNombre: "Cercado de Lima",
    respondidoEn: 1,
    ...over,
  });

  it("agrupa por zona y promedia el grado", () => {
    const mapa = construirMapaIntensidad("2026-0535", [
      respuesta({ intensidad: "fuerte" }), // grado 4
      respuesta({ intensidad: "moderado" }), // grado 3
      respuesta({ zonaId: "z-sjl", zonaNombre: "San Juan de Lurigancho", intensidad: "leve" }),
    ]);

    expect(mapa.totalRespuestas).toBe(3);
    expect(mapa.zonas).toHaveLength(2);
    expect(mapa.zonas[0]).toMatchObject({ zonaNombre: "Cercado de Lima", respuestas: 2, gradoPromedio: 3.5 });
    expect(mapa.zonas[1]).toMatchObject({ zonaNombre: "San Juan de Lurigancho", gradoPromedio: 2 });
  });

  it("ignora respuestas de otro sismo", () => {
    const mapa = construirMapaIntensidad("2026-0535", [
      respuesta(),
      respuesta({ sismoId: "2026-0001" }),
    ]);
    expect(mapa.totalRespuestas).toBe(1);
  });

  it("un sismo sin respuestas da un mapa vacio, no un error", () => {
    const mapa = construirMapaIntensidad("2026-0535", []);
    expect(mapa).toEqual({ sismoId: "2026-0535", totalRespuestas: 0, zonas: [] });
  });

  it("ordena las zonas de mas sentido a menos", () => {
    const mapa = construirMapaIntensidad("2026-0535", [
      respuesta({ zonaId: "a", zonaNombre: "A", intensidad: "leve" }),
      respuesta({ zonaId: "b", zonaNombre: "B", intensidad: "muy_fuerte" }),
    ]);
    expect(mapa.zonas.map((z) => z.zonaNombre)).toEqual(["B", "A"]);
  });
});
