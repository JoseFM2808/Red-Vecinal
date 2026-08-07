import { describe, expect, it } from "vitest";
import {
  MINIMO_PERSONAS,
  VENTANA_SISMO_MS,
  resumirSismosRecientes,
  type ReporteSismoEvaluable,
} from "./sismos";

const AHORA = 1_754_500_000_000;
const MINUTO = 60_000;

const sismo = (over: Partial<ReporteSismoEvaluable> = {}): ReporteSismoEvaluable => ({
  categoria: "sismo_sentido",
  creadoEn: AHORA - 5 * MINUTO,
  zonaNombre: "San Juan de Lurigancho",
  descripcion: "Moderado: se movieron las cosas",
  autorDireccion: "0xuno",
  ...over,
});

describe("agregado comunitario de sismos", () => {
  it("no se activa con una sola persona", () => {
    const r = resumirSismosRecientes([sismo()], AHORA);
    expect(r.activo).toBe(false);
    expect(r.personas).toBe(1);
    expect(MINIMO_PERSONAS).toBe(2);
  });

  it("no se activa si la misma persona reporta dos veces", () => {
    const r = resumirSismosRecientes(
      [sismo(), sismo({ creadoEn: AHORA - 3 * MINUTO, zonaNombre: "Comas" })],
      AHORA,
    );
    expect(r.reportes).toBe(2);
    expect(r.personas).toBe(1);
    expect(r.activo).toBe(false);
  });

  it("se activa con dos personas distintas dentro de la ventana", () => {
    const r = resumirSismosRecientes(
      [sismo(), sismo({ autorDireccion: "0xdos", zonaNombre: "Comas" })],
      AHORA,
    );
    expect(r.activo).toBe(true);
    expect(r.personas).toBe(2);
  });

  it("ignora reportes que no son de sismo", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ categoria: "actividad_sospechosa" }),
        sismo({ categoria: "infraestructura", autorDireccion: "0xdos" }),
      ],
      AHORA,
    );
    expect(r.activo).toBe(false);
    expect(r.reportes).toBe(0);
  });

  it("descarta lo que quedo fuera de los 30 minutos", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ creadoEn: AHORA - VENTANA_SISMO_MS - MINUTO }),
        sismo({ autorDireccion: "0xdos", creadoEn: AHORA - 31 * MINUTO }),
      ],
      AHORA,
    );
    expect(r.activo).toBe(false);
  });

  it("ignora reportes con fecha futura", () => {
    const r = resumirSismosRecientes(
      [sismo(), sismo({ autorDireccion: "0xdos", creadoEn: AHORA + MINUTO })],
      AHORA,
    );
    expect(r.personas).toBe(1);
  });

  it("agrupa por zona y ordena por cantidad", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ autorDireccion: "0xa", zonaNombre: "Comas" }),
        sismo({ autorDireccion: "0xb", zonaNombre: "Comas" }),
        sismo({ autorDireccion: "0xc", zonaNombre: "Chorrillos" }),
      ],
      AHORA,
    );
    expect(r.zonas).toEqual([
      { nombre: "Comas", total: 2 },
      { nombre: "Chorrillos", total: 1 },
    ]);
  });

  it("deduce la intensidad mas repetida", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ autorDireccion: "0xa", descripcion: "Leve: apenas se sintio" }),
        sismo({ autorDireccion: "0xb", descripcion: "Fuerte: dificil mantenerse en pie" }),
        sismo({ autorDireccion: "0xc", descripcion: "Fuerte, se cayo un cuadro" }),
      ],
      AHORA,
    );
    expect(r.intensidad).toBe("Fuerte");
  });

  it("ante empate se queda con la intensidad mas severa", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ autorDireccion: "0xa", descripcion: "Leve: apenas se sintio" }),
        sismo({ autorDireccion: "0xb", descripcion: "Fuerte: dificil mantenerse en pie" }),
      ],
      AHORA,
    );
    expect(r.intensidad).toBe("Fuerte");
  });

  it("deja la intensidad en null si nadie la declaro", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ autorDireccion: "0xa", descripcion: "Se escucho un ruido raro" }),
        sismo({ autorDireccion: "0xb", descripcion: "" }),
      ],
      AHORA,
    );
    expect(r.intensidad).toBeNull();
    expect(r.activo).toBe(true);
  });

  it("devuelve el instante del primer y del ultimo reporte", () => {
    const r = resumirSismosRecientes(
      [
        sismo({ autorDireccion: "0xa", creadoEn: AHORA - 9 * MINUTO }),
        sismo({ autorDireccion: "0xb", creadoEn: AHORA - 2 * MINUTO }),
      ],
      AHORA,
    );
    expect(r.primeroEn).toBe(AHORA - 9 * MINUTO);
    expect(r.ultimoEn).toBe(AHORA - 2 * MINUTO);
  });

  it("sin reportes devuelve el resumen vacio", () => {
    expect(resumirSismosRecientes([], AHORA).activo).toBe(false);
    expect(resumirSismosRecientes([], AHORA).zonas).toEqual([]);
  });
});
