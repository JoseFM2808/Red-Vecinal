"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { POLITICA_RECOMPENSA, recompensaTrasCorroborar } from "@/lib/antisybil";
import { obtenerAdaptadorDeCadena } from "@/lib/chain";
import { distanciaMetros } from "@/lib/geo";
import { cargarOCrearIdentidad } from "@/lib/identidad";
import {
  crearReporte,
  type EtapaFlujo,
  type ResultadoFlujo,
  type SolicitudReporte,
} from "@/lib/flujo-reporte";
import { cargarReportes, guardarReportes, limpiarReportes } from "@/lib/repositorio";
import { construirReportesSembrados } from "@/lib/seed";
import { obtenerAdaptadorDeEvidencia } from "@/lib/storage";
import type { DestinoEscalamiento, Identidad, Reporte } from "@/lib/tipos";

/**
 * Estado de la aplicacion.
 *
 * Es deliberadamente delgado: guarda reportes e identidad y delega toda la logica
 * a las funciones puras de src/lib. Cuando el mapa se hidrate desde eventos de
 * ReportRegistry, lo unico que cambia es de donde salen los reportes.
 */

type SolicitudUI = Omit<SolicitudReporte, "identidad" | "reportesPrevios">;

interface EstadoApp {
  identidad: Identidad | null;
  reportes: Reporte[];
  cargando: boolean;
  saldo: number;
  saldoPendiente: number;
  misReportes: Reporte[];
  enviarReporte: (
    solicitud: SolicitudUI,
    onEtapa?: (etapa: EtapaFlujo) => void,
  ) => Promise<ResultadoFlujo>;
  corroborar: (idReporte: string) => void;
  escalar: (idReporte: string, destino: DestinoEscalamiento) => Promise<string | null>;
  reiniciarDemo: () => Promise<void>;
}

const Contexto = createContext<EstadoApp | null>(null);

/** Reportes previos que el reporte nuevo confirma (mismo hecho, cerca y a tiempo). */
function reportesCorroboradosPor(nuevo: Reporte, previos: readonly Reporte[]): Set<string> {
  const ids = new Set<string>();
  for (const previo of previos) {
    if (previo.autorDireccion.toLowerCase() === nuevo.autorDireccion.toLowerCase()) continue;
    if (previo.categoria !== nuevo.categoria) continue;
    if (nuevo.creadoEn - previo.creadoEn > POLITICA_RECOMPENSA.ventanaCorroboracionMs) continue;
    if (
      distanciaMetros(previo.coordenada, nuevo.coordenada) > POLITICA_RECOMPENSA.radioCorroboracionM
    ) {
      continue;
    }
    ids.add(previo.id);
  }
  return ids;
}

function agregarCorroboracion(reporte: Reporte, direccion: string): Reporte {
  const yaEsta = reporte.corroboraciones.some(
    (d) => d.toLowerCase() === direccion.toLowerCase(),
  );
  if (yaEsta) return reporte;

  const corroboraciones = [...reporte.corroboraciones, direccion.toLowerCase()];
  return { ...reporte, corroboraciones, recompensa: recompensaTrasCorroborar(corroboraciones.length) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [identidad, setIdentidad] = useState<Identidad | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    const iniciar = async () => {
      const id = cargarOCrearIdentidad();
      const guardados = cargarReportes();
      const iniciales = guardados ?? (await construirReportesSembrados(Date.now()));

      if (!vigente) return;
      setIdentidad(id);
      setReportes(iniciales);
      setCargando(false);
      if (!guardados) guardarReportes(iniciales);
    };

    void iniciar();
    return () => {
      vigente = false;
    };
  }, []);

  const persistir = useCallback((siguiente: Reporte[]) => {
    setReportes(siguiente);
    guardarReportes(siguiente);
  }, []);

  const enviarReporte = useCallback<EstadoApp["enviarReporte"]>(
    async (solicitud, onEtapa) => {
      if (!identidad) {
        return {
          ok: false,
          codigo: "error",
          mensaje: "Todavia no hay identidad en este dispositivo.",
          proximoPermitidoEn: null,
        };
      }

      const resultado = await crearReporte(
        { ...solicitud, identidad, reportesPrevios: reportes },
        {
          cadena: obtenerAdaptadorDeCadena(),
          evidencia: obtenerAdaptadorDeEvidencia(),
          ahora: () => Date.now(),
        },
        onEtapa,
      );

      if (!resultado.ok) return resultado;

      // El reporte nuevo tambien corrobora a los que ya estaban: la senal va en
      // los dos sentidos, igual que hara TokenReward.corroborate() en cadena.
      const corroborados = reportesCorroboradosPor(resultado.reporte, reportes);
      const actualizados = reportes.map((r) =>
        corroborados.has(r.id) ? agregarCorroboracion(r, identidad.direccion) : r,
      );

      persistir([resultado.reporte, ...actualizados]);
      return resultado;
    },
    [identidad, persistir, reportes],
  );

  const corroborar = useCallback<EstadoApp["corroborar"]>(
    (idReporte) => {
      if (!identidad) return;
      persistir(
        reportes.map((r) =>
          r.id === idReporte && r.autorDireccion.toLowerCase() !== identidad.direccion.toLowerCase()
            ? agregarCorroboracion(r, identidad.direccion)
            : r,
        ),
      );
    },
    [identidad, persistir, reportes],
  );

  const escalar = useCallback<EstadoApp["escalar"]>(
    async (idReporte, destino) => {
      const reporte = reportes.find((r) => r.id === idReporte);
      if (!reporte) return null;

      try {
        const respuesta = await fetch("/api/escalamiento", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contentHash: reporte.contentHash,
            categoria: reporte.categoria,
            destino,
            coordenada: reporte.coordenada,
            zonaNombre: reporte.zonaNombre,
            cid: reporte.evidencia?.cid ?? null,
          }),
        });

        if (!respuesta.ok) return null;
        const datos: unknown = await respuesta.json();
        const cuerpo = datos as { folio?: string; simulado?: boolean; mensaje?: string };
        if (!cuerpo.folio) return null;

        persistir(
          reportes.map((r) =>
            r.id === idReporte
              ? {
                  ...r,
                  escalamiento: {
                    folio: cuerpo.folio ?? "",
                    destino,
                    creadoEn: Date.now(),
                    simulado: cuerpo.simulado ?? true,
                    mensaje: cuerpo.mensaje ?? "",
                  },
                }
              : r,
          ),
        );
        return cuerpo.folio;
      } catch {
        return null;
      }
    },
    [persistir, reportes],
  );

  const reiniciarDemo = useCallback(async () => {
    setCargando(true);
    limpiarReportes();
    const frescos = await construirReportesSembrados(Date.now());
    persistir(frescos);
    setCargando(false);
  }, [persistir]);

  const valor = useMemo<EstadoApp>(() => {
    const mios = identidad
      ? reportes.filter(
          (r) => r.autorDireccion.toLowerCase() === identidad.direccion.toLowerCase(),
        )
      : [];

    const sumar = (estado: "otorgada" | "pendiente_corroboracion") =>
      mios
        .filter((r) => r.recompensa.estado === estado)
        .reduce((total, r) => total + r.recompensa.monto, 0);

    return {
      identidad,
      reportes,
      cargando,
      saldo: sumar("otorgada"),
      saldoPendiente: sumar("pendiente_corroboracion"),
      misReportes: mios,
      enviarReporte,
      corroborar,
      escalar,
      reiniciarDemo,
    };
  }, [cargando, corroborar, enviarReporte, escalar, identidad, reiniciarDemo, reportes]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useApp(): EstadoApp {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
