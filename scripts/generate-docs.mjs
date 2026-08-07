#!/usr/bin/env node
/**
 * Genera docs/ARQUITECTURA.md y docs/DECISIONES.md desde las fuentes de verdad en src/data.
 * La app renderiza exactamente los mismos JSON, asi que el documento y el producto
 * no pueden decir cosas distintas.
 *
 *   npm run docs         -> escribe los .md
 *   npm run docs:check   -> falla si algun .md quedo desactualizado (para CI / npm run check)
 *
 * Los archivos generados NO se editan a mano: se edita el JSON y se vuelve a correr.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const soloVerificar = process.argv.includes("--check");

const leer = (r) => JSON.parse(readFileSync(resolve(raiz, r), "utf8"));
const arq = leer("src/data/arquitectura.json");
const dec = leer("src/data/decisiones.json");

const AVISO = (origen) =>
  `<!-- GENERADO AUTOMATICAMENTE desde ${origen} — no editar a mano. Corre \`npm run docs\`. -->`;

const ETIQUETA_ESTADO = {
  listo: "Listo",
  simulado: "Simulado",
  "pendiente-equipo": "Pendiente (equipo de contratos)",
};

const NOMBRE_CRITERIO = {
  problema: "Problema e impacto",
  ux: "Producto y UX",
  tecnica: "Implementacion tecnica",
  arbitrum: "Ecosistema Arbitrum",
  pitch: "Pitch y demo",
};

// --- ARQUITECTURA.md --------------------------------------------------------

const generarArquitectura = () => {
  const l = [];
  l.push(AVISO("src/data/arquitectura.json"));
  l.push("");
  l.push(`# Arquitectura — ${arq.meta.nombre}`);
  l.push("");
  l.push(`**Version:** ${arq.meta.version} · **Actualizado:** ${arq.meta.actualizado}`);
  l.push("");
  l.push(arq.meta.resumen);
  l.push("");

  l.push("## El problema");
  l.push("");
  l.push(`> ${arq.problema.tesis}`);
  l.push("");
  for (const e of arq.problema.evidencia) {
    l.push(`- **${e.dato}** — ${e.detalle}`);
    l.push(`  <br>Fuente: ${e.fuente}`);
  }
  l.push("");
  l.push("### Para quien");
  l.push("");
  l.push("| Perfil | Que necesita |");
  l.push("| --- | --- |");
  for (const u of arq.problema.usuarios) l.push(`| ${u.perfil} | ${u.necesidad} |`);
  l.push("");

  l.push("## Principios");
  l.push("");
  for (const p of arq.principios) l.push(`- ${p}`);
  l.push("");

  l.push("## Capas");
  l.push("");
  for (const c of arq.capas) {
    l.push(`### ${c.nombre} \`${c.id}\` — ${ETIQUETA_ESTADO[c.estado]}`);
    l.push("");
    l.push(c.rol);
    l.push("");
    l.push(`- Tecnologias: ${c.tecnologias.join(", ")}`);
    l.push(`- Codigo: ${c.archivos.map((a) => `\`${a}\``).join(", ")}`);
    l.push("");
  }

  l.push("## Flujo de un reporte");
  l.push("");
  l.push("| # | Paso | Detalle | Capa | On-chain |");
  l.push("| --- | --- | --- | --- | --- |");
  for (const p of arq.flujo) {
    l.push(`| ${p.n} | ${p.titulo} | ${p.detalle} | \`${p.capa}\` | ${p.onchain ? "si" : "no"} |`);
  }
  l.push("");

  l.push("## Contratos");
  l.push("");
  for (const c of arq.contratos) {
    l.push(`### \`${c.nombre}\` — ${ETIQUETA_ESTADO[c.estado]}`);
    l.push("");
    l.push(`${c.responsabilidad}`);
    l.push("");
    l.push(`Red: ${c.red}`);
    l.push("");
    for (const f of c.funciones) {
      l.push(`- \`${f.firma}\``);
      l.push(`  <br>${f.nota}`);
    }
    l.push("");
  }

  l.push("## Por que Arbitrum");
  l.push("");
  l.push(`> ${arq.arbitrum.porQue}`);
  l.push("");
  for (const u of arq.arbitrum.usos) l.push(`- **${u.titulo}** — ${u.detalle}`);
  l.push("");
  l.push("| Red | chainId | Uso |");
  l.push("| --- | --- | --- |");
  for (const r of arq.arbitrum.redes) l.push(`| ${r.nombre} | ${r.chainId} | ${r.uso} |`);
  l.push("");

  l.push("## Limites honestos de la beta");
  l.push("");
  l.push("| Tema | Que hace hoy | Que falta |");
  l.push("| --- | --- | --- |");
  for (const x of arq.limites) l.push(`| ${x.tema} | ${x.queHacemos} | ${x.queFaltaria} |`);
  l.push("");

  l.push("## Siguientes pasos");
  l.push("");
  for (const s of arq.siguientesPasos) {
    l.push(`- **${s.titulo}** (${s.responsable}) — ${s.detalle}`);
    l.push(`  <br>Desbloquea: ${s.bloquea}`);
  }
  l.push("");

  l.push("## Como responde a la rubrica");
  l.push("");
  for (const c of arq.rubrica) {
    l.push(`### ${c.criterio} — ${c.peso}%`);
    l.push("");
    for (const e of c.evidencia) l.push(`- ${e}`);
    l.push("");
  }

  return l.join("\n");
};

// --- DECISIONES.md ----------------------------------------------------------

const generarDecisiones = () => {
  const l = [];
  const lista = dec.decisiones;
  const pendientes = lista.filter((d) => d.requiere_validacion_humana);

  l.push(AVISO("src/data/decisiones.json"));
  l.push("");
  l.push(`# Bitacora de decisiones — ${dec.proyecto}`);
  l.push("");
  l.push(dec.descripcion);
  l.push("");
  l.push(
    `**${lista.length} decisiones registradas · ${pendientes.length} esperan validacion humana**`,
  );
  l.push("");

  if (pendientes.length > 0) {
    l.push("## Esperan que una persona decida");
    l.push("");
    l.push("| ID | Decision | Que hay que confirmar |");
    l.push("| --- | --- | --- |");
    for (const d of pendientes) l.push(`| ${d.id} | ${d.titulo} | ${d.nota_para_humano} |`);
    l.push("");
  }

  l.push("## Indice");
  l.push("");
  l.push("| ID | Decision | Autor | Estado | Reversibilidad | Rubrica |");
  l.push("| --- | --- | --- | --- | --- | --- |");
  for (const d of lista) {
    const crit = d.criterios_rubrica.map((c) => NOMBRE_CRITERIO[c]).join(", ");
    l.push(
      `| [${d.id}](#${d.id.toLowerCase()}) | ${d.titulo} | ${d.autor} | ${d.estado} | ${d.reversibilidad} | ${crit} |`,
    );
  }
  l.push("");

  for (const d of lista) {
    l.push("---");
    l.push("");
    l.push(`## ${d.id}`);
    l.push("");
    l.push(`### ${d.titulo}`);
    l.push("");
    l.push(
      `\`${d.fecha}\` · autor: **${d.autor}** · estado: **${d.estado}** · reversibilidad: **${d.reversibilidad}**`,
    );
    l.push("");
    l.push(`**Contexto.** ${d.contexto}`);
    l.push("");
    l.push("**Alternativas descartadas.**");
    l.push("");
    for (const o of d.opciones) l.push(`- *${o.nombre}* — ${o.descartada_porque}`);
    l.push("");
    l.push(`**Decision.** ${d.decision}`);
    l.push("");
    l.push("**Consecuencias.**");
    l.push("");
    for (const c of d.consecuencias) l.push(`- ${c}`);
    l.push("");
    l.push(`**Costo de revertir.** ${d.costo_de_revertir}`);
    l.push("");
    l.push(`**Sirve a.** ${d.criterios_rubrica.map((c) => NOMBRE_CRITERIO[c]).join(", ")}`);
    l.push("");
    l.push(`**Evidencia en el codigo.** ${d.evidencia.map((e) => `\`${e}\``).join(", ")}`);
    l.push("");
    if (d.requiere_validacion_humana) {
      l.push(`> **Necesita decision humana:** ${d.nota_para_humano}`);
      l.push("");
    }
  }

  return l.join("\n");
};

// --- escritura / verificacion ----------------------------------------------

const salidas = [
  ["docs/ARQUITECTURA.md", generarArquitectura()],
  ["docs/DECISIONES.md", generarDecisiones()],
];

const normalizar = (s) => s.replace(/\r\n/g, "\n").trimEnd();
let desactualizados = 0;

for (const [ruta, contenido] of salidas) {
  const absoluta = resolve(raiz, ruta);
  const nuevo = `${contenido.trimEnd()}\n`;

  if (soloVerificar) {
    const actual = existsSync(absoluta) ? readFileSync(absoluta, "utf8") : "";
    if (normalizar(actual) !== normalizar(nuevo)) {
      console.error(`✗ ${ruta} esta desactualizado respecto a src/data`);
      desactualizados++;
    }
    continue;
  }

  writeFileSync(absoluta, nuevo, "utf8");
  console.log(`✓ ${ruta}`);
}

if (soloVerificar) {
  if (desactualizados > 0) {
    console.error("\nCorre `npm run docs` y commitea el resultado.\n");
    process.exit(1);
  }
  console.log("✓ documentacion generada sincronizada con src/data");
}
