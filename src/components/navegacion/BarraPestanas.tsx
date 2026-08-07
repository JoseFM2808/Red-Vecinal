"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/ui/Icono";

/**
 * Barra inferior fija.
 *
 * En `main` son cinco destinos. Esta rama (Lab_Dai) agrega "Circulo" como sexto para
 * poder probar la funcionalidad de cuidado familiar — es la excepcion al limite de
 * CLAUDE.md y esta anotada en ADR-101. Si el experimento no prospera, se quita la
 * entrada y la barra vuelve a cinco.
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
}

const PESTANAS: readonly Pestana[] = [
  { href: "/", etiqueta: "Inicio", icono: "inicio" },
  { href: "/mapa", etiqueta: "Mapa", icono: "mapa" },
  { href: "/reportar", etiqueta: "Reportar", icono: "reportar", destacada: true },
  { href: "/circulo", etiqueta: "Circulo", icono: "circulo" },
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

  return (
    <nav
      aria-label="Navegacion principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-borde bg-superficie/95 backdrop-blur safe-abajo"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {PESTANAS.map((pestana) => {
          const activa = ruta === pestana.href;

          if (pestana.destacada) {
            return (
              <li key={pestana.href} className="flex flex-1 justify-center">
                <Link
                  href={pestana.href}
                  aria-current={activa ? "page" : undefined}
                  aria-label="Crear reporte"
                  className="toque -mt-5 flex w-full flex-col items-center gap-1 pb-2"
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full border-4 border-fondo shadow-lg transition ${
                      activa ? "bg-marca text-fondo" : "bg-alerta text-white"
                    }`}
                  >
                    <Icono nombre={pestana.icono} className="h-6 w-6" />
                  </span>
                  <span className="text-[10px] font-semibold text-suave">{pestana.etiqueta}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={pestana.href} className="flex flex-1">
              <Link
                href={pestana.href}
                aria-current={activa ? "page" : undefined}
                aria-label={pestana.nombreAccesible ?? pestana.etiqueta}
                className={`toque flex w-full flex-col items-center justify-center gap-1 py-2.5 transition ${
                  activa ? "text-marca" : "text-tenue"
                }`}
              >
                <Icono nombre={pestana.icono} className="h-5 w-5" />
                <span className="max-w-full truncate px-0.5 text-[10px] font-medium leading-none">
                  {pestana.etiqueta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
