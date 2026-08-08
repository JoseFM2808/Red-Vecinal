"use client";

import { signIn, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";
import { rutaRequiereSesion } from "@/lib/acceso";

/**
 * Puerta de acceso — selectiva por ruta (ADR-035, amend de ADR-027).
 *
 * Navegar la app (Inicio, Mapa, Arquitectura, Cuenta) es libre: no espera sesion ni la exige.
 * Solo las rutas de `src/lib/acceso.ts` (reportar, circulo) la piden, porque son las dos
 * acciones que necesitan una identidad real detras: la prueba de que existe alguien a quien
 * pedirle revelacion bajo orden judicial cuando reporta, y los contactos guardados del
 * circulo (ADR-102).
 *
 * POR QUE NO SE SIENTE COMO UN POPUP en las rutas que si la piden: no se pinta nada de esa
 * ruta hasta saber si hay sesion — mientras se resuelve se muestra una espera sobria, y solo
 * entonces se decide entre la tarjeta de acceso y el contenido.
 *
 * VALVULA IMPORTANTE: si no hay credenciales de Google configuradas, la puerta deja pasar en
 * cualquier ruta. Sin eso, un despliegue mal configurado —o cualquiera trabajando en local sin
 * .env— dejaria reportar inaccesible y sin forma de diagnosticarlo desde dentro.
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

/** Copy puntual segun la ruta que la pidio — ya no es una bienvenida general (ADR-035). */
const COPY_POR_RUTA: Record<string, { titulo: string; bajada: string }> = {
  "/reportar": {
    titulo: "Para reportar hace falta una cuenta",
    bajada:
      "Entrar no te identifica ante la red: tu alias sigue siendo lo unico que ven los demas. La cuenta existe para que exista una identidad real detras de la revelacion selectiva, si algun dia hace falta.",
  },
  "/circulo": {
    titulo: "El circulo de cuidado pide una cuenta",
    bajada:
      "Los contactos que guardas ahi quedan atados a tu cuenta, no a este telefono, para poder recuperarlos o revocarlos si cambias de dispositivo.",
  },
};
const COPY_POR_DEFECTO = {
  titulo: "Esta seccion pide una cuenta",
  bajada: "Entrar no te identifica ante la red: tu alias sigue siendo lo unico que ven los demas.",
};

/**
 * NextAuth vuelve a la raiz con ?error=CODIGO cuando el login falla. La puerta tiene que
 * leerlo: si no, la persona vuelve a ver la misma pantalla sin ninguna pista de que paso
 * y lo unico que puede hacer es volver a intentar a ciegas.
 */
function mensajeDeError(codigo: string): string {
  switch (codigo) {
    case "Configuration":
      return "El acceso con Google no esta bien configurado en este despliegue. Avisa al equipo: sin eso no se puede entrar.";
    case "AccessDenied":
      return "Google no autorizo el acceso. Si cancelaste sin querer, puedes intentarlo otra vez.";
    case "OAuthAccountNotLinked":
      return "Esa cuenta ya esta vinculada de otra forma. Prueba con otra cuenta de Google.";
    case "Verification":
      return "El enlace de acceso caduco. Intentalo de nuevo.";
    default:
      return "No se pudo completar el acceso. Intentalo de nuevo.";
  }
}

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
  const pathname = usePathname();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codigo = new URLSearchParams(window.location.search).get("error");
    if (!codigo) return;

    setError(mensajeDeError(codigo));
    // Se limpia la URL para que el aviso no reaparezca al recargar ni viaje si se comparte.
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const protegida = rutaRequiereSesion(pathname);

  const avisoError = error ? (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-alerta/40 bg-alerta/10 p-3"
    >
      <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-alerta" />
      <p className="text-xs leading-relaxed text-texto/90">{error}</p>
    </div>
  ) : null;

  // Rutas libres (Inicio, Mapa, Arquitectura, Cuenta): nunca esperan ni exigen sesion. Si el
  // login fallo mientras se intentaba entrar a una ruta protegida, NextAuth vuelve aqui
  // (auth.ts: pages.error = "/") — el aviso tiene que verse igual, aunque esta ruta no pida cuenta.
  if (!protegida) {
    return (
      <>
        {avisoError ? <div className="mx-auto max-w-lg px-4 pt-3">{avisoError}</div> : null}
        {children}
      </>
    );
  }

  if (status === "loading") return <Cargando />;

  // Sesion iniciada, o despliegue sin login configurado: pasa.
  if (status === "authenticated" || !googleDisponible) return <>{children}</>;

  const copy = COPY_POR_RUTA[pathname] ?? COPY_POR_DEFECTO;

  return (
    <div className="min-h-dvh overflow-y-auto bg-fondo">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-6 pt-16 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-marca/15 text-marca">
            <Icono nombre="escudo" className="h-8 w-8" />
          </span>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-texto">{copy.titulo}</h1>
          <p className="mt-2 text-sm leading-relaxed text-suave">{copy.bajada}</p>
        </div>

        <div className="space-y-3">
          {avisoError}

          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              setOcupado(true);
              // Vuelve a la misma ruta protegida tras entrar (ej. /reportar), no siempre a
              // Inicio: con la puerta selectiva (ADR-035) el punto de partida ya no es fijo.
              void signIn("google", { redirectTo: pathname });
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
