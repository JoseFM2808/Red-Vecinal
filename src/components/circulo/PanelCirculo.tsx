"use client";

import { useState } from "react";
import { useApp } from "@/components/proveedores/AppProvider";
import { useCirculo } from "@/components/proveedores/CirculoProvider";
import { Icono } from "@/components/ui/Icono";
import { Aviso, EtiquetaSimulado } from "@/components/ui/primitivos";
import { obtenerCategoria } from "@/lib/categorias";
import {
  RADIOS_DISPONIBLES_M,
  estadoDeContacto,
  reporteMasCercano,
  telefonoParaLlamar,
  type ContactoCirculo,
} from "@/lib/circulo";
import { tiempoRelativo } from "@/lib/formato";

/**
 * Circulo de cuidado (rama Lab_Dai).
 *
 * Un familiar comparte su ubicacion contigo; si ocurre un reporte cerca de EL, te llega
 * el aviso y su telefono esta a un toque. Lo simulado es solo el transporte de la
 * ubicacion — la geometria, los avisos y la deduplicacion son reales y estan testeados.
 */

function BotonLlamar({ telefono, ancho = false }: { telefono: string; ancho?: boolean }) {
  return (
    <a
      href={`tel:${telefonoParaLlamar(telefono)}`}
      className={`toque flex items-center justify-center gap-2 rounded-xl bg-marca px-4 text-sm font-semibold text-fondo transition active:scale-[0.98] ${
        ancho ? "w-full" : ""
      }`}
    >
      <Icono nombre="telefono" className="h-4 w-4" />
      Llamar
    </a>
  );
}

function FichaContacto({ contacto }: { contacto: ContactoCirculo }) {
  const { reportes } = useApp();
  const { alternarCompartir, cambiarRadio, eliminarContacto } = useCirculo();
  const [abierto, setAbierto] = useState(false);

  const ahora = Date.now();
  const estado = estadoDeContacto(contacto, ahora);
  const cercano = estado === "en_linea" ? reporteMasCercano(contacto, reportes, ahora) : null;
  const enRiesgo = cercano !== null && cercano.distanciaM <= contacto.radioAvisoM;

  const textoEstado = {
    en_linea: `Compartiendo · ${tiempoRelativo(contacto.actualizadoEn, ahora)}`,
    sin_senal: "Sin senal desde hace rato",
    sin_compartir: "No esta compartiendo su ubicacion",
  }[estado];

  const colorEstado = {
    en_linea: "text-marca",
    sin_senal: "text-ambar",
    sin_compartir: "text-tenue",
  }[estado];

  return (
    <div className={`tarjeta p-4 ${enRiesgo ? "border-alerta/50" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-superficie-alta text-sm font-semibold text-suave">
          {contacto.nombre.slice(0, 1).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-texto">{contacto.nombre}</p>
          <p className="text-[11px] text-tenue">{contacto.relacion}</p>
          <p className={`mt-1 flex items-center gap-1.5 text-[11px] ${colorEstado}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {textoEstado}
          </p>
        </div>

        <BotonLlamar telefono={contacto.telefono} />
      </div>

      <p className="mt-2.5 font-mono text-xs text-suave">{contacto.telefono}</p>

      {enRiesgo && cercano ? (
        <div className="mt-3 rounded-xl border border-alerta/40 bg-alerta/10 p-3">
          <p className="text-xs font-medium text-texto">
            {obtenerCategoria(cercano.reporte.categoria).nombre} a {cercano.distanciaM} m
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-suave">
            {cercano.reporte.descripcion || "Sin descripcion"} ·{" "}
            {tiempoRelativo(cercano.reporte.creadoEn, ahora)}
          </p>
        </div>
      ) : estado === "en_linea" && cercano ? (
        <p className="mt-2 text-[11px] text-tenue">
          Sin novedades cerca. Lo mas proximo esta a {cercano.distanciaM} m.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="toque mt-2 flex w-full items-center justify-between text-[11px] text-tenue"
      >
        Ajustes del contacto
        <Icono nombre="flecha" className={`h-3.5 w-3.5 transition ${abierto ? "rotate-90" : ""}`} />
      </button>

      {abierto ? (
        <div className="mt-2 space-y-3 border-t border-borde pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-texto">Comparte su ubicacion</p>
              <p className="text-[10px] leading-relaxed text-tenue">
                En la version real lo decide el contacto desde su telefono, no tu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alternarCompartir(contacto.id)}
              role="switch"
              aria-checked={contacto.compartiendo}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                contacto.compartiendo ? "bg-marca" : "bg-superficie-alta"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-fondo transition-all ${
                  contacto.compartiendo ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label htmlFor={`radio-${contacto.id}`} className="block text-xs text-texto">
              Avisarme si hay un reporte a menos de
            </label>
            <select
              id={`radio-${contacto.id}`}
              value={contacto.radioAvisoM}
              onChange={(e) => cambiarRadio(contacto.id, Number(e.target.value))}
              className="toque mt-1 w-full rounded-lg border border-borde bg-superficie-alta px-3 text-sm text-texto focus:border-marca/60 focus:outline-none"
            >
              {RADIOS_DISPONIBLES_M.map((r) => (
                <option key={r} value={r}>
                  {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => eliminarContacto(contacto.id)}
            className="toque w-full rounded-xl border border-alerta/40 text-sm font-medium text-alerta"
          >
            Quitar del circulo
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FormularioContacto() {
  const { agregarContacto } = useCirculo();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [relacion, setRelacion] = useState("");

  const valido = nombre.trim().length > 1 && telefono.trim().length >= 6;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="toque flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-borde bg-superficie text-sm text-suave"
      >
        <Icono nombre="personas" className="h-4 w-4" />
        Agregar a alguien a mi circulo
      </button>
    );
  }

  return (
    <div className="tarjeta space-y-3 p-4">
      <div>
        <label htmlFor="nombre-contacto" className="etiqueta-seccion mb-1 block">
          Nombre
        </label>
        <input
          id="nombre-contacto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.slice(0, 40))}
          placeholder="Rosa (mama)"
          className="toque w-full rounded-lg border border-borde bg-superficie-alta px-3 text-sm text-texto placeholder:text-tenue focus:border-marca/60 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="telefono-contacto" className="etiqueta-seccion mb-1 block">
          Telefono
        </label>
        <input
          id="telefono-contacto"
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value.slice(0, 20))}
          placeholder="+51 987 654 321"
          className="toque w-full rounded-lg border border-borde bg-superficie-alta px-3 text-sm text-texto placeholder:text-tenue focus:border-marca/60 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="relacion-contacto" className="etiqueta-seccion mb-1 block">
          Relacion (opcional)
        </label>
        <input
          id="relacion-contacto"
          value={relacion}
          onChange={(e) => setRelacion(e.target.value.slice(0, 24))}
          placeholder="Madre, hijo, vecina…"
          className="toque w-full rounded-lg border border-borde bg-superficie-alta px-3 text-sm text-texto placeholder:text-tenue focus:border-marca/60 focus:outline-none"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-tenue">
        El telefono se guarda solo en este dispositivo. No viaja en ningun reporte ni sale
        hacia ningun servidor.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!valido}
          onClick={() => {
            agregarContacto({ nombre, telefono, relacion, radioAvisoM: 500 });
            setNombre("");
            setTelefono("");
            setRelacion("");
            setAbierto(false);
          }}
          className="toque flex-1 rounded-xl bg-marca text-sm font-semibold text-fondo disabled:opacity-40"
        >
          Agregar
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="toque flex-1 rounded-xl border border-borde text-sm font-medium text-suave"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function PanelCirculo() {
  const { contactos, avisos, permiso, listo, descartarAviso, solicitarPermiso, reiniciarCirculo } =
    useCirculo();

  return (
    <div className="space-y-6 px-4">
      {avisos.length > 0 ? (
        <section>
          <h2 className="etiqueta-seccion mb-2">Avisos ({avisos.length})</h2>
          <div className="space-y-2">
            {avisos.map((aviso) => (
              <div
                key={aviso.clave}
                className="aparecer rounded-2xl border border-alerta/45 bg-alerta/10 p-4"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-alerta/20 text-alerta">
                    <Icono nombre="campana" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-texto">
                      Reporte cerca de {aviso.contactoNombre}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-suave">
                      {obtenerCategoria(aviso.categoria).nombre} a {aviso.distanciaM} m ·{" "}
                      {aviso.zonaNombre} · {tiempoRelativo(aviso.creadoEn)}
                    </p>
                    {aviso.descripcion ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-tenue">
                        {aviso.descripcion}
                      </p>
                    ) : null}

                    <div className="mt-3 flex gap-2">
                      <BotonLlamar telefono={aviso.contactoTelefono} />
                      <button
                        type="button"
                        onClick={() => descartarAviso(aviso.clave)}
                        className="toque flex-1 rounded-xl border border-borde text-sm font-medium text-suave"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {permiso === "default" ? (
        <button
          type="button"
          onClick={() => void solicitarPermiso()}
          className="toque flex w-full items-center justify-center gap-2 rounded-xl border border-info/40 bg-info/10 text-sm font-medium text-info"
        >
          <Icono nombre="campana" className="h-4 w-4" />
          Activar avisos en el telefono
        </button>
      ) : null}

      {permiso === "denied" ? (
        <Aviso tono="alerta" icono="campana">
          Bloqueaste las notificaciones para este sitio. Los avisos siguen apareciendo aqui
          dentro, pero no llegaran con la app cerrada.
        </Aviso>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="etiqueta-seccion">Mi circulo ({contactos.length})</h2>
          <EtiquetaSimulado titulo="La ubicacion de los contactos se mueve localmente; en la version real llega desde su dispositivo" />
        </div>

        {!listo ? (
          <p className="py-6 text-center text-sm text-tenue">Cargando…</p>
        ) : contactos.length === 0 ? (
          <Aviso tono="info" icono="personas">
            Tu circulo esta vacio. Agrega a alguien y te avisamos si pasa algo cerca de donde
            esta.
          </Aviso>
        ) : (
          <div className="space-y-2">
            {contactos.map((c) => (
              <FichaContacto key={c.id} contacto={c} />
            ))}
          </div>
        )}
      </section>

      <FormularioContacto />

      <section>
        <h2 className="etiqueta-seccion mb-2">Como funciona</h2>
        <ul className="tarjeta space-y-2 p-4">
          {[
            "Alguien de tu circulo comparte su ubicacion contigo. Es su decision, no la tuya.",
            "Si aparece un reporte dentro del radio que elegiste alrededor de esa persona, te avisamos.",
            "El aviso trae su telefono a un toque, porque lo primero que uno hace es llamar.",
            "Los telefonos y las ubicaciones se quedan en tu dispositivo: no hay servidor que los guarde.",
            "Lo unico simulado hoy es el envio de la ubicacion del contacto. Todo lo demas ya es real.",
          ].map((linea) => (
            <li key={linea} className="flex gap-2 text-xs leading-relaxed text-suave">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-marca" />
              {linea}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <button
          type="button"
          onClick={reiniciarCirculo}
          className="toque w-full rounded-xl border border-borde bg-superficie-alta text-sm font-medium text-suave"
        >
          Reiniciar circulo de demostracion
        </button>
      </section>
    </div>
  );
}
