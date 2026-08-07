import { describe, expect, it } from "vitest";
import {
  POLITICA_RECOMPENSA,
  buscarCorroboraciones,
  evaluarReporte,
  recompensaTrasCorroborar,
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
