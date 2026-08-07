"use client";

/* eslint-disable @next/next/no-img-element */

import { signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/proveedores/AppProvider";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";
import { Aviso, EtiquetaSimulado } from "@/components/ui/primitivos";

/**
 * Acceso con Google (ADR-021).
 *
 * El mensaje que hay que dejar claro en pantalla, porque es lo que un jurado va a
 * preguntar: iniciar sesion NO te identifica ante la red. Tu alias publico no cambia
 * y sigue siendo lo unico que ven los demas y lo unico que llega a la cadena. Google
 * sirve para dos cosas: recuperar tu cuenta en otro telefono, y ser la identidad real
 * que solo se abriria con las 2 de 3 firmas de IdentityEscrow.
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
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/**
 * NextAuth vuelve a /cuenta?error=CODIGO cuando algo falla. Sin esto, el vecino
 * regresa a la pantalla y no pasa nada: parece que el boton esta roto.
 */
function mensajeDeError(codigo: string): string {
  switch (codigo) {
    case "Configuration":
      return "El acceso con Google no esta bien configurado en este despliegue. Avisa al equipo: sin eso no se puede entrar.";
    case "AccessDenied":
      return "Google no autorizo el acceso. Si cancelaste, puedes intentarlo de nuevo.";
    case "OAuthAccountNotLinked":
      return "Esa cuenta ya esta vinculada de otra forma. Prueba con otra cuenta de Google.";
    default:
      return "No se pudo completar el acceso. Intentalo de nuevo.";
  }
}

export function AccesoGoogle() {
  const { cuenta } = useApp();
  const disponible = useGoogleDisponible();
  const [ocupado, setOcupado] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("error");
    if (!codigo) return;

    setErrorAcceso(mensajeDeError(codigo));
    // Se limpia la URL para que el aviso no reaparezca al recargar o compartir el enlace.
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const avisoError = errorAcceso ? (
    <div className="mb-2">
      <Aviso tono="alerta" icono="alerta">
        {errorAcceso}
      </Aviso>
    </div>
  ) : null;

  // Sin credenciales cargadas no se ofrece: la app funciona igual sin login.
  if (!disponible && !cuenta) {
    return (
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="etiqueta-seccion">Acceso</h2>
          <EtiquetaSimulado titulo="Falta configurar las credenciales de Google en el entorno" />
        </div>
        {avisoError}
        <Aviso tono="info" icono="candado">
          El acceso con Google no esta configurado en este despliegue, asi que la puerta de
          entrada esta abierta y todos usan un seudonimo local. Al configurarlo, la app
          volvera a pedir cuenta para entrar.
        </Aviso>
      </section>
    );
  }

  if (cuenta) {
    return (
      <section>
        <h2 className="etiqueta-seccion mb-2">Cuenta vinculada</h2>
        <div className="tarjeta p-4">
          <div className="flex items-center gap-3">
            {cuenta.imagen ? (
              <img
                src={cuenta.imagen}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-borde"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-superficie-alta text-suave">
                <Icono nombre="cuenta" className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-texto">{cuenta.nombre ?? "Cuenta"}</p>
              <p className="truncate text-xs text-tenue">{cuenta.correo}</p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-marca/30 bg-marca/8 p-3">
            <Icono nombre="candado" className="mt-0.5 h-4 w-4 shrink-0 text-marca" />
            <p className="text-[11px] leading-relaxed text-texto/90">
              Nadie en la red ve esto. Tu alias publico sigue siendo el de arriba, y es lo
              unico que llega a la cadena. Estos datos viven cifrados en una cookie de tu
              dispositivo — no hay servidor nuestro que los guarde.
            </p>
          </div>

          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              setOcupado(true);
              void signOut({ redirectTo: "/cuenta" });
            }}
            className="toque mt-3 w-full rounded-xl border border-borde bg-superficie-alta text-sm font-medium text-suave disabled:opacity-50"
          >
            {ocupado ? "Cerrando…" : "Cerrar sesion"}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-tenue">
            Al cerrar sesion vuelves a tu seudonimo local. Tus reportes anteriores siguen
            asociados a la cuenta y reaparecen cuando vuelvas a entrar.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="etiqueta-seccion mb-2">Acceso</h2>
      {avisoError}
      <div className="tarjeta p-4">
        <p className="text-xs leading-relaxed text-suave">
          No hay sesion iniciada. Entrar te devuelve tu mismo alias y tus reportes; no te
          identifica ante la red vecinal, que sigue viendo solo el alias.
        </p>

        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setOcupado(true);
            void signIn("google", { redirectTo: "/cuenta" });
          }}
          className="toque mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-white text-sm font-semibold text-[#1f1f1f] transition active:scale-[0.99] disabled:opacity-60"
        >
          <LogoGoogle />
          {ocupado ? "Abriendo Google…" : "Continuar con Google"}
        </button>

        <p className="mt-3 text-[11px] leading-relaxed text-tenue">
          Tu correo no se publica, no se comparte y no toca la cadena. Es la identidad real
          que solo se abriria con las 2 de 3 firmas de la revelacion selectiva.
        </p>
      </div>
    </section>
  );
}
