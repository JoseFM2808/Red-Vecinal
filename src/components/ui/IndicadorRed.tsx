"use client";

import { obtenerAdaptadorDeCadena } from "@/lib/chain";

/**
 * Chip que dice en que red esta corriendo la app y si el anclaje es real.
 * Vive en la cabecera porque es la primera pregunta del jurado.
 */
export function IndicadorRed() {
  const cadena = obtenerAdaptadorDeCadena();

  return (
    <span
      title={cadena.explicacion}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        cadena.simulado
          ? "border-ambar/40 bg-ambar/10 text-ambar"
          : "border-marca/40 bg-marca/10 text-marca"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cadena.red.nombreCorto}
      {cadena.simulado ? " · simulado" : ""}
    </span>
  );
}
