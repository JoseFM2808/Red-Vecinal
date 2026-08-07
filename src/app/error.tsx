"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icono } from "@/components/ui/Icono";

/**
 * Frontera de error de la app.
 *
 * Importa para la demo: si una pantalla revienta en vivo, el vecino (y el jurado)
 * ven algo entendible y un boton para seguir, no la pantalla blanca de Next.
 */
export default function ErrorApp({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En Vercel esto queda en los logs de runtime del deploy.
    console.error("[vecino-seguro] error en la interfaz:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-alerta/12 text-alerta">
        <Icono nombre="alerta" className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-texto">Algo se rompio en esta pantalla</h1>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-suave">
        Tus reportes siguen guardados en este dispositivo. Puedes reintentar sin perder nada.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-tenue">ref: {error.digest}</p>
      ) : null}

      <div className="mt-6 flex w-full max-w-xs gap-2">
        <button
          type="button"
          onClick={reset}
          className="toque flex-1 rounded-xl bg-superficie-alta text-sm font-medium text-texto"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="toque flex flex-1 items-center justify-center rounded-xl border border-borde text-sm font-medium text-suave"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
