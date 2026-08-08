"use client";

import { PrivyProvider, useWallets } from "@privy-io/react-auth";
import { useEffect, type ReactNode } from "react";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import type { EIP1193Provider } from "viem";
import { registrarProveedorEmbebido } from "@/lib/chain/proveedor-inyectado";
import { CONFIG } from "@/lib/config";

/**
 * Wallet embebida con Privy (ADR-050) — la pieza que cierra el hueco de firma del §8.
 *
 * Quien entra con Google no tiene clave con que firmar (la identidad de la app es un
 * hash, SIGUIENTES-PASOS §8.1). Privy le crea una wallet embebida atada a su Google,
 * y este proveedor la REGISTRA en la costura que el adaptador ya usaba
 * (proveedor-inyectado.ts): a partir de ahi, anclar un reporte firma de verdad y el
 * respaldo del ADR-049 deja de activarse para esa persona.
 *
 * SIN NEXT_PUBLIC_PRIVY_APP_ID configurado, este componente es un passthrough puro:
 * ni SDK montado, ni red, ni cambio de comportamiento. La beta sin variables sigue
 * funcionando identica.
 *
 * La sesion de la app sigue siendo NextAuth (ADR-021): Privy solo aporta la firma.
 * Unificar ambos logins quedo para despues del 12 — dos popups de Google es un costo
 * asumido y documentado en el ADR.
 */

const CADENA_POR_ID = { 421614: arbitrumSepolia, 42161: arbitrum } as const;

/** Registra el proveedor EIP-1193 de la wallet embebida cuando existe. */
function PuenteFirma({ children }: { children: ReactNode }) {
  const { wallets } = useWallets();

  useEffect(() => {
    // La embebida de Privy gana; si no hay, cualquier otra que Privy conozca.
    const wallet = wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];
    if (!wallet) {
      registrarProveedorEmbebido(null);
      return;
    }

    let vigente = true;
    void (async () => {
      try {
        // La red correcta antes de registrar: el contrato vive en un chainId concreto
        // y una wallet en otra red firmaria transacciones que nunca llegan.
        await wallet.switchChain(CONFIG.chainId);
      } catch {
        // Si el switch falla se registra igual: el adaptador especifica la cadena al
        // firmar y la wallet embebida respeta el parametro.
      }
      try {
        const proveedor = await wallet.getEthereumProvider();
        if (vigente) registrarProveedorEmbebido(proveedor as EIP1193Provider);
      } catch (error) {
        console.warn("[vecino-seguro] la wallet embebida no expuso su proveedor", error);
        if (vigente) registrarProveedorEmbebido(null);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [wallets]);

  return <>{children}</>;
}

export function ProveedorPrivy({ children }: { children: ReactNode }) {
  const appId = CONFIG.walletAbstraction.privyAppId;
  // Passthrough total sin App ID: cero SDK, cero red, cero riesgo para la beta.
  if (!appId) return <>{children}</>;

  const cadena = CADENA_POR_ID[CONFIG.chainId as keyof typeof CADENA_POR_ID] ?? arbitrumSepolia;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["google"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          // Sin popup de confirmacion por cada firma: el vecino ya confirmo el reporte
          // en la interfaz y el gesto extra solo ensena a tocar "aceptar" sin leer.
          showWalletUIs: false,
        },
        defaultChain: cadena,
        supportedChains: [arbitrumSepolia, arbitrum],
        appearance: {
          theme: "dark",
          accentColor: "#2fe6a8",
        },
      }}
    >
      <PuenteFirma>{children}</PuenteFirma>
    </PrivyProvider>
  );
}
