"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useCirculo } from "@/components/proveedores/CirculoProvider";
import { Icono } from "@/components/ui/Icono";
import { Aviso } from "@/components/ui/primitivos";
import {
  DURACIONES_COMPARTIR,
  decodificarInvitacion,
  restanteLegible,
  vigenciaDe,
  type InvitacionCirculo,
} from "@/lib/circulo-vinculos";

/**
 * Vincular el circulo (ADR-046): el modelo de WhatsApp.
 *
 * Dos gestos y una lista:
 *  - "Mostrar mi codigo": generas QR + enlace. Quien lo acepte te comparte SU ubicacion.
 *  - "Leer un codigo": camara (BarcodeDetector) o pegar el enlace. Al aceptar eliges por
 *    cuanto tiempo compartes TU ubicacion — y puedes cortar cuando quieras desde la
 *    lista "Compartes tu ubicacion", sin esperar el plazo.
 *
 * El enlace lleva la invitacion en el fragmento (#): nunca llega al servidor. Si alguien
 * abre el enlace en el telefono, /circulo lo detecta al montar y abre el consentimiento.
 */

/** BarcodeDetector existe en Chrome/Android — el resto pega el enlace. */
interface DetectorQR {
  detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

function crearDetector(): DetectorQR | null {
  const w = window as unknown as {
    BarcodeDetector?: new (opciones: { formats: string[] }) => DetectorQR;
  };
  if (!w.BarcodeDetector) return null;
  try {
    return new w.BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

/* --- Mostrar mi codigo --------------------------------------------------------------- */

function MostrarCodigo({ onCerrar }: { onCerrar: () => void }) {
  const { crearInvitacion } = useCirculo();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enlace, setEnlace] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const generar = async () => {
    if (nombre.trim() === "" || ocupado) return;
    setOcupado(true);
    try {
      const { enlace: nuevoEnlace } = await crearInvitacion({
        nombre,
        telefono,
        relacion: "",
        radioAvisoM: 0,
      });
      setEnlace(nuevoEnlace);
      setQr(
        await QRCode.toDataURL(nuevoEnlace, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 480,
          color: { dark: "#0a0c0f", light: "#ffffff" },
        }),
      );
    } finally {
      setOcupado(false);
    }
  };

  const compartir = async () => {
    if (!enlace) return;
    // navigator.share abre la hoja nativa (WhatsApp incluido); si no existe, se copia.
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vecino Seguro — circulo de cuidado",
          text: "Comparteme tu ubicacion en Vecino Seguro. Tu eliges por cuanto tiempo y puedes cortarla cuando quieras:",
          url: enlace,
        });
        return;
      } catch {
        // Cancelado o sin soporte: cae a copiar.
      }
    }
    await navigator.clipboard.writeText(enlace);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="tarjeta space-y-3 p-4">
      {!enlace ? (
        <>
          <p className="text-sm font-medium text-texto">¿A quien quieres cuidar?</p>
          <p className="text-xs leading-relaxed text-suave">
            Genera un codigo y muestraselo (o mandale el enlace). Cuando lo acepte, esa
            persona decide por cuanto tiempo te comparte su ubicacion.
          </p>
          <label className="block">
            <span className="text-xs text-texto">Nombre (solo lo ves tu)</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Rosa (mama)"
              className="toque mt-1 w-full rounded-lg border border-borde bg-superficie-alta px-3 text-sm text-texto placeholder:text-tenue focus:border-marca/60 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-texto">Telefono (opcional, para llamarla a un toque)</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+51 987 654 321"
              inputMode="tel"
              className="toque mt-1 w-full rounded-lg border border-borde bg-superficie-alta px-3 text-sm text-texto placeholder:text-tenue focus:border-marca/60 focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="toque flex-1 rounded-xl border border-borde text-sm font-medium text-suave"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={nombre.trim() === "" || ocupado}
              onClick={() => void generar()}
              className="toque flex-1 rounded-xl bg-marca text-sm font-semibold text-fondo disabled:opacity-50"
            >
              {ocupado ? "Generando…" : "Generar codigo"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-texto">
            Muestrale este codigo a {nombre.trim()}
          </p>
          {qr ? (
            <img
              src={qr}
              alt={`Codigo QR del vinculo para ${nombre.trim()}`}
              className="mx-auto w-56 rounded-xl bg-white p-2"
            />
          ) : null}
          <p className="text-center text-[11px] leading-relaxed text-tenue">
            La clave del cifrado viaja dentro del codigo, nunca por nuestro servidor.
            Quien lo escanee elige por cuanto tiempo comparte — y puede cortar cuando quiera.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void compartir()}
              className="toque flex flex-1 items-center justify-center gap-2 rounded-xl bg-marca text-sm font-semibold text-fondo"
            >
              <Icono nombre="enlace" className="h-4 w-4" />
              {copiado ? "Enlace copiado" : "Enviar enlace"}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="toque flex-1 rounded-xl border border-borde text-sm font-medium text-suave"
            >
              Listo
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* --- Leer un codigo -------------------------------------------------------------------- */

function LeerCodigo({
  onInvitacion,
  onCerrar,
}: {
  onInvitacion: (invitacion: InvitacionCirculo) => void;
  onCerrar: () => void;
}) {
  const [pegado, setPegado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pararRef = useRef<() => void>(() => {});

  const procesar = useCallback(
    (texto: string) => {
      const invitacion = decodificarInvitacion(texto);
      if (!invitacion) {
        setError("Ese codigo no es una invitacion valida de Vecino Seguro.");
        return false;
      }
      onInvitacion(invitacion);
      return true;
    },
    [onInvitacion],
  );

  const escanear = async () => {
    const detector = crearDetector();
    if (!detector) {
      setError("Este navegador no puede escanear. Pega el enlace de abajo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setEscaneando(true);

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      let activo = true;
      pararRef.current = () => {
        activo = false;
        for (const pista of stream.getTracks()) pista.stop();
        setEscaneando(false);
      };

      const ciclo = async () => {
        while (activo) {
          try {
            const codigos = await detector.detect(video);
            const valor = codigos[0]?.rawValue;
            if (valor && procesar(valor)) {
              pararRef.current();
              return;
            }
          } catch {
            // Un frame ilegible no corta el ciclo.
          }
          await new Promise((r) => setTimeout(r, 350));
        }
      };
      void ciclo();
    } catch {
      setError("No se pudo abrir la camara. Pega el enlace de abajo.");
      setEscaneando(false);
    }
  };

  useEffect(() => () => pararRef.current(), []);

  return (
    <div className="tarjeta space-y-3 p-4">
      <p className="text-sm font-medium text-texto">Leer el codigo de alguien</p>

      {escaneando ? (
        <video ref={videoRef} className="w-full rounded-xl" muted playsInline />
      ) : (
        <button
          type="button"
          onClick={() => void escanear()}
          className="toque flex w-full items-center justify-center gap-2 rounded-xl bg-marca text-sm font-semibold text-fondo"
        >
          <Icono nombre="camara" className="h-4 w-4" />
          Escanear QR
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-borde" />
        <span className="text-[10px] uppercase tracking-wide text-tenue">o pega el enlace</span>
        <span className="h-px flex-1 bg-borde" />
      </div>

      <div className="flex gap-2">
        <input
          value={pegado}
          onChange={(e) => {
            setPegado(e.target.value);
            setError(null);
          }}
          placeholder="https://…/circulo#v=…"
          className="toque min-w-0 flex-1 rounded-lg border border-borde bg-superficie-alta px-3 font-mono text-xs text-texto placeholder:text-tenue focus:border-marca/60 focus:outline-none"
        />
        <button
          type="button"
          disabled={pegado.trim() === ""}
          onClick={() => procesar(pegado)}
          className="toque shrink-0 rounded-xl border border-marca/40 bg-marca/10 px-4 text-sm font-semibold text-marca disabled:opacity-50"
        >
          Usar
        </button>
      </div>

      {error ? (
        <Aviso tono="alerta" icono="alerta">
          {error}
        </Aviso>
      ) : null}

      <button
        type="button"
        onClick={() => {
          pararRef.current();
          onCerrar();
        }}
        className="toque w-full rounded-xl border border-borde text-sm font-medium text-suave"
      >
        Cancelar
      </button>
    </div>
  );
}

/* --- Consentimiento: la decision es de quien comparte ---------------------------------- */

function Consentimiento({
  invitacion,
  onCerrar,
}: {
  invitacion: InvitacionCirculo;
  onCerrar: () => void;
}) {
  const { aceptarInvitacion } = useCirculo();
  const [duracion, setDuracion] = useState("1h");

  return (
    <div className="tarjeta space-y-3 border-marca/30 p-4">
      <p className="text-sm font-medium text-texto">
        <span className="font-mono text-marca">{invitacion.alias}</span> quiere ver tu ubicacion
      </p>
      <p className="text-xs leading-relaxed text-suave">
        Si aceptas, tu posicion viajara cifrada y solo esa persona podra abrirla. Tu eliges
        por cuanto tiempo, y puedes cortar cuando quieras con &ldquo;Dejar de
        compartir&rdquo; — sin avisar ni esperar el plazo.
      </p>

      <fieldset>
        <legend className="text-xs text-texto">¿Por cuanto tiempo?</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {DURACIONES_COMPARTIR.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDuracion(d.id)}
              aria-pressed={duracion === d.id}
              className={`toque rounded-lg border px-3 py-2 text-xs font-medium transition ${
                duracion === d.id
                  ? "border-marca bg-marca/15 text-marca"
                  : "border-borde bg-superficie-alta text-suave"
              }`}
            >
              {d.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCerrar}
          className="toque flex-1 rounded-xl border border-borde text-sm font-medium text-suave"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={() => {
            aceptarInvitacion(invitacion, duracion);
            onCerrar();
          }}
          className="toque flex-1 rounded-xl bg-marca text-sm font-semibold text-fondo"
        >
          Compartir mi ubicacion
        </button>
      </div>
    </div>
  );
}

/* --- Seccion completa -------------------------------------------------------------------- */

type Vista = "cerrado" | "mostrar" | "leer";

export function VincularCirculo() {
  const { otorgamientos, revocarOtorgamiento } = useCirculo();
  const [vista, setVista] = useState<Vista>("cerrado");
  const [pendiente, setPendiente] = useState<InvitacionCirculo | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  // Si la persona llego con un enlace de invitacion (#v=...), se abre el consentimiento
  // directo: es el gesto de "el otro lo lee" hecho por WhatsApp en vez de camara.
  useEffect(() => {
    const invitacion = decodificarInvitacion(window.location.hash);
    if (!invitacion) return;
    setPendiente(invitacion);
    // Se limpia el fragmento para que recargar no re-abra el consentimiento.
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // El "caduca en X min" de la lista se refresca solo.
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const activos = otorgamientos.filter((o) => vigenciaDe(o, ahora) === "activo");

  return (
    <section className="space-y-2">
      <h2 className="etiqueta-seccion">Vincular por QR o enlace</h2>

      {pendiente ? <Consentimiento invitacion={pendiente} onCerrar={() => setPendiente(null)} /> : null}

      {vista === "cerrado" && !pendiente ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVista("mostrar")}
            className="toque flex flex-1 items-center justify-center gap-2 rounded-xl border border-marca/40 bg-marca/10 text-sm font-semibold text-marca"
          >
            <Icono nombre="personas" className="h-4 w-4" />
            Mostrar mi codigo
          </button>
          <button
            type="button"
            onClick={() => setVista("leer")}
            className="toque flex flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie text-sm font-semibold text-texto"
          >
            <Icono nombre="camara" className="h-4 w-4" />
            Leer un codigo
          </button>
        </div>
      ) : null}

      {vista === "mostrar" ? <MostrarCodigo onCerrar={() => setVista("cerrado")} /> : null}
      {vista === "leer" ? (
        <LeerCodigo
          onInvitacion={(invitacion) => {
            setPendiente(invitacion);
            setVista("cerrado");
          }}
          onCerrar={() => setVista("cerrado")}
        />
      ) : null}

      {activos.length > 0 ? (
        <div className="tarjeta divide-y divide-borde p-0">
          <p className="px-4 pt-3 text-xs font-medium text-texto">Compartes tu ubicacion con</p>
          {activos.map((o) => (
            <div key={o.vinculoId} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-marca/15 text-marca">
                <Icono nombre="ubicacion" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-texto">{o.aliasObservador}</p>
                <p className="text-[11px] text-tenue">{restanteLegible(o.expiraEn, ahora)}</p>
              </div>
              <button
                type="button"
                onClick={() => revocarOtorgamiento(o.vinculoId)}
                className="toque shrink-0 rounded-xl border border-alerta/40 px-3 text-xs font-semibold text-alerta"
              >
                Dejar de compartir
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
