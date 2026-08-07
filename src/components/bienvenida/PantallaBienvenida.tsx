"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/proveedores/AppProvider";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";

/**
 * Pantalla de bienvenida (ADR-022).
 *
 * Aparece UNA sola vez, la primera vez que se abre la app. No es una barrera: el boton
 * "Entrar sin cuenta" sigue siendo la ruta principal, porque el producto promete que se
 * puede reportar sin registro y esa promesa esta en el pitch y en la propia pantalla de
 * Cuenta. Lo que resuelve es que el acceso con Google era invisible: vivia dentro de una
 * pestana y habia que ir a buscarlo.
 *
 * Si no hay credenciales de Google cargadas, la pantalla igual se muestra (sirve de
 * presentacion) y lo dice, en vez de fingir que el login no existe.
 */

const CLAVE_VISTA = "vecino-seguro:bienvenida:v1";

function LogoGoogle() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

const PROMESAS = [
  { icono: "reportar" as const, texto: "Reportas en tres toques, sin registro" },
  { icono: "candado" as const, texto: "Con un alias: nadie sabe que fuiste tu" },
  { icono: "cadena" as const, texto: "Tu evidencia queda anclada en Arbitrum" },
];

export function PantallaBienvenida() {
  const { cuenta } = useApp();
  const googleDisponible = useGoogleDisponible();
  const [visible, setVisible] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Solo despues de montar: localStorage no existe en el servidor y leerlo durante el
  // render romperia la hidratacion de una pagina estatica.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLAVE_VISTA) !== "1") setVisible(true);
    } catch {
      // Modo privado sin almacenamiento: no se insiste con la bienvenida.
    }
  }, []);

  const marcarVista = () => {
    try {
      window.localStorage.setItem(CLAVE_VISTA, "1");
    } catch {
      // sin almacenamiento: reaparecera la proxima vez, no es grave
    }
    setVisible(false);
  };

  // Quien ya entro con Google no necesita que le presenten la app.
  useEffect(() => {
    if (cuenta) marcarVista();
  }, [cuenta]);

  if (!visible) return null;

  // `overflow-y-auto` no es opcional: sin el, en un movil en horizontal el contenido no
  // cabe, y como el desbordamiento de un elemento fixed no genera scroll de documento, el
  // boton "Entrar sin cuenta" queda fuera de la pantalla y la app entera se bloquea en la
  // primera pantalla que ve cualquiera.
  //
  // El padding inferior va calculado en vez de con `safe-abajo` porque esa clase esta
  // fuera de @layer y anulaba el pb-8, dejando el boton pegado al borde.
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-fondo"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between px-6 pt-16 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-marca/15 text-marca">
            <Icono nombre="escudo" className="h-8 w-8" />
          </span>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-texto">Vecino Seguro</h1>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            La red de tu cuadra. Complementa al serenazgo donde no llega o no genera confianza.
          </p>

          <ul className="mt-7 space-y-3.5">
            {PROMESAS.map((p) => (
              <li key={p.texto} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-superficie text-marca">
                  <Icono nombre={p.icono} className="h-4 w-4" />
                </span>
                <span className="text-sm text-texto">{p.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {googleDisponible ? (
            <>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => {
                  setOcupado(true);
                  try {
                    window.localStorage.setItem(CLAVE_VISTA, "1");
                  } catch {
                    // sin almacenamiento
                  }
                  void signIn("google", { redirectTo: "/" });
                }}
                className="toque flex w-full items-center justify-center gap-2.5 rounded-xl bg-white text-sm font-semibold text-[#1f1f1f] transition active:scale-[0.99] disabled:opacity-60"
              >
                <LogoGoogle />
                {ocupado ? "Abriendo Google…" : "Continuar con Google"}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-tenue">
                Entrar solo sirve para recuperar tu alias en otro telefono. No te identifica
                ante la red: tu correo no se publica ni toca la cadena.
              </p>
            </>
          ) : (
            <p className="rounded-xl border border-borde bg-superficie p-3 text-center text-[11px] leading-relaxed text-tenue">
              El acceso con Google todavia no esta configurado en este despliegue. No hace
              falta para nada: la app funciona completa con tu alias.
            </p>
          )}

          <button
            type="button"
            onClick={marcarVista}
            className={`toque w-full rounded-xl text-sm font-semibold transition active:scale-[0.99] ${
              googleDisponible
                ? "border border-borde text-suave"
                : "bg-marca text-fondo"
            }`}
          >
            Entrar sin cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
