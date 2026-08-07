"use client";

import { useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { EtiquetaEstado, Tarjeta } from "@/components/ui/primitivos";
import {
  ARQUITECTURA,
  DECISIONES,
  DECISIONES_PENDIENTES,
  NOMBRE_CRITERIO,
  type Decision,
} from "@/lib/arquitectura";
import { COSTO_ANCLAJE_L1_USD, obtenerRed } from "@/lib/chain";
import { CONFIG } from "@/lib/config";
import { formatearUsd } from "@/lib/formato";

/**
 * Pestana Arquitectura: como esta construido el programa, en el programa mismo.
 *
 * Todo lo que se ve aqui sale de src/data/arquitectura.json y src/data/decisiones.json,
 * los mismos archivos que generan docs/ARQUITECTURA.md y docs/DECISIONES.md (ADR-006).
 * No hay un diagrama que se pueda quedar desactualizado: si el codigo cambia de estado,
 * cambia el JSON, y cambian a la vez la app y la documentacion.
 */

type Seccion = "sistema" | "flujo" | "arbitrum" | "decisiones" | "entrega";

const SECCIONES: { id: Seccion; etiqueta: string }[] = [
  { id: "sistema", etiqueta: "Sistema" },
  { id: "flujo", etiqueta: "Flujo" },
  { id: "arbitrum", etiqueta: "Arbitrum" },
  { id: "decisiones", etiqueta: "Decisiones" },
  { id: "entrega", etiqueta: "Entrega" },
];

export function PanelArquitectura() {
  const [seccion, setSeccion] = useState<Seccion>("sistema");
  const { meta, principios, capas, flujo, contratos, arbitrum, limites, siguientesPasos, rubrica } =
    ARQUITECTURA;

  const conteo = {
    listo: capas.filter((c) => c.estado === "listo").length,
    simulado: capas.filter((c) => c.estado === "simulado").length,
    pendiente: capas.filter((c) => c.estado === "pendiente-equipo").length,
  };

  return (
    <div className="px-4">
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSeccion(s.id)}
            className={`toque flex shrink-0 items-center rounded-full border px-4 text-xs font-medium transition ${
              seccion === s.id
                ? "border-marca/50 bg-marca/15 text-marca"
                : "border-borde bg-superficie text-suave"
            }`}
          >
            {s.etiqueta}
          </button>
        ))}
      </div>

      {seccion === "sistema" ? (
        <div className="space-y-5">
          <Tarjeta>
            <p className="text-sm leading-relaxed text-suave">{meta.resumen}</p>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-borde pt-3 text-[11px] text-tenue">
              <span>v{meta.version}</span>
              <span aria-hidden>·</span>
              <span>actualizado {meta.actualizado}</span>
              <span aria-hidden>·</span>
              <span>{capas.length} capas</span>
            </div>
          </Tarjeta>

          <div className="grid grid-cols-3 gap-2">
            {[
              { n: conteo.listo, t: "listas", clase: "text-marca" },
              { n: conteo.simulado, t: "simuladas", clase: "text-ambar" },
              { n: conteo.pendiente, t: "pendientes", clase: "text-info" },
            ].map((x) => (
              <div key={x.t} className="tarjeta px-2 py-3 text-center">
                <p className={`text-2xl font-semibold tabular-nums ${x.clase}`}>{x.n}</p>
                <p className="mt-0.5 text-[11px] text-tenue">{x.t}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="etiqueta-seccion mb-2">Principios</h2>
            <ul className="tarjeta space-y-2 p-4">
              {principios.map((p) => (
                <li key={p} className="flex gap-2 text-xs leading-relaxed text-suave">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-marca" />
                  {p}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="etiqueta-seccion mb-2">Capas del sistema</h2>
            <div className="space-y-2">
              {capas.map((capa) => (
                <Tarjeta key={capa.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-texto">{capa.nombre}</h3>
                    <EtiquetaEstado estado={capa.estado} />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-suave">{capa.rol}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {capa.tecnologias.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-superficie-alta px-1.5 py-0.5 text-[10px] text-tenue"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-tenue">
                    {capa.archivos.join("  ·  ")}
                  </p>
                </Tarjeta>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {seccion === "flujo" ? (
        <div className="space-y-5">
          <section>
            <h2 className="etiqueta-seccion mb-2">De la calle a la cadena</h2>
            <ol className="space-y-1.5">
              {flujo.map((paso) => (
                <li key={paso.n} className="tarjeta flex gap-3 p-3.5">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                      paso.onchain ? "bg-marca text-fondo" : "bg-superficie-alta text-suave"
                    }`}
                  >
                    {paso.n}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-texto">{paso.titulo}</h3>
                      {paso.onchain ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-marca/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-marca">
                          <Icono nombre="cadena" className="h-2.5 w-2.5" />
                          on-chain
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-suave">{paso.detalle}</p>
                    <p className="mt-1 font-mono text-[10px] text-tenue">capa: {paso.capa}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="etiqueta-seccion mb-2">Contratos</h2>
            <div className="space-y-2">
              {contratos.map((c) => (
                <Tarjeta key={c.nombre} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-mono text-sm font-semibold text-texto">{c.nombre}</h3>
                    <EtiquetaEstado estado={c.estado} />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-suave">{c.responsabilidad}</p>
                  <div className="mt-2.5 space-y-1.5 border-t border-borde pt-2.5">
                    {c.funciones.map((f) => (
                      <div key={f.firma}>
                        <p className="break-all font-mono text-[10px] leading-relaxed text-info">
                          {f.firma}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-tenue">{f.nota}</p>
                      </div>
                    ))}
                  </div>
                </Tarjeta>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {seccion === "arbitrum" ? <SeccionArbitrum datos={arbitrum} /> : null}

      {seccion === "decisiones" ? <SeccionDecisiones /> : null}

      {seccion === "entrega" ? (
        <div className="space-y-5">
          <section>
            <h2 className="etiqueta-seccion mb-2">Limites honestos de esta beta</h2>
            <div className="space-y-2">
              {limites.map((l) => (
                <Tarjeta key={l.tema} className="p-3.5">
                  <h3 className="text-sm font-medium text-texto">{l.tema}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-marca/90">
                    Hoy: {l.queHacemos}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ambar/90">
                    Falta: {l.queFaltaria}
                  </p>
                </Tarjeta>
              ))}
            </div>
          </section>

          <section>
            <h2 className="etiqueta-seccion mb-2">Siguientes pasos</h2>
            <div className="space-y-2">
              {siguientesPasos.map((s) => (
                <Tarjeta key={s.titulo} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-texto">{s.titulo}</h3>
                    <span className="shrink-0 rounded-full bg-superficie-alta px-2 py-0.5 text-[10px] text-tenue">
                      {s.responsable}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-suave">{s.detalle}</p>
                  <p className="mt-1 text-[11px] text-tenue">Desbloquea: {s.bloquea}</p>
                </Tarjeta>
              ))}
            </div>
          </section>

          <section>
            <h2 className="etiqueta-seccion mb-2">Como responde a la rubrica</h2>
            <div className="space-y-2">
              {rubrica.map((c) => (
                <Tarjeta key={c.criterio} className="p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium text-texto">{c.criterio}</h3>
                    <span className="text-sm font-semibold tabular-nums text-marca">{c.peso}%</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {c.evidencia.map((e) => (
                      <li key={e} className="flex gap-2 text-xs leading-relaxed text-suave">
                        <Icono nombre="check" className="mt-0.5 h-3 w-3 shrink-0 text-marca" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </Tarjeta>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

// --- Arbitrum ---------------------------------------------------------------

function SeccionArbitrum({ datos }: { datos: (typeof ARQUITECTURA)["arbitrum"] }) {
  const red = obtenerRed(CONFIG.chainId);
  const costoOne = obtenerRed(42161).costoAnclajeUsd;
  const factor = Math.round(COSTO_ANCLAJE_L1_USD / costoOne);

  return (
    <div className="space-y-5">
      <Tarjeta>
        <p className="text-sm leading-relaxed text-texto">{datos.porQue}</p>
      </Tarjeta>

      <section>
        <h2 className="etiqueta-seccion mb-2">Costo de anclar un reporte</h2>
        <Tarjeta>
          <div className="space-y-3">
            <BarraCosto
              etiqueta="Ethereum L1"
              valor={COSTO_ANCLAJE_L1_USD}
              maximo={COSTO_ANCLAJE_L1_USD}
              color="var(--color-alerta)"
            />
            <BarraCosto
              etiqueta="Arbitrum One"
              valor={costoOne}
              maximo={COSTO_ANCLAJE_L1_USD}
              color="var(--color-marca)"
            />
          </div>
          <p className="mt-3 border-t border-borde pt-3 text-xs leading-relaxed text-suave">
            Unas <span className="font-semibold text-marca">{factor}x</span> mas barato. Con un
            reporte diario por vecino, en L1 el proyecto no existe: el costo de la prueba supera el
            valor de la recompensa. Estimacion pendiente de medirse en el contrato desplegado.
          </p>
        </Tarjeta>
      </section>

      <section>
        <h2 className="etiqueta-seccion mb-2">Donde se usa</h2>
        <div className="space-y-2">
          {datos.usos.map((u) => (
            <Tarjeta key={u.titulo} className="p-3.5">
              <h3 className="text-sm font-medium text-texto">{u.titulo}</h3>
              <p className="mt-1 text-xs leading-relaxed text-suave">{u.detalle}</p>
            </Tarjeta>
          ))}
        </div>
      </section>

      <section>
        <h2 className="etiqueta-seccion mb-2">Redes</h2>
        <Tarjeta className="divide-y divide-borde p-0">
          {datos.redes.map((r) => (
            <div key={r.chainId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-texto">{r.nombre}</p>
                <p className="text-[11px] text-tenue">{r.uso}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-suave">{r.chainId}</p>
                {r.chainId === red.chainId ? (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-marca">
                    activa
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </Tarjeta>
      </section>
    </div>
  );
}

function BarraCosto({
  etiqueta,
  valor,
  maximo,
  color,
}: {
  etiqueta: string;
  valor: number;
  maximo: number;
  color: string;
}) {
  const porcentaje = Math.max(1.5, (valor / maximo) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-suave">{etiqueta}</span>
        <span className="font-mono text-texto">{formatearUsd(valor)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-superficie-alta">
        <div
          className="h-full rounded-full"
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// --- Decisiones -------------------------------------------------------------

function SeccionDecisiones() {
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <Tarjeta>
        <p className="text-xs leading-relaxed text-suave">
          Este proyecto se construye con asistencia de IA. Cada decision no trivial queda registrada
          con sus alternativas descartadas y su costo de revertir, antes de escribir el codigo.{" "}
          <span className="text-texto">{DECISIONES.length} decisiones</span> registradas,{" "}
          <span className="text-ambar">{DECISIONES_PENDIENTES.length} esperan</span> que una persona
          del equipo las apruebe.
        </p>
        <p className="mt-2 font-mono text-[10px] text-tenue">
          src/data/decisiones.json → docs/DECISIONES.md
        </p>
      </Tarjeta>

      {DECISIONES_PENDIENTES.length > 0 ? (
        <section>
          <h2 className="etiqueta-seccion mb-2">Esperan decision humana</h2>
          <div className="space-y-2">
            {DECISIONES_PENDIENTES.map((d) => (
              <div key={d.id} className="rounded-xl border border-ambar/35 bg-ambar/8 p-3.5">
                <p className="text-xs font-semibold text-ambar">
                  {d.id} · {d.titulo}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-texto/90">{d.nota_para_humano}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="etiqueta-seccion mb-2">Bitacora completa</h2>
        <div className="space-y-2">
          {DECISIONES.map((d) => (
            <FichaDecision
              key={d.id}
              decision={d}
              abierta={abierta === d.id}
              onAlternar={() => setAbierta(abierta === d.id ? null : d.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FichaDecision({
  decision,
  abierta,
  onAlternar,
}: {
  decision: Decision;
  abierta: boolean;
  onAlternar: () => void;
}) {
  return (
    <div className="tarjeta overflow-hidden">
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        <span className="mt-0.5 shrink-0 rounded-md bg-superficie-alta px-1.5 py-0.5 font-mono text-[10px] text-tenue">
          {decision.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug text-texto">{decision.titulo}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-tenue">
            <span>{decision.autor}</span>
            <span aria-hidden>·</span>
            <span>revertir: {decision.reversibilidad}</span>
            {decision.requiere_validacion_humana ? (
              <span className="rounded-full bg-ambar/15 px-1.5 py-0.5 font-semibold text-ambar">
                requiere humano
              </span>
            ) : null}
          </span>
        </span>
        <Icono
          nombre="flecha"
          className={`mt-1 h-4 w-4 shrink-0 text-tenue transition ${abierta ? "rotate-90" : ""}`}
        />
      </button>

      {abierta ? (
        <div className="space-y-3 border-t border-borde px-3.5 py-3.5 text-xs leading-relaxed">
          <Bloque titulo="Contexto">{decision.contexto}</Bloque>

          <div>
            <p className="etiqueta-seccion mb-1">Alternativas descartadas</p>
            <ul className="space-y-1.5">
              {decision.opciones.map((o) => (
                <li key={o.nombre} className="text-suave">
                  <span className="text-texto">{o.nombre}</span> — {o.descartada_porque}
                </li>
              ))}
            </ul>
          </div>

          <Bloque titulo="Decision">{decision.decision}</Bloque>

          <div>
            <p className="etiqueta-seccion mb-1">Consecuencias</p>
            <ul className="space-y-1">
              {decision.consecuencias.map((c) => (
                <li key={c} className="flex gap-2 text-suave">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-tenue" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <Bloque titulo="Costo de revertir">{decision.costo_de_revertir}</Bloque>

          <div className="flex flex-wrap gap-1">
            {decision.criterios_rubrica.map((c) => (
              <span
                key={c}
                className="rounded-full bg-superficie-alta px-2 py-0.5 text-[10px] text-tenue"
              >
                {NOMBRE_CRITERIO[c] ?? c}
              </span>
            ))}
          </div>

          <p className="break-all font-mono text-[10px] text-tenue">
            {decision.evidencia.join("  ·  ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="etiqueta-seccion mb-1">{titulo}</p>
      <p className="text-suave">{children}</p>
    </div>
  );
}
