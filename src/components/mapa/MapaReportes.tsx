"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { AccesoRapido } from "@/components/inicio/AccesoRapido";
import { useApp } from "@/components/proveedores/AppProvider";
import { useUbicacion } from "@/components/proveedores/UbicacionProvider";
import { HojaDetalle } from "@/components/reportes/HojaDetalle";
import { TarjetaReporte } from "@/components/reportes/TarjetaReporte";
import { useCirculo } from "@/components/proveedores/CirculoProvider";
import { TarjetaSismo } from "@/components/sismos/ListaSismos";
import { useSismosOficiales } from "@/components/sismos/useSismosOficiales";
import { Icono } from "@/components/ui/Icono";
import { CATEGORIAS } from "@/lib/categorias";
import { estadoDeContacto, reporteMasCercano } from "@/lib/circulo";
import type { ContactoEnMapa } from "./MapaLeaflet";
import type { Coordenada, IdCategoria, Reporte } from "@/lib/tipos";

/**
 * Filtro de fechas del mapa (ADR-043). "Todo" existe porque los reportes anclados no
 * caducan: la evidencia historica es parte del valor.
 */
const RANGOS_FECHA = [
  { id: "24h", etiqueta: "Hoy", ms: 24 * 3_600_000 },
  { id: "7d", etiqueta: "7 dias", ms: 7 * 24 * 3_600_000 },
  { id: "30d", etiqueta: "30 dias", ms: 30 * 24 * 3_600_000 },
  { id: "todo", etiqueta: "Todo", ms: null },
] as const;

type IdRango = (typeof RANGOS_FECHA)[number]["id"];

/**
 * Pantalla de mapa. El componente de Leaflet se carga solo en el navegador:
 * Leaflet toca `window` al importarse y romperia el render en el servidor.
 */
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-superficie text-xs text-tenue">
      Cargando mapa…
    </div>
  ),
});

/** Centro por defecto: Lima. Se mueve en cuanto hay reportes o ubicacion real. */
const CENTRO_LIMA: Coordenada = { lat: -12.05, lng: -77.03 };

export function MapaReportes() {
  const { reportes, cargando } = useApp();
  const { contactos } = useCirculo();
  const [filtro, setFiltro] = useState<IdCategoria | null>(null);
  const [rango, setRango] = useState<IdRango>("todo");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  // Sismos oficiales del IGP (ADR-042): visibles sin cuenta, con su mapa de intensidad.
  const sismos = useSismosOficiales();
  /** Ultimo encuadre que dejo el usuario. Se respeta al cerrar la hoja o cambiar filtro. */
  const [vista, setVista] = useState<{ centro: Coordenada; zoom: number } | null>(null);
  /** Se incrementa en cada toque para poder repetir el vuelo al mismo punto. */
  const [intento, setIntento] = useState(0);
  // La ubicacion viene del proveedor compartido: se mantiene al cambiar de pestana y
  // no depende de estar logueado (ADR-023).
  const { coordenada: posicionUsuario, precisionM, estado: estadoUbicacion, solicitar } =
    useUbicacion();

  const visibles = useMemo(() => {
    const ms = RANGOS_FECHA.find((r) => r.id === rango)?.ms ?? null;
    const desde = ms === null ? null : Date.now() - ms;
    return reportes.filter(
      (r) => (filtro === null || r.categoria === filtro) && (desde === null || r.creadoEn >= desde),
    );
  }, [filtro, rango, reportes]);

  const detalle: Reporte | null = useMemo(
    () => reportes.find((r) => r.id === seleccionado) ?? null,
    [reportes, seleccionado],
  );

  // Contactos que estan compartiendo ubicacion, con su radio de aviso.
  const contactosEnMapa = useMemo<ContactoEnMapa[]>(() => {
    const ahora = Date.now();
    return contactos.flatMap((contacto) => {
      if (estadoDeContacto(contacto, ahora) !== "en_linea" || !contacto.coordenada) return [];
      const cercano = reporteMasCercano(contacto, reportes, ahora);
      return [
        {
          id: contacto.id,
          nombre: contacto.nombre,
          coordenada: contacto.coordenada,
          enRiesgo: cercano !== null && cercano.distanciaM <= contacto.radioAvisoM,
          radioAvisoM: contacto.radioAvisoM,
        },
      ];
    });
  }, [contactos, reportes]);

  const centro = useMemo<Coordenada>(() => {
    if (detalle) return detalle.coordenada;
    if (vista) return vista.centro;
    // Si el filtro deja la lista vacia se cae al primer reporte de la red, no al centro
    // de Lima: saltar a otro distrito al filtrar desorienta.
    const primero = visibles[0] ?? reportes[0];
    return primero ? primero.coordenada : CENTRO_LIMA;
  }, [detalle, reportes, visibles, vista]);

  const zoom = detalle ? 16 : (vista?.zoom ?? 12);

  const ubicarme = () => {
    // Si ya se conoce la posicion, centrar. Si no, pedir el permiso — que exige
    // este gesto del usuario para que el navegador no lo bloquee de entrada.
    setIntento((n) => n + 1);
    if (posicionUsuario) {
      setSeleccionado(null);
      setVista({ centro: posicionUsuario, zoom: 15 });
      return;
    }
    solicitar();
  };

  return (
    <div className="flex flex-col">
      {/*
        `isolate` es importante y no es decorativo: Leaflet usa z-index hasta 1000 en sus
        propios controles y su contenedor NO crea contexto de apilamiento, asi que sin esto
        compiten en el mismo plano que la barra de pestanas (z-50), la hoja de detalle
        (z-60) y la bienvenida (z-100) — cualquiera de ellas podria quedar por debajo del
        mapa. Aislando aqui, todo lo de Leaflet queda encerrado en esta caja.

        `min-h` evita que en horizontal el mapa se quede en ~170 px, donde los chips de
        arriba y los botones de abajo se lo comen entero.
      */}
      <div className="relative isolate h-[46dvh] min-h-[200px] w-full overflow-hidden border-b border-borde md:h-[58dvh]">
        <MapaLeaflet
          reportes={visibles}
          centro={centro}
          zoom={zoom}
          seleccionado={seleccionado}
          posicionUsuario={posicionUsuario}
          contactos={contactosEnMapa}
          precisionUsuarioM={precisionM}
          intento={intento}
          onMover={(c, z) => setVista({ centro: c, zoom: z })}
          onSeleccionar={setSeleccionado}
        />

        {/*
          El envoltorio deja pasar los gestos al mapa; solo la tira de chips los captura.
          Antes el `pointer-events-none` estaba en el propio contenedor con scroll, asi que
          a 320 px los chips median 430 px y no habia forma de arrastrar para alcanzar el
          ultimo: el filtro de sismos era inaccesible.
        */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] flex flex-col gap-1.5 px-3 py-3">
          {/* Fila 2 (ADR-043): el rango de fechas, debajo del tipo de hallazgo. */}
          <div className="sin-barra-scroll pointer-events-auto order-2 flex min-w-0 max-w-full gap-1.5 overflow-x-auto">
            {RANGOS_FECHA.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRango(r.id)}
                aria-pressed={rango === r.id}
                className={`toque flex shrink-0 items-center rounded-full border px-3 text-[11px] font-medium backdrop-blur transition ${
                  rango === r.id
                    ? "border-info/50 bg-info/20 text-info"
                    : "border-borde bg-superficie/90 text-suave"
                }`}
              >
                {r.etiqueta}
              </button>
            ))}
          </div>

          <div className="sin-barra-scroll pointer-events-auto order-1 flex min-w-0 max-w-full gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFiltro(null)}
              className={`toque flex shrink-0 items-center rounded-full border px-3.5 text-xs font-medium backdrop-blur transition ${
                filtro === null
                  ? "border-marca/50 bg-marca/20 text-marca"
                  : "border-borde bg-superficie/90 text-suave"
              }`}
            >
              Todo ({reportes.length})
            </button>
            {CATEGORIAS.map((c) => {
              const total = reportes.filter((r) => r.categoria === c.id).length;
              const activo = filtro === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFiltro(activo ? null : c.id)}
                  className={`toque flex shrink-0 items-center rounded-full border px-3.5 text-xs font-medium backdrop-blur transition ${
                    activo ? "text-fondo" : "border-borde bg-superficie/90 text-suave"
                  }`}
                  style={
                    activo
                      ? { backgroundColor: c.color, borderColor: c.color, color: "#0a0c0f" }
                      : undefined
                  }
                >
                  {c.nombre.split(" ")[0]} ({total})
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={ubicarme}
          disabled={estadoUbicacion === "buscando"}
          aria-label={posicionUsuario ? "Centrar en mi ubicacion" : "Mostrar mi ubicacion"}
          className={`toque absolute bottom-3 right-3 z-[1100] grid place-items-center rounded-full border shadow-lg backdrop-blur transition ${
            posicionUsuario
              ? "border-info/50 bg-info/20 text-info"
              : "border-borde bg-superficie/95 text-suave"
          } ${estadoUbicacion === "buscando" ? "animate-pulse" : ""}`}
        >
          <Icono nombre="ubicacion" className="h-5 w-5" />
        </button>

        {!posicionUsuario && estadoUbicacion !== "no_soportada" ? (
          <button
            type="button"
            onClick={ubicarme}
            className="toque absolute bottom-3 left-3 z-[1100] flex items-center gap-2 rounded-full border border-borde bg-superficie/95 px-3.5 text-xs font-medium text-suave shadow-lg backdrop-blur"
          >
            {estadoUbicacion === "denegada"
              ? "Ubicacion bloqueada"
              : estadoUbicacion === "buscando"
                ? "Buscando…"
                : "Ver mi ubicacion"}
          </button>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="etiqueta-seccion">
            {visibles.length} reporte{visibles.length === 1 ? "" : "s"}
            {rango !== "todo" ? ` · ${RANGOS_FECHA.find((r) => r.id === rango)?.etiqueta}` : ""}
          </h2>
          <div className="flex items-center gap-2">
            {reportes.some((r) => r.esSemilla) ? (
              <span className="text-[10px] text-tenue">Incluye datos sembrados de demo</span>
            ) : null}
            {/* Mirar el mapa no pide cuenta (ADR-043); entrar queda a un toque. */}
            <AccesoRapido />
          </div>
        </div>

        {cargando ? (
          <p className="py-8 text-center text-sm text-tenue">Cargando la red…</p>
        ) : visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-tenue">
            No hay reportes de esta categoria todavia.
          </p>
        ) : (
          visibles.map((reporte) => (
            <TarjetaReporte
              key={reporte.id}
              reporte={reporte}
              activo={reporte.id === seleccionado}
              onClick={() => setSeleccionado(reporte.id)}
            />
          ))
        )}
      </div>

      {/* --- Sismos oficiales (ADR-042) ------------------------------------ */}
      <section className="space-y-2 px-4 pb-4">
        <div className="flex items-baseline justify-between">
          <h2 className="etiqueta-seccion">Sismos recientes · IGP</h2>
          {sismos.degradado ? (
            <span className="text-[10px] text-ambar">Fuente sin responder ahora</span>
          ) : null}
        </div>

        {sismos.cargando ? (
          <p className="py-4 text-center text-sm text-tenue">Consultando al IGP…</p>
        ) : sismos.sismos.length === 0 ? (
          <p className="py-4 text-center text-sm text-tenue">
            {sismos.degradado
              ? "El IGP no responde en este momento. Se reintenta solo."
              : "Sin sismos registrados recientemente."}
          </p>
        ) : (
          sismos.sismos.slice(0, 3).map((entrada) => (
            <TarjetaSismo
              key={entrada.sismo.id}
              entrada={entrada}
              mapa={sismos.mapaDe(entrada.sismo.id)}
              onResponder={(intensidad) => sismos.responder(entrada.sismo.id, intensidad)}
            />
          ))
        )}
      </section>

      {detalle ? <HojaDetalle reporte={detalle} onCerrar={() => setSeleccionado(null)} /> : null}
    </div>
  );
}
