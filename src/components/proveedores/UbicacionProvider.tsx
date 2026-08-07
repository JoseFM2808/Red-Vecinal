"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Coordenada } from "@/lib/tipos";

/**
 * Ubicacion actual del vecino (ADR-023).
 *
 * Es DELIBERADAMENTE independiente del login: saber donde estas no tiene nada que ver
 * con tener cuenta, y el producto promete que se puede usar todo sin registrarse. Este
 * proveedor vive fuera de la sesion y nunca la consulta.
 *
 * La posicion no sale del dispositivo. Este proveedor solo la mantiene en memoria para
 * que el mapa y el inicio la muestren; lo que se envia en un reporte se captura aparte,
 * fresco, en el momento de reportar (src/components/reportar/FlujoReporte.tsx).
 *
 * Sobre el permiso: no se pide solo al abrir la app. Un navegador que recibe la peticion
 * sin que el usuario haya hecho nada suele bloquearla para siempre. Aqui se consulta
 * primero el estado del permiso —que no genera ventana— y solo si YA estaba concedido se
 * empieza a seguir la posicion. Si no, se espera a que la persona lo pida.
 */

export type EstadoUbicacion =
  | "inactiva"
  | "buscando"
  | "lista"
  | "denegada"
  | "no_soportada"
  | "error";

interface EstadoUbicacionApp {
  coordenada: Coordenada | null;
  /** Radio de incertidumbre en metros que reporta el navegador. */
  precisionM: number | null;
  estado: EstadoUbicacion;
  actualizadoEn: number | null;
  /** Pide el permiso y empieza a seguir la posicion. Requiere gesto del usuario. */
  solicitar: () => void;
}

const Contexto = createContext<EstadoUbicacionApp | null>(null);

const OPCIONES: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 15_000,
};

export function UbicacionProvider({ children }: { children: ReactNode }) {
  const [coordenada, setCoordenada] = useState<Coordenada | null>(null);
  const [precisionM, setPrecisionM] = useState<number | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoUbicacion>("inactiva");

  const vigilancia = useRef<number | null>(null);

  const alRecibir = useCallback((pos: GeolocationPosition) => {
    setCoordenada({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setPrecisionM(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
    setActualizadoEn(Date.now());
    setEstado("lista");
  }, []);

  const alFallar = useCallback((error: GeolocationPositionError) => {
    setEstado(error.code === error.PERMISSION_DENIED ? "denegada" : "error");
  }, []);

  const seguir = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setEstado("no_soportada");
      return;
    }
    if (vigilancia.current !== null) return;

    setEstado((previo) => (previo === "lista" ? previo : "buscando"));
    // watchPosition en vez de getCurrentPosition: la posicion se mantiene al dia
    // mientras la persona camina, que es lo que se espera de "mi ubicacion actual".
    vigilancia.current = navigator.geolocation.watchPosition(alRecibir, alFallar, OPCIONES);
  }, [alFallar, alRecibir]);

  // Al montar: si el permiso YA estaba concedido, se sigue la posicion sin preguntar nada.
  // Consultar el estado del permiso no abre ninguna ventana.
  useEffect(() => {
    let vigente = true;

    const revisar = async () => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setEstado("no_soportada");
        return;
      }
      if (!("permissions" in navigator)) return;

      try {
        const permiso = await navigator.permissions.query({ name: "geolocation" });
        if (!vigente) return;
        if (permiso.state === "granted") seguir();
        if (permiso.state === "denied") setEstado("denegada");
      } catch {
        // Navegador sin Permissions API: se queda inactiva hasta que la persona lo pida.
      }
    };

    void revisar();
    return () => {
      vigente = false;
    };
  }, [seguir]);

  useEffect(() => {
    return () => {
      if (vigilancia.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(vigilancia.current);
        vigilancia.current = null;
      }
    };
  }, []);

  const valor = useMemo<EstadoUbicacionApp>(
    () => ({ coordenada, precisionM, estado, actualizadoEn, solicitar: seguir }),
    [actualizadoEn, coordenada, estado, precisionM, seguir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useUbicacion(): EstadoUbicacionApp {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useUbicacion debe usarse dentro de <UbicacionProvider>");
  return ctx;
}
