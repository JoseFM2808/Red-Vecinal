"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Envuelve la app con la sesion de NextAuth y publica si el login esta configurado.
 *
 * Por que se consulta en runtime y no basta el valor del servidor: las paginas son
 * estaticas, asi que lo que el layout calcula se hornea en el build. Si alguien agrega
 * las credenciales de Google en Vercel despues, el HTML seguiria diciendo que no hay
 * login hasta el siguiente despliegue. `/api/auth/providers` es una ruta dinamica y
 * siempre responde con la verdad del momento.
 *
 * El valor del servidor se usa como estado inicial para que no parpadee: en Vercel el
 * build ya tiene las credenciales y acierta desde el primer render.
 *
 * Ninguna credencial cruza al navegador: solo viaja el booleano.
 */

const ContextoGoogle = createContext(false);

/** true cuando hay un proveedor de Google registrado y utilizable. */
export function useGoogleDisponible(): boolean {
  return useContext(ContextoGoogle);
}

export function SesionProvider({
  googleDisponible,
  children,
}: {
  googleDisponible: boolean;
  children: ReactNode;
}) {
  const [disponible, setDisponible] = useState(googleDisponible);

  useEffect(() => {
    let vigente = true;

    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((proveedores: Record<string, unknown> | null) => {
        if (vigente) setDisponible(Boolean(proveedores?.google));
      })
      .catch(() => {
        // Sin respuesta se conserva lo que dijo el servidor: no hay nada que romper.
      });

    return () => {
      vigente = false;
    };
  }, []);

  return (
    <ContextoGoogle.Provider value={disponible}>
      <SessionProvider>{children}</SessionProvider>
    </ContextoGoogle.Provider>
  );
}
