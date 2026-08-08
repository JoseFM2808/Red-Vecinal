import Link from "next/link";
import { AccesoRapido } from "@/components/inicio/AccesoRapido";
import { PortalMapa } from "@/components/inicio/PortalMapa";
import { ResumenRed } from "@/components/inicio/ResumenRed";
import { AlarmaSismo } from "@/components/sismos/AlarmaSismo";
import { Icono } from "@/components/ui/Icono";
import { IndicadorRed } from "@/components/ui/IndicadorRed";
import { TarjetaUbicacion } from "@/components/ubicacion/TarjetaUbicacion";
import { Tarjeta, TituloSeccion } from "@/components/ui/primitivos";
import { ARQUITECTURA } from "@/lib/arquitectura";

/**
 * Inicio: para que existe la app, en que estado esta la red y como reportar.
 *
 * Las cifras del problema salen de src/data/arquitectura.json — las mismas que
 * el pitch, con su fuente al lado. Si la fuente cambia, cambia en un solo sitio.
 */

const COMO_FUNCIONA = [
  {
    icono: "reportar" as const,
    titulo: "Reportas en tres toques",
    detalle: "Categoria, foto opcional y ubicacion automatica. Sin registro, sin datos personales.",
  },
  {
    icono: "cadena" as const,
    titulo: "Queda como prueba",
    detalle:
      "El hash del reporte se ancla en Arbitrum. Fecha cierta que ninguna institucion puede editar.",
  },
  {
    icono: "personas" as const,
    titulo: "La cuadra se entera",
    detalle: "Y si hace falta, escalas a serenazgo, policia o ambulancia con un boton aparte.",
  },
];

export default function PaginaInicio() {
  const { problema, meta } = ARQUITECTURA;

  return (
    <div className="space-y-6">
      <header className="px-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca/15 text-marca">
              <Icono nombre="escudo" className="h-5 w-5" />
            </span>
            <h1 className="text-base font-semibold tracking-tight">Vecino Seguro</h1>
          </div>
          {/* Entrada permanente al acceso: la bienvenida solo sale una vez (ADR-026). */}
          <AccesoRapido />
        </div>
        <div className="mt-2 flex justify-end">
          <IndicadorRed />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-suave">{problema.tesis}</p>
      </header>

      {/* Alarma desde el IGP (ADR-042): solo aparece si hay un sismo reciente y cercano. */}
      <section className="px-4 empty:hidden">
        <AlarmaSismo />
      </section>

      {/* La pieza central de la portada: el mapa en vivo, a un toque (ADR-043). */}
      <section className="px-4">
        <PortalMapa />
      </section>

      <section className="px-4">
        <TarjetaUbicacion />
      </section>

      <section className="px-4">
        <ResumenRed />
      </section>

      <section className="px-4">
        <TituloSeccion>Como funciona</TituloSeccion>
        <div className="space-y-2">
          {COMO_FUNCIONA.map((paso, i) => (
            <div key={paso.titulo} className="tarjeta flex gap-3 p-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-superficie-alta text-marca">
                <Icono nombre={paso.icono} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-texto">
                  <span className="mr-1.5 text-tenue tabular-nums">{i + 1}.</span>
                  {paso.titulo}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-suave">{paso.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4">
        <TituloSeccion>Por que existe</TituloSeccion>
        <div className="space-y-2">
          {problema.evidencia.map((e) => (
            <Tarjeta key={e.dato} className="p-3.5">
              <p className="text-sm font-medium leading-snug text-texto">{e.dato}</p>
              <p className="mt-1 text-xs leading-relaxed text-suave">{e.detalle}</p>
              <p className="mt-2 text-[11px] text-tenue">Fuente: {e.fuente}</p>
            </Tarjeta>
          ))}
        </div>
      </section>

      <section className="px-4">
        <TituloSeccion>Para quien</TituloSeccion>
        <Tarjeta className="divide-y divide-borde p-0">
          {problema.usuarios.map((u) => (
            <div key={u.perfil} className="px-4 py-3">
              <p className="text-sm font-medium text-texto">{u.perfil}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-suave">{u.necesidad}</p>
            </div>
          ))}
        </Tarjeta>
      </section>

      <section className="space-y-2 px-4">
        {/* La landing (ADR-037) es la URL que se comparte fuera; desde dentro es un destino mas. */}
        <Link
          href="/landing"
          className="tarjeta flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-alta text-marca">
            <Icono nombre="escudo" className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-texto">Que es Vecino Seguro</span>
            <span className="block text-xs text-tenue">
              El problema, por que en Arbitrum y que funciona de verdad · 2 min
            </span>
          </span>
          <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-tenue" />
        </Link>

        <Link
          href="/arquitectura"
          className="tarjeta flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-alta text-info">
            <Icono nombre="arquitectura" className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-texto">Como esta construido</span>
            <span className="block text-xs text-tenue">
              Capas, contratos, decisiones y limites de esta beta
            </span>
          </span>
          <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-tenue" />
        </Link>
      </section>

      <p className="px-4 pb-2 text-center text-[11px] text-tenue">
        {meta.nombre} {meta.version} · Hackathon Ethereum Lima 2026
      </p>
    </div>
  );
}
