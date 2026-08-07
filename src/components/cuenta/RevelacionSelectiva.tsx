"use client";

import { useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { Aviso, EtiquetaSimulado } from "@/components/ui/primitivos";
import { UMBRAL_REVELACION } from "@/lib/chain/abis";

/**
 * Demostracion del mecanismo de revelacion selectiva (IdentityEscrow.sol).
 *
 * Es una demo conceptual y se dice: no hay integracion con el Poder Judicial ni
 * custodia de claves por un tercero acreditado. Lo que si muestra, y es lo que
 * importa del diseno, es que ninguna de las tres partes puede abrir el vinculo
 * sola — ni siquiera la plataforma — y que toda solicitud deja rastro publico.
 */

interface Guardian {
  id: "usuario" | "plataforma" | "autoridad";
  nombre: string;
  detalle: string;
}

const GUARDIANES: readonly Guardian[] = [
  {
    id: "usuario",
    nombre: "El propio vecino",
    detalle: "Puede autorizar que se revele su identidad, por ejemplo para constituirse en parte.",
  },
  {
    id: "plataforma",
    nombre: "Vecino Seguro",
    detalle: "Verifica que la solicitud llegue por un canal legitimo. No puede abrir el vinculo sola.",
  },
  {
    id: "autoridad",
    nombre: "Autoridad judicial",
    detalle: "Presenta el expediente. Su firma sola tampoco alcanza.",
  },
];

export function RevelacionSelectiva() {
  const [firmas, setFirmas] = useState<Set<string>>(new Set());

  const alternar = (id: string) => {
    setFirmas((previas) => {
      const siguiente = new Set(previas);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  };

  const alcanzado = firmas.size >= UMBRAL_REVELACION.requeridas;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="etiqueta-seccion">Revelacion selectiva</h2>
        <EtiquetaSimulado titulo="Demostracion del mecanismo, sin integracion legal real" />
      </div>

      <div className="tarjeta space-y-3 p-4">
        <p className="text-xs leading-relaxed text-suave">
          Tu identidad real no esta en la cadena ni en nuestros servidores: esta cifrada y solo se
          abre con {UMBRAL_REVELACION.requeridas} de {UMBRAL_REVELACION.totales} firmas. Toca las
          firmas para ver como funciona el umbral.
        </p>

        <ul className="space-y-2">
          {GUARDIANES.map((g) => {
            const firmado = firmas.has(g.id);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => alternar(g.id)}
                  aria-pressed={firmado}
                  className={`toque flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    firmado ? "border-marca/50 bg-marca/8" : "border-borde bg-superficie-alta"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      firmado ? "border-marca bg-marca text-fondo" : "border-tenue text-transparent"
                    }`}
                  >
                    <Icono nombre="check" className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-texto">{g.nombre}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-tenue">
                      {g.detalle}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {alcanzado ? (
          <Aviso tono="alerta" icono="candado">
            Umbral alcanzado ({firmas.size}/{UMBRAL_REVELACION.totales}). El vinculo se descifra
            solo para el expediente indicado, y la solicitud queda registrada en cadena — cualquiera
            puede auditar que se pidio revelar una identidad.
          </Aviso>
        ) : (
          <p className="text-[11px] text-tenue">
            {firmas.size}/{UMBRAL_REVELACION.requeridas} firmas. Con menos del umbral, el vinculo
            sigue cerrado para todos, incluida la plataforma.
          </p>
        )}
      </div>
    </section>
  );
}
