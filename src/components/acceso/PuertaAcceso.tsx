"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";

/**
 * Puerta de acceso (ADR-027). Sustituye a la pantalla de bienvenida de ADR-022.
 *
 * Ya no es un aviso que se descarta: sin sesion no se entra. La app completa vive detras.
 *
 * POR QUE NO SE SIENTE COMO UN POPUP: lo importante no es el estilo sino el ORDEN. Antes la
 * app se renderizaba y la bienvenida aparecia encima medio segundo despues, que es
 * exactamente la sensacion de ventana emergente. Aqui no se pinta nada de la app hasta
 * saber si hay sesion: mientras se resuelve se muestra una espera sobria, y solo entonces
 * se decide entre la puerta y el contenido. El usuario nunca ve la app "por debajo".
 *
 * VALVULA IMPORTANTE: si no hay credenciales de Google configuradas, la puerta deja pasar.
 * Sin eso, un despliegue mal configurado —o cualquiera trabajando en local sin .env—
 * dejaria la aplicacion entera inaccesible y sin forma de diagnosticarlo desde dentro.
 */

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
  { icono: "reportar" as const, texto: "Reportas lo que pasa en tu cuadra en tres toques" },
  { icono: "candado" as const, texto: "La red te ve con un alias: nadie sabe que fuiste tu" },
  { icono: "cadena" as const, texto: "Tu evidencia queda anclada en Arbitrum" },
];

/** Espera sobria mientras se resuelve la sesion. Evita el parpadeo de contenido. */
function Cargando() {
  return (
    <div className="grid min-h-dvh place-items-center bg-fondo" aria-busy="true">
      <span className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-marca/15 text-marca">
        <Icono nombre="escudo" className="h-8 w-8" />
      </span>
      <span className="sr-only">Cargando</span>
    </div>
  );
}

export function PuertaAcceso({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const googleDisponible = useGoogleDisponible();
  const [ocupado, setOcupado] = useState(false);

  if (status === "loading") return <Cargando />;

  // Sesion iniciada, o despliegue sin login configurado: pasa.
  if (status === "authenticated" || !googleDisponible) return <>{children}</>;

  return (
    <div className="min-h-dvh overflow-y-auto bg-fondo">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-6 pt-16 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
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
          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              setOcupado(true);
              void signIn("google", { redirectTo: "/" });
            }}
            className="toque flex w-full items-center justify-center gap-2.5 rounded-xl bg-white text-sm font-semibold text-[#1f1f1f] transition active:scale-[0.99] disabled:opacity-60"
          >
            <LogoGoogle />
            {ocupado ? "Abriendo Google…" : "Continuar con Google"}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-tenue">
            Tu correo no se publica, no se comparte y no toca la cadena. La red solo ve tu alias.
            La cuenta existe para devolverte el mismo alias en otro telefono y para ser la
            identidad que solo se abre con las 2 de 3 firmas de la revelacion selectiva.
          </p>
        </div>
      </div>
    </div>
  );
}
