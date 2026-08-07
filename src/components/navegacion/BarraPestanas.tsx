"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCirculo } from "@/components/proveedores/CirculoProvider";
import { Icono, type NombreIcono } from "@/components/ui/Icono";

/**
 * Barra inferior fija.
 *
 * Seis destinos. "Circulo" solo aparece con sesion de Google iniciada (ADR-102), asi que
 * sin cuenta la barra vuelve a cinco. Verificado que las seis entran en 360 px sin
 * truncarse; "Arquitectura" va abreviada por eso.
 *
 * El boton del centro es el reporte: es la accion que la app existe para hacer,
 * y en una emergencia tiene que estar bajo el pulgar sin buscarla.
 */

interface Pestana {
  href: string;
  etiqueta: string;
  icono: NombreIcono;
  destacada?: boolean;
  /** Nombre completo para lectores de pantalla cuando la etiqueta va abreviada. */
  nombreAccesible?: string;
  /** Solo se muestra con sesion de Google iniciada (ADR-102). */
  requiereSesion?: boolean;
}

const PESTANAS: readonly Pestana[] = [
  { href: "/", etiqueta: "Inicio", icono: "inicio" },
  { href: "/mapa", etiqueta: "Mapa", icono: "mapa" },
  { href: "/reportar", etiqueta: "Reportar", icono: "reportar", destacada: true },
  { href: "/circulo", etiqueta: "Circulo", icono: "circulo", requiereSesion: true },
  { href: "/cuenta", etiqueta: "Cuenta", icono: "cuenta" },
  // Con seis pestanas "Arquitectura" no entra en 360 px; se abrevia solo en la barra.
  {
    href: "/arquitectura",
    etiqueta: "Arquit.",
    icono: "arquitectura",
    nombreAccesible: "Arquitectura",
  },
];

export function BarraPestanas() {
  const ruta = usePathname();
  const { habilitado: circuloHabilitado } = useCirculo();

  // Sin sesion la barra vuelve a cinco pestanas, como en `main`.
  const visibles = PESTANAS.filter((p) => !p.requiereSesion || circuloHabilitado);

  return (
    <nav
      aria-label="Navegacion principal"
      /*
       * Una sola barra con dos formas (ADR-028): abajo y horizontal en movil, lateral y
       * vertical desde `md`. Se resuelve con clases responsivas y no con JavaScript para
       * que no haya diferencia entre lo que se pinta en el servidor y en el cliente.
       */
      className="fixed inset-x-0 bottom-0 z-50 border-t border-borde bg-superficie/95 backdrop-blur safe-abajo md:inset-y-0 md:right-auto md:w-60 md:border-r md:border-t-0 md:pb-0"
    >
      {/* Solo en escritorio: la barra lateral tiene sitio para la marca. */}
      <div className="hidden items-center gap-2 px-5 pb-2 pt-6 md:flex">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-marca/15 text-marca">
          <Icono nombre="escudo" className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-texto">Vecino Seguro</span>
      </div>

      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 md:mx-0 md:max-w-none md:flex-col md:items-stretch md:gap-1 md:px-3 md:pt-2">
        {visibles.map((pestana) => {
          const activa = ruta === pestana.href;

          if (pestana.destacada) {
            return (
              <li key={pestana.href} className="flex flex-1 justify-center md:flex-none">
                <Link
                  href={pestana.href}
                  aria-current={activa ? "page" : undefined}
                  aria-label="Crear reporte"
                  className="toque -mt-5 flex w-full flex-col items-center gap-1 pb-2 md:mt-2 md:mb-1 md:flex-row md:justify-start md:gap-3 md:rounded-xl md:bg-alerta md:px-3 md:pb-0 md:text-white"
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full border-4 border-fondo shadow-lg transition md:h-6 md:w-6 md:border-0 md:bg-transparent md:shadow-none ${
                      activa ? "bg-marca text-fondo" : "bg-alerta text-white"
                    } md:text-white`}
                  >
                    <Icono nombre={pestana.icono} className="h-6 w-6 md:h-5 md:w-5" />
                  </span>
                  <span className="text-[10px] font-semibold text-suave md:text-sm md:text-white">
                    {pestana.etiqueta}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={pestana.href} className="flex flex-1 md:flex-none">
              <Link
                href={pestana.href}
                aria-current={activa ? "page" : undefined}
                aria-label={pestana.nombreAccesible ?? pestana.etiqueta}
                className={`toque flex w-full flex-col items-center justify-center gap-1 py-2.5 transition md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:py-2 ${
                  activa ? "text-marca md:bg-marca/10" : "text-tenue md:hover:bg-superficie-alta"
                }`}
              >
                <Icono nombre={pestana.icono} className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate px-0.5 text-[10px] font-medium leading-none md:px-0 md:text-sm">
                  {/* En escritorio cabe el nombre completo; la abreviatura es cosa del movil. */}
                  <span className="md:hidden">{pestana.etiqueta}</span>
                  <span className="hidden md:inline">
                    {pestana.nombreAccesible ?? pestana.etiqueta}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
