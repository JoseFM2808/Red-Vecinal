import { describe, expect, it } from "vitest";
import {
  POLITICA_RECOMPENSA,
  buscarCorroboraciones,
  evaluarCorroboracion,
  evaluarReporte,
  recompensaTrasCorroborar,
  type EntradaCorroboracion,
  type EntradaEvaluacion,
  type ReporteEvaluable,
} from "./antisybil";
import { zonaIdDe } from "./geo";

/**
 * Estos tests son la especificacion ejecutable de TokenReward.sol.
 * Si un caso de aqui cambia, el contrato tiene que cambiar con el.
 */

const AHORA = 1_754_500_000_000; // instante fijo: nada aqui lee el reloj
const MINUTO = 60_000;

const ESQUINA = { lat: -12.0464, lng: -77.0428 };
const A_150_M = { lat: -12.0477, lng: -77.0428 }; // ~145 m al sur
const A_2_KM = { lat: -12.0644, lng: -77.0428 };

const reporte = (over: Partial<ReporteEvaluable> = {}): ReporteEvaluable => ({
  autorDireccion: "0xvecina",
  zonaId: zonaIdDe(ESQUINA),
  categoria: "actividad_sospechosa",
  coordenada: ESQUINA,
  creadoEn: AHORA - 5 * MINUTO,
  ...over,
});

const entrada = (over: Partial<EntradaEvaluacion> = {}): EntradaEvaluacion => ({
  autorDireccion: "0xvecina",
  zonaId: zonaIdDe(ESQUINA),
  categoria: "actividad_sospechosa",
  coordenada: ESQUINA,
  ahora: AHORA,
  reportesPrevios: [],
  ...over,
});

describe("limite por wallet", () => {
  it("acepta el primer reporte de una cuenta nueva", () => {
    const r = evaluarReporte(entrada());
    expect(r.permitido).toBe(true);
    expect(r.codigo).toBe("ok");
  });

  it("rechaza el cuarto reporte dentro de la misma hora", () => {
    const previos = [
      reporte({ creadoEn: AHORA - 50 * MINUTO, zonaId: "zA" }),
      reporte({ creadoEn: AHORA - 40 * MINUTO, zonaId: "zB" }),
      reporte({ creadoEn: AHORA - 30 * MINUTO, zonaId: "zC" }),
    ];
    const r = evaluarReporte(entrada({ reportesPrevios: previos, zonaId: "zD" }));

    expect(r.permitido).toBe(false);
    expect(r.codigo).toBe("limite_horario");
    // Se libera cuando el mas antiguo sale de la ventana de una hora.
    expect(r.proximoPermitidoEn).toBe(AHORA - 50 * MINUTO + POLITICA_RECOMPENSA.ventanaMs);
    expect(r.recompensa.monto).toBe(0);
  });

  it("vuelve a aceptar cuando los reportes viejos salen de la ventana", () => {
    const previos = [
      reporte({ creadoEn: AHORA - 70 * MINUTO, zonaId: "zA" }),
      reporte({ creadoEn: AHORA - 65 * MINUTO, zonaId: "zB" }),
      reporte({ creadoEn: AHORA - 61 * MINUTO, zonaId: "zC" }),
    ];
    expect(evaluarReporte(entrada({ reportesPrevios: previos, zonaId: "zD" })).permitido).toBe(true);
  });

  it("no cuenta los reportes de otras cuentas contra el limite propio", () => {
    const previos = [
      reporte({ autorDireccion: "0xotro1", creadoEn: AHORA - 10 * MINUTO, zonaId: "zA" }),
      reporte({ autorDireccion: "0xotro2", creadoEn: AHORA - 9 * MINUTO, zonaId: "zB" }),
      reporte({ autorDireccion: "0xotro3", creadoEn: AHORA - 8 * MINUTO, zonaId: "zC" }),
    ];
    expect(evaluarReporte(entrada({ reportesPrevios: previos, zonaId: "zD" })).permitido).toBe(true);
  });

  it("trata las direcciones sin distinguir mayusculas", () => {
    const previos = [
      reporte({ autorDireccion: "0xVECINA", creadoEn: AHORA - 3 * MINUTO, zonaId: "zA" }),
      reporte({ autorDireccion: "0xVecina", creadoEn: AHORA - 2 * MINUTO, zonaId: "zB" }),
      reporte({ autorDireccion: "0xvecina", creadoEn: AHORA - MINUTO, zonaId: "zC" }),
    ];
    expect(evaluarReporte(entrada({ reportesPrevios: previos, zonaId: "zD" })).codigo).toBe(
      "limite_horario",
    );
  });
});

describe("espera por zona", () => {
  it("rechaza repetir la misma zona antes de 15 minutos", () => {
    const previos = [reporte({ creadoEn: AHORA - 5 * MINUTO })];
    const r = evaluarReporte(entrada({ reportesPrevios: previos }));

    expect(r.permitido).toBe(false);
    expect(r.codigo).toBe("zona_en_espera");
    expect(r.mensaje).toContain("10 min");
  });

  it("permite reportar en otra zona sin esperar", () => {
    const previos = [reporte({ creadoEn: AHORA - 5 * MINUTO })];
    const r = evaluarReporte(
      entrada({ reportesPrevios: previos, zonaId: zonaIdDe(A_2_KM), coordenada: A_2_KM }),
    );
    expect(r.permitido).toBe(true);
  });

  it("permite repetir la zona pasados los 15 minutos", () => {
    const previos = [reporte({ creadoEn: AHORA - 16 * MINUTO })];
    expect(evaluarReporte(entrada({ reportesPrevios: previos })).permitido).toBe(true);
  });

  it("el limite horario tiene prioridad sobre el de zona", () => {
    const previos = [
      reporte({ creadoEn: AHORA - 30 * MINUTO, zonaId: "zA" }),
      reporte({ creadoEn: AHORA - 20 * MINUTO, zonaId: "zB" }),
      reporte({ creadoEn: AHORA - 2 * MINUTO }), // misma zona, tambien en espera
    ];
    expect(evaluarReporte(entrada({ reportesPrevios: previos })).codigo).toBe("limite_horario");
  });
});

describe("corroboracion como prueba de presencia", () => {
  it("sin corroboracion la recompensa queda pendiente", () => {
    const r = evaluarReporte(entrada());
    expect(r.recompensa.estado).toBe("pendiente_corroboracion");
    expect(r.recompensa.monto).toBe(POLITICA_RECOMPENSA.recompensaBase);
    expect(r.recompensa.multiplicador).toBe(1);
  });

  it("otro vecino cerca y a tiempo activa el multiplicador", () => {
    const previos = [
      reporte({ autorDireccion: "0xotro", coordenada: A_150_M, creadoEn: AHORA - 10 * MINUTO }),
    ];
    const r = evaluarReporte(entrada({ reportesPrevios: previos, zonaId: "zLibre" }));

    expect(r.corroboraciones).toEqual(["0xotro"]);
    expect(r.recompensa.estado).toBe("otorgada");
    expect(r.recompensa.monto).toBe(15);
  });

  it("no cuenta corroboraciones de la propia cuenta", () => {
    const previos = [reporte({ coordenada: A_150_M, creadoEn: AHORA - 40 * MINUTO })];
    expect(buscarCorroboraciones(entrada({ reportesPrevios: previos }))).toEqual([]);
  });

  it("no cuenta reportes fuera del radio de 300 m", () => {
    const previos = [
      reporte({ autorDireccion: "0xotro", coordenada: A_2_KM, creadoEn: AHORA - 5 * MINUTO }),
    ];
    expect(buscarCorroboraciones(entrada({ reportesPrevios: previos }))).toEqual([]);
  });

  it("no cuenta reportes fuera de la ventana de 30 minutos", () => {
    const previos = [
      reporte({ autorDireccion: "0xotro", coordenada: A_150_M, creadoEn: AHORA - 31 * MINUTO }),
    ];
    expect(buscarCorroboraciones(entrada({ reportesPrevios: previos }))).toEqual([]);
  });

  it("no cuenta reportes de otra categoria", () => {
    const previos = [
      reporte({
        autorDireccion: "0xotro",
        coordenada: A_150_M,
        creadoEn: AHORA - 5 * MINUTO,
        categoria: "infraestructura",
      }),
    ];
    expect(buscarCorroboraciones(entrada({ reportesPrevios: previos }))).toEqual([]);
  });

  it("cuenta una sola vez a quien reporta dos veces", () => {
    const previos = [
      reporte({ autorDireccion: "0xotro", coordenada: A_150_M, creadoEn: AHORA - 5 * MINUTO }),
      reporte({ autorDireccion: "0xOtro", coordenada: ESQUINA, creadoEn: AHORA - 3 * MINUTO }),
    ];
    expect(buscarCorroboraciones(entrada({ reportesPrevios: previos }))).toEqual(["0xotro"]);
  });

  it("ignora reportes con fecha futura", () => {
    const previos = [
      reporte({ autorDireccion: "0xotro", coordenada: A_150_M, creadoEn: AHORA + 5 * MINUTO }),
    ];
    expect(buscarCorroboraciones(entrada({ reportesPrevios: previos }))).toEqual([]);
  });
});

describe("recompensa tras corroboracion posterior", () => {
  it("pasa de pendiente a otorgada", () => {
    expect(recompensaTrasCorroborar(0).estado).toBe("pendiente_corroboracion");
    expect(recompensaTrasCorroborar(1).estado).toBe("otorgada");
    expect(recompensaTrasCorroborar(1).monto).toBe(15);
  });
});

/**
 * Corroboracion manual: el boton "Yo tambien lo vi" (ADR-041).
 *
 * Es la unica senal de presencia del MVP. Sin la comprobacion de distancia, confirmar
 * era gratis desde cualquier sitio y el multiplicador x1.5 se farmeaba entre conocidos.
 */
describe("evaluarCorroboracion — quien puede confirmar el reporte de otro", () => {
  const reporteBase = {
    autorDireccion: "0xvecina",
    coordenada: ESQUINA,
    corroboraciones: [] as readonly string[],
  };

  const corroboracion = (over: Partial<EntradaCorroboracion> = {}): EntradaCorroboracion => ({
    corroborador: "0xotro",
    ubicacionCorroborador: ESQUINA,
    reporte: reporteBase,
    ...over,
  });

  it("permite confirmar a quien esta al lado del hecho", () => {
    const r = evaluarCorroboracion(corroboracion());
    expect(r.permitido).toBe(true);
    expect(r.codigo).toBe("ok");
    expect(r.distanciaM).toBe(0);
  });

  it("permite confirmar dentro del radio, a 150 m", () => {
    const r = evaluarCorroboracion(corroboracion({ ubicacionCorroborador: A_150_M }));
    expect(r.permitido).toBe(true);
    expect(r.distanciaM).toBeLessThan(POLITICA_RECOMPENSA.radioCorroboracionM);
  });

  it("RECHAZA a quien esta a 2 km: es el caso que antes pasaba", () => {
    const r = evaluarCorroboracion(corroboracion({ ubicacionCorroborador: A_2_KM }));
    expect(r.permitido).toBe(false);
    expect(r.codigo).toBe("demasiado_lejos");
    expect(r.distanciaM).toBeGreaterThan(POLITICA_RECOMPENSA.radioCorroboracionM);
    // El mensaje dice la distancia real: sin eso, el rechazo parece un fallo de la app.
    expect(r.mensaje).toContain(`${r.distanciaM} m`);
  });

  it("rechaza sin ubicacion, para que negar el permiso no sea la via de escape", () => {
    const r = evaluarCorroboracion(corroboracion({ ubicacionCorroborador: null }));
    expect(r.permitido).toBe(false);
    expect(r.codigo).toBe("sin_ubicacion");
    expect(r.distanciaM).toBeNull();
  });

  it("rechaza corroborar el propio reporte, aunque estes encima", () => {
    const r = evaluarCorroboracion(corroboracion({ corroborador: "0xVecina" }));
    expect(r.permitido).toBe(false);
    expect(r.codigo).toBe("es_tuyo");
  });

  it("rechaza corroborar dos veces, sin importar mayusculas de la direccion", () => {
    const r = evaluarCorroboracion(
      corroboracion({ reporte: { ...reporteBase, corroboraciones: ["0xOTRO"] } }),
    );
    expect(r.permitido).toBe(false);
    expect(r.codigo).toBe("ya_corroboraste");
  });

  it("el orden de las reglas: ser el autor gana a no tener ubicacion", () => {
    const r = evaluarCorroboracion(
      corroboracion({ corroborador: "0xvecina", ubicacionCorroborador: null }),
    );
    expect(r.codigo).toBe("es_tuyo");
  });

  it("justo en el limite de 300 m se permite; pasado, no", () => {
    // 300 m al sur de ESQUINA: 1 grado de latitud ~ 111.32 km.
    const justo = { lat: ESQUINA.lat - 300 / 111_320, lng: ESQUINA.lng };
    const pasado = { lat: ESQUINA.lat - 340 / 111_320, lng: ESQUINA.lng };

    expect(evaluarCorroboracion(corroboracion({ ubicacionCorroborador: justo })).permitido).toBe(
      true,
    );
    expect(evaluarCorroboracion(corroboracion({ ubicacionCorroborador: pasado })).permitido).toBe(
      false,
    );
  });

  it("usa el mismo radio que la corroboracion automatica: la regla es una sola", () => {
    expect(POLITICA_RECOMPENSA.radioCorroboracionM).toBe(300);
  });
});
