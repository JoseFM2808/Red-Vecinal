"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";
import { rutaRequiereSesion } from "@/lib/acceso";

/**
 * Puerta de acceso — aviso con boton, no porton ni redireccion muda (ADR-048).
 *
 * Historia en tres actos, todos con feedback del equipo probando con cuentas reales:
 *  - ADR-027/035: porton a pantalla completa. Cerro mal: cerrar sesion aterrizaba en el
 *    porton y parecia que salir era volver a entrar.
 *  - ADR-045: redireccion muda a la home. Cerro mal al reves: tocar "Reportar ahora" sin
 *    sesion rebotaba a Inicio sin explicar nada — "el boton se rompio".
 *  - ADR-048 (esto): aviso claro con boton de Google en la ruta protegida, con salida
 *    "Volver al inicio". El signOut sigue aterrizando en la home (eso no se toca), asi
 *    que este aviso solo aparece por navegacion intencional a reportar/circulo/cuenta.
 *
 * Lo que se conserva de la puerta original:
 *  - El aviso de error de login: NextAuth vuelve a la raiz con ?error=CODIGO cuando algo
 *    falla, y sin este aviso la persona reintenta a ciegas.
 *  - La espera sobria mientras se resuelve la sesion en rutas protegidas, para no
 *    parpadear contenido que quiza haya que quitar.
 *  - LA VALVULA: sin credenciales de Google configuradas, todo pasa. Un despliegue sin
 *    variables de entorno no puede dejar rutas inaccesibles.
 */

/**
 * NextAuth vuelve a la raiz con ?error=CODIGO cuando el login falla. Hay que leerlo:
 * si no, la persona vuelve a la home sin ninguna pista de que paso y lo unico que
 * puede hacer es volver a intentar a ciegas.
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

/** Espera sobria mientras se resuelve la sesion o corre la redireccion. */
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

/** Copy puntual segun la ruta que pidio la cuenta (ADR-048). */
const COPY_POR_RUTA: Record<string, { titulo: string; bajada: string }> = {
  "/reportar": {
    titulo: "Para reportar hace falta entrar",
    bajada:
      "Entrar no te identifica ante la red: tu alias sigue siendo lo unico que ven los demas. La cuenta existe para que haya una identidad real detras de la revelacion selectiva, si algun dia hace falta.",
  },
  "/circulo": {
    titulo: "El circulo de cuidado pide entrar",
    bajada:
      "Los contactos y los vinculos que guardas ahi quedan atados a tu cuenta, no a este telefono, para poder recuperarlos o revocarlos si cambias de dispositivo.",
  },
  "/cuenta": {
    titulo: "Tu cuenta pide entrar",
    bajada: "Aqui viven tu alias, tus recompensas y la revelacion selectiva.",
  },
};
const COPY_POR_DEFECTO = {
  titulo: "Esta seccion pide entrar",
  bajada: "Entrar no te identifica ante la red: tu alias sigue siendo lo unico que ven los demas.",
};

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

export function PuertaAcceso({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const googleDisponible = useGoogleDisponible();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState(false);

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
  const pideCuenta = protegida && googleDisponible && status === "unauthenticated";

  // Si venia con una invitacion del circulo (#v=...), se guarda ANTES de que el OAuth se
  // lleve la URL: el fragmento no sobrevive la vuelta de Google y, sin esto, quien abrio
  // el enlace de un familiar tenia que pedirlo de nuevo despues de entrar (ADR-046).
  useEffect(() => {
    if (!pideCuenta) return;
    const hash = window.location.hash;
    if (pathname === "/circulo" && hash.startsWith("#v=")) {
      try {
        window.sessionStorage.setItem("vecino-seguro:invitacion-pendiente", hash);
      } catch {
        // Sin sessionStorage la invitacion se pierde, como antes: no es peor.
      }
    }
  }, [pideCuenta, pathname]);

  // Rutas libres (Inicio, Mapa, Arquitectura, landing): nunca esperan ni exigen sesion.
  // El login fallido vuelve aqui (auth.ts: pages.error = "/"), asi que el aviso vive aqui.
  if (!protegida) {
    return (
      <>
        {error ? (
          <div className="mx-auto max-w-lg px-4 pt-3">
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-alerta/40 bg-alerta/10 p-3"
            >
              <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-alerta" />
              <p className="text-xs leading-relaxed text-texto/90">{error}</p>
            </div>
          </div>
        ) : null}
        {children}
      </>
    );
  }

  if (status === "loading") return <Cargando />;

  // Sesion iniciada, o despliegue sin login configurado: pasa.
  if (status === "authenticated" || !googleDisponible) return <>{children}</>;

  // Navegacion intencional a una ruta protegida sin sesion: aviso claro con el boton de
  // entrar y una salida visible. Ni porton sorpresa (ADR-045) ni rebote mudo (ADR-048).
  const copy = COPY_POR_RUTA[pathname] ?? COPY_POR_DEFECTO;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-marca/15 text-marca">
        <Icono nombre="candado" className="h-6 w-6" />
      </span>

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-texto">{copy.titulo}</h1>
      <p className="mt-2 text-sm leading-relaxed text-suave">{copy.bajada}</p>

      <div className="mt-5 space-y-3">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-alerta/40 bg-alerta/10 p-3"
          >
            <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0 text-alerta" />
            <p className="text-xs leading-relaxed text-texto/90">{error}</p>
          </div>
        ) : null}

        <button
          type="button"
          disabled={abriendo}
          onClick={() => {
            setAbriendo(true);
            // De vuelta a la MISMA ruta que lo pidio: quien toco Reportar va a reportar.
            void signIn("google", { redirectTo: pathname });
          }}
          className="toque flex w-full items-center justify-center gap-2.5 rounded-xl bg-white text-sm font-semibold text-[#1f1f1f] transition active:scale-[0.99] disabled:opacity-60"
        >
          <LogoGoogle />
          {abriendo ? "Abriendo Google…" : "Continuar con Google"}
        </button>

        <Link
          href="/"
          className="toque flex w-full items-center justify-center rounded-xl border border-borde text-sm font-medium text-suave"
        >
          Volver al inicio
        </Link>

        <p className="text-center text-[11px] leading-relaxed text-tenue">
          Tu correo no se publica, no se comparte y no toca la cadena. La red solo ve tu alias.
        </p>
      </div>
    </div>
  );
}
