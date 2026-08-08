"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta, TituloSeccion } from "@/components/ui/primitivos";
import { urlDireccion } from "@/lib/chain/redes";
import { CONFIG } from "@/lib/config";
import { abreviarHash } from "@/lib/formato";

/**
 * Activacion de la firma embebida (ADR-050).
 *
 * El vecino entra aqui UNA vez: Privy le crea una wallet atada a su Google y desde
 * entonces sus reportes se anclan de verdad en Arbitrum, sin extension ni frase
 * semilla. Sin activarla nada se rompe: el anclaje cae al comprobante simulado
 * (ADR-049), etiquetado como tal.
 *
 * La seccion solo existe si Privy esta configurado Y el modo de cadena es real:
 * activar una firma que no tiene donde firmar seria un boton de humo.
 */

function TarjetaFirma() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [ocupado, setOcupado] = useState(false);

  const embebida = wallets.find((w) => w.walletClientType === "privy");

  if (!ready) {
    return (
      <Tarjeta className="p-4">
        <p className="text-xs text-tenue">Preparando la firma digital…</p>
      </Tarjeta>
    );
  }

  if (!authenticated || !embebida) {
    return (
      <Tarjeta className="p-4">
        <p className="text-sm font-medium text-texto">Activa tu firma digital</p>
        <p className="mt-1 text-xs leading-relaxed text-suave">
          Un toque y tus reportes quedan anclados de verdad en {CONFIG.chainId === 42161 ? "Arbitrum" : "Arbitrum Sepolia"},
          firmados por una wallet atada a tu cuenta — sin instalar nada y sin frase semilla.
          Hasta entonces, tus comprobantes se marcan como simulados.
        </p>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => {
            setOcupado(true);
            try {
              login();
            } finally {
              // El modal de Privy toma el control; si la persona lo cierra, el boton vuelve.
              setTimeout(() => setOcupado(false), 1500);
            }
          }}
          className="toque mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-marca text-sm font-semibold text-fondo transition active:scale-[0.99] disabled:opacity-60"
        >
          <Icono nombre="candado" className="h-4 w-4" />
          {ocupado ? "Abriendo…" : "Activar firma con Google"}
        </button>
        <p className="mt-2 text-[11px] leading-relaxed text-tenue">
          Veras el consentimiento de Google una vez mas: la sesion de la app y la firma son
          dos permisos separados a proposito — puedes retirar cualquiera sin perder el otro.
        </p>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="border-marca/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-texto">
            <span className="h-2 w-2 rounded-full bg-marca" />
            Firma activa
          </p>
          <p className="mt-1 text-xs leading-relaxed text-suave">
            Tus proximos reportes se anclan de verdad, firmados por tu wallet embebida.
          </p>
          <a
            href={urlDireccion(CONFIG.chainId, embebida.address)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-info underline-offset-2 hover:underline"
          >
            {abreviarHash(embebida.address)}
            <Icono nombre="enlace" className="h-3 w-3" />
          </a>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="toque shrink-0 rounded-xl border border-borde px-3 text-xs font-medium text-suave"
        >
          Desactivar
        </button>
      </div>
      <p className="mt-3 rounded-xl border border-ambar/30 bg-ambar/5 p-2.5 text-[11px] leading-relaxed text-suave">
        <span className="font-semibold text-ambar">Gas:</span> anclar cuesta fracciones de
        centavo que paga esta wallet. En la prueba, el equipo le deposita una gota de ETH de
        testnet — pasale la direccion de arriba a quien administre la wallet fondeada.
        {user?.google?.email ? " Atada a tu Google actual." : ""}
      </p>
    </Tarjeta>
  );
}

export function FirmaDigital() {
  // Sin Privy configurado o sin cadena real, la seccion entera no existe.
  if (!CONFIG.walletAbstraction.privyAppId || CONFIG.modoCadena !== "arbitrum") return null;

  return (
    <section>
      <TituloSeccion>Firma digital</TituloSeccion>
      <TarjetaFirma />
    </section>
  );
}
