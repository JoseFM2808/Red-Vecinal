"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";
import { rutaRequiereSesion } from "@/lib/acceso";

/**
 * Puerta de acceso — ya no es una pantalla, es una redireccion (ADR-045).
 *
 * La pantalla-porton con "Continuar con Google" (ADR-027/035) dejo de existir: el acceso
 * vive en los botones — AccesoRapido en Inicio y el Mapa, y Entrar al centro de la barra
 * del visitante (ADR-043). Quien llega sin sesion a una ruta protegida (reportar, circulo,
 * cuenta) vuelve a la home, que es donde estan esos botones. El caso mas comun era el
 * peor: cerrar sesion redirigia a /cuenta, ya protegida, y te plantaba en el porton de
 * Google recien salido — parecia que cerrar sesion era volver a entrar.
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

export function PuertaAcceso({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const googleDisponible = useGoogleDisponible();
  const pathname = usePathname();
  const router = useRouter();
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
  const debeVolverAlInicio = protegida && googleDisponible && status === "unauthenticated";

  // La redireccion es un efecto, no un render: navegar durante el render rompe React.
  useEffect(() => {
    if (debeVolverAlInicio) router.replace("/");
  }, [debeVolverAlInicio, router]);

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

  // Sin sesion en ruta protegida: la espera se muestra mientras el replace lleva a la
  // home. No se pinta el contenido protegido ni el porton que ya no existe.
  return <Cargando />;
}
