"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useApp } from "@/components/proveedores/AppProvider";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";
import { EtiquetaSimulado, Tarjeta } from "@/components/ui/primitivos";
import { obtenerCategoria } from "@/lib/categorias";
import { tiempoRelativo } from "@/lib/formato";

/**
 * Vista de eventos abierta: se ve sin cuenta y sin pagar (ADR-039).
 *
 * Por que existe: el modelo de negocio de docs/PROYECTO.md dice que "el vecino nunca paga"
 * y que lo que se cobra son los mapas de riesgo agregados para aseguradoras, juntas y
 * gobiernos. Esta es la version publica y recortada de ese mismo mapa — lo bastante para
 * que alguien que llega en frio entienda el valor de un vistazo, y lo bastante recortada
 * para que siga habiendo producto que vender.
 *
 * Ensena el agregado por zona (cuanto pasa y donde), nunca el detalle sensible: sin
 * descripciones completas, sin coordenadas, sin autor. Eso ya exige cuenta.
 *
 * Honestidad sobre el dato: mientras no haya contrato desplegado, lo que se ve son los
 * reportes de este dispositivo mas los sembrados de demo. Se dice aqui, no en el pitch.
 */

const VENTANA_MS = 24 * 3_600_000;
const MAX_ZONAS = 4;
const MAX_EVENTOS = 5;

export function VistaEventosPublica() {
  const { reportes, cargando, cuenta } = useApp();
  const googleDisponible = useGoogleDisponible();

  const ahora = Date.now();
  const recientes = reportes.filter((r) => ahora - r.creadoEn < VENTANA_MS);

  // Agregado por zona: es exactamente la forma del producto que se cobra, en pequeno.
  const porZona = [...
    recientes.reduce((mapa, r) => {
      mapa.set(r.zonaNombre, (mapa.get(r.zonaNombre) ?? 0) + 1);
      return mapa;
    }, new Map<string, number>()),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ZONAS);

  const maximo = porZona[0]?.[1] ?? 1;
  const corroborados = recientes.filter((r) => r.corroboraciones.length > 0).length;
  const ultimos = reportes.slice(0, MAX_EVENTOS);

  return (
    <div className="space-y-2">
      <Tarjeta className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-texto">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marca opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-marca" />
              </span>
              Lo que esta pasando en Lima ahora
            </p>
            <p className="mt-1 text-xs leading-relaxed text-suave">
              Ultimas 24 horas, agregado por zona. Abierto: no hace falta cuenta ni pagar.
            </p>
          </div>
          <EtiquetaSimulado titulo="Reportes de este dispositivo mas los datos sembrados de demostracion. El indice compartido entre telefonos necesita el contrato desplegado." />
        </div>

        {/* --- Cifras -------------------------------------------------------- */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { valor: recientes.length, etiqueta: "reportes hoy" },
            { valor: porZona.length, etiqueta: "zonas activas" },
            { valor: corroborados, etiqueta: "corroborados" },
          ].map((m) => (
            <div key={m.etiqueta} className="rounded-xl bg-superficie-alta px-2 py-3 text-center">
              <p className="text-2xl font-semibold tabular-nums text-texto">
                {cargando ? "—" : m.valor}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-tenue">{m.etiqueta}</p>
            </div>
          ))}
        </div>

        {/* --- Mapa de calor por zona, en texto ------------------------------ */}
        {porZona.length > 0 ? (
          <div className="mt-4">
            <p className="etiqueta-seccion mb-2">Zonas con mas actividad</p>
            <ul className="space-y-1.5">
              {porZona.map(([zona, cuantos]) => (
                <li key={zona} className="flex items-center gap-2.5">
                  <span className="w-28 shrink-0 truncate text-xs text-suave" title={zona}>
                    {zona}
                  </span>
                  <span
                    className="h-2 rounded-full bg-marca/70"
                    style={{ width: `${Math.max(8, (cuantos / maximo) * 100)}%` }}
                    aria-hidden
                  />
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-tenue">
                    {cuantos}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* --- Ultimos eventos ----------------------------------------------- */}
        {ultimos.length > 0 ? (
          <div className="mt-4">
            <p className="etiqueta-seccion mb-2">Ultimos avisos</p>
            <ul className="divide-y divide-borde rounded-xl border border-borde">
              {ultimos.map((r) => {
                const categoria = obtenerCategoria(r.categoria);
                return (
                  <li key={r.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-superficie-alta text-suave">
                      <Icono nombre="alerta" className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-texto">
                        {categoria.nombre}
                      </span>
                      <span className="block truncate text-[11px] text-tenue">
                        {r.zonaNombre} · {tiempoRelativo(r.creadoEn, ahora)}
                      </span>
                    </span>
                    {r.corroboraciones.length > 0 ? (
                      <span className="shrink-0 rounded-full bg-marca/10 px-2 py-0.5 text-[10px] font-semibold text-marca">
                        {r.corroboraciones.length} confirman
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-tenue">
              Sin cuenta ves que paso y donde. El detalle, la ubicacion exacta en el mapa y
              quien lo confirmo no se muestran: eso es del vecindario.
            </p>
          </div>
        ) : null}
      </Tarjeta>

      {/* --- La conversion -------------------------------------------------- */}
      <Tarjeta className="border-marca/30 bg-marca/5 p-4">
        {cuenta ? (
          <>
            <p className="text-sm font-semibold text-texto">Ya estas dentro</p>
            <p className="mt-1 text-xs leading-relaxed text-suave">
              Puedes reportar, corroborar lo de otros y armar tu circulo de cuidado.
            </p>
            <Link
              href="/reportar"
              className="toque mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-alerta px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99]"
            >
              <Icono nombre="reportar" className="h-4 w-4" />
              Reportar algo ahora
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-texto">
              Mirar es gratis. Participar tambien.
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {[
                "Reportar lo que ves, con tu alias y sin dar tu nombre",
                "Confirmar el aviso de un vecino y ganar recompensa",
                "Avisar a tu familia cuando pasa algo cerca de ellos",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Icono nombre="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marca" />
                  <span className="text-xs leading-relaxed text-suave">{t}</span>
                </li>
              ))}
            </ul>

            {googleDisponible ? (
              <button
                type="button"
                onClick={() => void signIn("google", { redirectTo: "/reportar" })}
                className="toque mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-marca px-4 py-3 text-sm font-semibold text-fondo transition active:scale-[0.99]"
              >
                <Icono nombre="cuenta" className="h-4 w-4" />
                Entrar con Google
              </button>
            ) : (
              <Link
                href="/reportar"
                className="toque mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-marca px-4 py-3 text-sm font-semibold text-fondo transition active:scale-[0.99]"
              >
                <Icono nombre="reportar" className="h-4 w-4" />
                Empezar a reportar
              </Link>
            )}

            <p className="mt-2 text-[11px] leading-relaxed text-tenue">
              El vecino nunca paga. Entrar con Google solo sirve para recuperar tu mismo alias
              en otro telefono — la red te sigue viendo como <code>vecino-1234</code>.
            </p>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
