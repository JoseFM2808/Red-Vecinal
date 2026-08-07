#!/usr/bin/env node
/**
 * Valida las fuentes de verdad del proyecto antes de que compilen o se generen docs.
 *
 *   src/data/decisiones.json   -> bitacora auditable de decisiones (ver docs/REGLAS-IA.md)
 *   src/data/arquitectura.json -> unica fuente de la pestana Arquitectura y de docs/ARQUITECTURA.md
 *
 * Corre con `npm run validate` y dentro de `npm run check`. Sin dependencias.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errores = [];

const fallo = (donde, mensaje) => errores.push(`${donde}: ${mensaje}`);

const leerJson = (rutaRelativa) => {
  try {
    return JSON.parse(readFileSync(resolve(raiz, rutaRelativa), "utf8"));
  } catch (error) {
    fallo(rutaRelativa, `no se pudo leer o parsear (${error.message})`);
    return null;
  }
};

// --- decisiones -------------------------------------------------------------

const ESTADOS = new Set(["propuesta", "aceptada", "reemplazada", "revertida"]);
const AUTORES = new Set(["IA", "Humano", "IA+Humano"]);
const REVERSIBILIDAD = new Set(["alta", "media", "baja"]);
const CRITERIOS = new Set(["problema", "ux", "tecnica", "arbitrum", "pitch"]);
const CAMPOS_DECISION = [
  "id",
  "titulo",
  "fecha",
  "autor",
  "estado",
  "contexto",
  "opciones",
  "decision",
  "consecuencias",
  "reversibilidad",
  "costo_de_revertir",
  "criterios_rubrica",
  "evidencia",
  "requiere_validacion_humana",
];

const validarDecisiones = (datos) => {
  if (!datos) return;
  const lista = datos.decisiones;
  if (!Array.isArray(lista) || lista.length === 0) {
    fallo("decisiones.json", "se esperaba un arreglo `decisiones` no vacio");
    return;
  }

  const vistos = new Set();
  for (const [i, d] of lista.entries()) {
    const donde = `decisiones[${i}] (${d?.id ?? "sin id"})`;

    for (const campo of CAMPOS_DECISION) {
      if (d[campo] === undefined) fallo(donde, `falta el campo obligatorio \`${campo}\``);
    }
    if (typeof d.id !== "string" || !/^ADR-\d{3}$/.test(d.id)) {
      fallo(donde, "el id debe tener el formato ADR-001");
    } else if (vistos.has(d.id)) {
      fallo(donde, `id duplicado: ${d.id}`);
    } else {
      vistos.add(d.id);
    }
    if (typeof d.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) {
      fallo(donde, "la fecha debe ser AAAA-MM-DD");
    }
    if (!ESTADOS.has(d.estado)) fallo(donde, `estado invalido: ${d.estado}`);
    if (!AUTORES.has(d.autor)) fallo(donde, `autor invalido: ${d.autor}`);
    if (!REVERSIBILIDAD.has(d.reversibilidad)) {
      fallo(donde, `reversibilidad invalida: ${d.reversibilidad}`);
    }
    if (!Array.isArray(d.opciones) || d.opciones.length === 0) {
      fallo(donde, "hay que declarar al menos una alternativa descartada y por que");
    } else {
      for (const o of d.opciones) {
        if (!o?.nombre || !o?.descartada_porque) {
          fallo(donde, "cada opcion necesita `nombre` y `descartada_porque`");
        }
      }
    }
    if (!Array.isArray(d.consecuencias) || d.consecuencias.length === 0) {
      fallo(donde, "hay que declarar al menos una consecuencia");
    }
    if (!Array.isArray(d.evidencia) || d.evidencia.length === 0) {
      fallo(donde, "hay que apuntar al menos a un archivo como evidencia");
    }
    if (!Array.isArray(d.criterios_rubrica) || d.criterios_rubrica.length === 0) {
      fallo(donde, "hay que enlazar la decision con al menos un criterio de la rubrica");
    } else {
      for (const c of d.criterios_rubrica) {
        if (!CRITERIOS.has(c)) {
          fallo(donde, `criterio desconocido: ${c} (validos: ${[...CRITERIOS].join(", ")})`);
        }
      }
    }
    if (typeof d.requiere_validacion_humana !== "boolean") {
      fallo(donde, "`requiere_validacion_humana` debe ser true o false");
    }
    if (d.requiere_validacion_humana === true && !d.nota_para_humano) {
      fallo(donde, "si requiere validacion humana, hay que escribir `nota_para_humano`");
    }
  }
};

// --- arquitectura -----------------------------------------------------------

const ESTADOS_MODULO = new Set(["listo", "simulado", "pendiente-equipo"]);

const validarArquitectura = (datos) => {
  if (!datos) return;
  for (const clave of [
    "meta",
    "problema",
    "principios",
    "capas",
    "flujo",
    "contratos",
    "arbitrum",
    "limites",
    "siguientesPasos",
    "rubrica",
  ]) {
    if (datos[clave] === undefined) fallo("arquitectura.json", `falta la seccion \`${clave}\``);
  }

  for (const [i, capa] of (datos.capas ?? []).entries()) {
    const donde = `arquitectura.capas[${i}] (${capa?.id ?? "sin id"})`;
    for (const campo of ["id", "nombre", "rol", "estado", "tecnologias", "archivos"]) {
      if (capa[campo] === undefined) fallo(donde, `falta \`${campo}\``);
    }
    if (!ESTADOS_MODULO.has(capa.estado)) {
      fallo(donde, `estado invalido: ${capa.estado} (validos: ${[...ESTADOS_MODULO].join(", ")})`);
    }
  }

  const pasos = (datos.flujo ?? []).map((p) => p.n);
  const esperado = pasos.map((_, i) => i + 1);
  if (JSON.stringify(pasos) !== JSON.stringify(esperado)) {
    fallo("arquitectura.flujo", "los pasos deben estar numerados 1..n en orden");
  }

  const pesos = (datos.rubrica ?? []).reduce((suma, c) => suma + (c.peso ?? 0), 0);
  if (pesos !== 100) {
    fallo("arquitectura.rubrica", `los pesos deben sumar 100, suman ${pesos}`);
  }

  for (const [i, e] of (datos.problema?.evidencia ?? []).entries()) {
    if (!e?.fuente) {
      fallo(`arquitectura.problema.evidencia[${i}]`, "todo dato de impacto necesita `fuente`");
    }
  }
};

// --- salida -----------------------------------------------------------------

validarDecisiones(leerJson("src/data/decisiones.json"));
validarArquitectura(leerJson("src/data/arquitectura.json"));

if (errores.length > 0) {
  console.error(`\n✗ ${errores.length} problema(s) en las fuentes de verdad:\n`);
  for (const e of errores) console.error(`  - ${e}`);
  console.error("\nRevisa docs/REGLAS-IA.md para el formato esperado.\n");
  process.exit(1);
}

console.log("✓ decisiones.json y arquitectura.json validos");
