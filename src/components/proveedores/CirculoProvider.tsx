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
import { useApp } from "@/components/proveedores/AppProvider";
import { obtenerCategoria } from "@/lib/categorias";
import {
  RADIO_AVISO_POR_DEFECTO_M,
  evaluarAvisos,
  type AvisoCercania,
  type ContactoCirculo,
} from "@/lib/circulo";
import {
  BASES_DEMO,
  cargarAvisados,
  cargarContactos,
  contactosSembrados,
  guardarAvisados,
  guardarContactos,
  limpiarCirculo,
} from "@/lib/circulo-repositorio";
import {
  INTERVALO_SIMULACION_MS,
  moverContactos,
  posicionSimulada,
  semillaDeTexto,
} from "@/lib/circulo-simulacion";
import type { Coordenada } from "@/lib/tipos";

/**
 * Estado del circulo de cuidado (ADR-101).
 *
 * Cada 20 segundos mueve a los contactos que estan compartiendo y vuelve a evaluar si
 * algun reporte reciente cayo cerca de alguno. Los avisos no se repiten: la clave
 * contacto+reporte se recuerda entre recargas.
 *
 * REQUIERE SESION (ADR-102). A diferencia del resto de la app, el circulo solo funciona
 * con la cuenta de Google iniciada. La razon no es tecnica: aqui se guardan los telefonos
 * de tu familia y las posiciones que te comparten, que es el dato mas sensible que maneja
 * el producto. Atarlo a una cuenta es lo que permite revocarlo y no dejarlo suelto en un
 * telefono prestado. Sin sesion no se cargan contactos, no corre el latido y no se emite
 * ningun aviso.
 */

export type PermisoNotificacion = NotificationPermission | "no_soportado";

export interface NuevoContacto {
  nombre: string;
  telefono: string;
  relacion: string;
  radioAvisoM: number;
}

interface EstadoCirculo {
  /** Hay sesion de Google iniciada. Sin esto el circulo no existe (ADR-102). */
  habilitado: boolean;
  contactos: ContactoCirculo[];
  avisos: AvisoCercania[];
  permiso: PermisoNotificacion;
  listo: boolean;
  agregarContacto: (datos: NuevoContacto) => void;
  eliminarContacto: (id: string) => void;
  alternarCompartir: (id: string) => void;
  cambiarRadio: (id: string, radioM: number) => void;
  descartarAviso: (clave: string) => void;
  solicitarPermiso: () => Promise<void>;
  reiniciarCirculo: () => void;
}

const Contexto = createContext<EstadoCirculo | null>(null);

/** Punto de partida para un contacto nuevo: alrededor del centro de Lima. */
const CENTRO_LIMA: Coordenada = { lat: -12.05, lng: -77.03 };

function permisoActual(): PermisoNotificacion {
  if (typeof window === "undefined" || !("Notification" in window)) return "no_soportado";
  return Notification.permission;
}

export function CirculoProvider({ children }: { children: ReactNode }) {
  const { reportes, cuenta } = useApp();
  const habilitado = cuenta !== null;

  const [contactos, setContactos] = useState<ContactoCirculo[]>([]);
  const [avisos, setAvisos] = useState<AvisoCercania[]>([]);
  const [permiso, setPermiso] = useState<PermisoNotificacion>("default");
  const [listo, setListo] = useState(false);

  /** Punto alrededor del cual vagabundea cada contacto. No se persiste: se recalcula. */
  const bases = useRef<Map<string, Coordenada>>(new Map());
  const avisados = useRef<Set<string>>(new Set());

  const registrarBase = useCallback((id: string, base: Coordenada) => {
    bases.current.set(id, base);
  }, []);

  // Arranque: contactos guardados o los sembrados de demo. Solo con sesion iniciada.
  useEffect(() => {
    if (!habilitado) {
      setContactos([]);
      setAvisos([]);
      setListo(false);
      return;
    }

    const ahora = Date.now();
    const guardados = cargarContactos();
    const iniciales = guardados ?? contactosSembrados(ahora);

    for (const { id, base } of BASES_DEMO) registrarBase(id, base);
    // Un contacto agregado a mano conserva su ultima posicion como punto base.
    for (const c of iniciales) {
      if (!bases.current.has(c.id) && c.coordenada) registrarBase(c.id, c.coordenada);
    }

    avisados.current = cargarAvisados();
    setContactos(iniciales);
    setPermiso(permisoActual());
    setListo(true);
    if (!guardados) guardarContactos(iniciales);
  }, [habilitado, registrarBase]);

  // Latido: mueve a quien esta compartiendo. Es lo unico simulado de la funcionalidad.
  useEffect(() => {
    if (!listo || !habilitado) return;

    const latir = () => {
      setContactos((previos) => {
        const movidos = moverContactos(previos, bases.current, Date.now());
        guardarContactos(movidos);
        return movidos;
      });
    };

    const id = window.setInterval(latir, INTERVALO_SIMULACION_MS);
    return () => window.clearInterval(id);
  }, [habilitado, listo]);

  // Evaluacion de cercania: corre con cada latido y con cada reporte nuevo.
  useEffect(() => {
    if (!listo || !habilitado || contactos.length === 0) return;

    const nuevos = evaluarAvisos(contactos, reportes, Date.now(), avisados.current);
    if (nuevos.length === 0) return;

    for (const aviso of nuevos) avisados.current.add(aviso.clave);
    guardarAvisados(avisados.current);
    setAvisos((previos) => [...nuevos, ...previos].slice(0, 20));

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        for (const aviso of nuevos) {
          const categoria = obtenerCategoria(aviso.categoria);
          new Notification(`Reporte cerca de ${aviso.contactoNombre}`, {
            body: `${categoria.nombre} a ${aviso.distanciaM} m · ${aviso.zonaNombre}`,
            icon: "/icono.svg",
            // Reemplaza la notificacion anterior del mismo contacto en vez de apilarlas.
            tag: `circulo-${aviso.contactoId}`,
          });
        }
      }
    }
  }, [contactos, habilitado, listo, reportes]);

  const persistir = useCallback((siguiente: ContactoCirculo[]) => {
    setContactos(siguiente);
    guardarContactos(siguiente);
  }, []);

  const agregarContacto = useCallback<EstadoCirculo["agregarContacto"]>(
    (datos) => {
      const id = `c-${Date.now().toString(36)}`;
      // El punto base se dispersa de forma determinista para que dos contactos
      // nuevos no queden exactamente encima uno del otro en el mapa.
      const semilla = semillaDeTexto(id);
      registrarBase(id, {
        lat: CENTRO_LIMA.lat + (semilla - 0.5) * 0.08,
        lng: CENTRO_LIMA.lng + (semilla - 0.5) * 0.06,
      });

      const nuevo: ContactoCirculo = {
        id,
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        relacion: datos.relacion.trim() || "Contacto",
        alias: "sin vincular",
        // Compartir es decision del contacto, no tuya: nace como invitacion pendiente.
        compartiendo: false,
        coordenada: null,
        actualizadoEn: 0,
        radioAvisoM: datos.radioAvisoM || RADIO_AVISO_POR_DEFECTO_M,
      };

      persistir([...contactos, nuevo]);
    },
    [contactos, persistir, registrarBase],
  );

  const eliminarContacto = useCallback<EstadoCirculo["eliminarContacto"]>(
    (id) => {
      bases.current.delete(id);
      persistir(contactos.filter((c) => c.id !== id));
    },
    [contactos, persistir],
  );

  const alternarCompartir = useCallback<EstadoCirculo["alternarCompartir"]>(
    (id) => {
      const ahora = Date.now();
      persistir(
        contactos.map((c) => {
          if (c.id !== id) return c;
          const activando = !c.compartiendo;
          if (!activando) return { ...c, compartiendo: false };

          const base = bases.current.get(id) ?? CENTRO_LIMA;
          return {
            ...c,
            compartiendo: true,
            coordenada: posicionSimulada(base, semillaDeTexto(id), ahora),
            actualizadoEn: ahora,
          };
        }),
      );
    },
    [contactos, persistir],
  );

  const cambiarRadio = useCallback<EstadoCirculo["cambiarRadio"]>(
    (id, radioM) => {
      persistir(contactos.map((c) => (c.id === id ? { ...c, radioAvisoM: radioM } : c)));
    },
    [contactos, persistir],
  );

  const descartarAviso = useCallback<EstadoCirculo["descartarAviso"]>((clave) => {
    setAvisos((previos) => previos.filter((a) => a.clave !== clave));
  }, []);

  const solicitarPermiso = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermiso("no_soportado");
      return;
    }
    setPermiso(await Notification.requestPermission());
  }, []);

  const reiniciarCirculo = useCallback(() => {
    const ahora = Date.now();
    limpiarCirculo();
    avisados.current = new Set();
    bases.current = new Map(BASES_DEMO.map(({ id, base }) => [id, base]));
    setAvisos([]);
    persistir(contactosSembrados(ahora));
  }, [persistir]);

  const valor = useMemo<EstadoCirculo>(
    () => ({
      habilitado,
      contactos,
      avisos,
      permiso,
      listo,
      agregarContacto,
      eliminarContacto,
      alternarCompartir,
      cambiarRadio,
      descartarAviso,
      solicitarPermiso,
      reiniciarCirculo,
    }),
    [
      agregarContacto,
      alternarCompartir,
      avisos,
      cambiarRadio,
      contactos,
      descartarAviso,
      eliminarContacto,
      habilitado,
      listo,
      permiso,
      reiniciarCirculo,
      solicitarPermiso,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCirculo(): EstadoCirculo {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useCirculo debe usarse dentro de <CirculoProvider>");
  return ctx;
}
