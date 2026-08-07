"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useApp } from "@/components/proveedores/AppProvider";
import { useGoogleDisponible } from "@/components/proveedores/SesionProvider";
import { Icono } from "@/components/ui/Icono";

/**
 * Punto de entrada permanente al acceso, en la cabecera de Inicio (ADR-026).
 *
 * La pantalla de bienvenida solo sale una vez por dispositivo, asi que despues de
 * descartarla no quedaba ninguna forma visible de entrar: el boton vivia dentro de la
 * pestana Cuenta y habia que ir a buscarlo. Esto lo deja siempre a la vista sin
 * convertirlo en un peaje — sigue sin hacer falta cuenta para reportar.
 *
 * Con sesion iniciada muestra el avatar y lleva a Cuenta.
 */
export function AccesoRapido() {
  const { cuenta } = useApp();
  const googleDisponible = useGoogleDisponible();
  const [ocupado, setOcupado] = useState(false);

  if (cuenta) {
    return (
      <Link
        href="/cuenta"
        aria-label="Ver tu cuenta"
        className="toque flex shrink-0 items-center gap-2 rounded-full border border-borde bg-superficie px-2.5 text-xs font-medium text-suave"
      >
        {cuenta.imagen ? (
          <img
            src={cuenta.imagen}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Icono nombre="cuenta" className="h-4 w-4" />
        )}
        <span className="max-w-20 truncate">{cuenta.nombre?.split(" ")[0] ?? "Cuenta"}</span>
      </Link>
    );
  }

  // Sin login configurado no se ofrece nada: la app funciona igual con el alias local.
  if (!googleDisponible) return null;

  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={() => {
        setOcupado(true);
        void signIn("google", { redirectTo: "/cuenta" });
      }}
      className="toque flex shrink-0 items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 text-xs font-medium text-texto disabled:opacity-60"
    >
      <Icono nombre="cuenta" className="h-4 w-4 text-suave" />
      {ocupado ? "Abriendo…" : "Entrar"}
    </button>
  );
}
