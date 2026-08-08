"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUbicacion } from "@/components/proveedores/UbicacionProvider";
import { zonaIdDe } from "@/lib/geo";
import {
  construirMapaIntensidad,
  evaluarAlerta,
  type IdIntensidad,
  type RespuestaIntensidad,
  type ResultadoAlerta,
  type SismoOficial,
} from "@/lib/sismos-oficiales";
import { cargarRespuestas, guardarRespuesta } from "@/lib/sismos-repositorio";
import { nombreDeZona } from "@/lib/zonas";

/**
 * Sismos oficiales del IGP mas las respuestas de intensidad del vecino (ADR-042).
 *
 * Consulta /api/sismos, que hace de puente con el IGP (ver esa ruta para el por que).
 * Refresca cada 2 minutos: el IGP tarda minutos en publicar, pedirlo mas seguido no
 * adelanta nada y castiga a un servicio publico.
 */

const INTERVALO_REFRESCO_MS = 2 * 60 * 1000;

interface RespuestaApi {
  sismos: SismoOficial[];
  consultadoEn: number;
  degradado: boolean;
}

export interface SismoConContexto {
  sismo: SismoOficial;
  alerta: ResultadoAlerta;
  /** Como dijo el vecino que lo sintio, si respondio. */
  miIntensidad: IdIntensidad | null;
}

export function useSismosOficiales() {
  const { coordenada } = useUbicacion();
  const [sismos, setSismos] = useState<SismoOficial[]>([]);
  const [respuestas, setRespuestas] = useState<RespuestaIntensidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [degradado, setDegradado] = useState(false);
  /**
   * Se fija al montar y NO se actualiza con cada render: si `ahora` cambiara sin parar,
   * la lista se reordenaria sola y las alertas parpadearian. Se refresca con los datos.
   */
  const [ahora, setAhora] = useState<number>(() => Date.now());

  useEffect(() => {
    setRespuestas(cargarRespuestas());
  }, []);

  useEffect(() => {
    let vigente = true;

    const consultar = async () => {
      try {
        const r = await fetch("/api/sismos");
        if (!r.ok) throw new Error(`HTTP ${r.status.toString()}`);
        const datos = (await r.json()) as RespuestaApi;
        if (!vigente) return;
        setSismos(datos.sismos);
        setDegradado(datos.degradado);
        setAhora(Date.now());
      } catch (error) {
        if (!vigente) return;
        // Sin datos del IGP la app sigue: se marca degradado y la interfaz lo dice.
        setDegradado(true);
        console.warn("[vecino-seguro] no se pudieron cargar los sismos oficiales", error);
      } finally {
        if (vigente) setCargando(false);
      }
    };

    void consultar();
    const id = setInterval(() => void consultar(), INTERVALO_REFRESCO_MS);

    return () => {
      vigente = false;
      clearInterval(id);
    };
  }, []);

  const responder = useCallback(
    (sismoId: string, intensidad: IdIntensidad) => {
      // Sin ubicacion la respuesta no sirve para el mapa: no se sabe de que zona es.
      const zona = coordenada
        ? { zonaId: zonaIdDe(coordenada), zonaNombre: nombreDeZona(coordenada) }
        : { zonaId: "sin-zona", zonaNombre: "Zona no identificada" };

      setRespuestas(
        guardarRespuesta({
          sismoId,
          intensidad,
          zonaId: zona.zonaId,
          zonaNombre: zona.zonaNombre,
          respondidoEn: Date.now(),
        }),
      );
    },
    [coordenada],
  );

  const conContexto = useMemo<SismoConContexto[]>(
    () =>
      sismos.map((sismo) => ({
        sismo,
        alerta: evaluarAlerta(sismo, coordenada, ahora),
        miIntensidad: respuestas.find((r) => r.sismoId === sismo.id)?.intensidad ?? null,
      })),
    [sismos, coordenada, ahora, respuestas],
  );

  /** El sismo que merece sonar ahora mismo: el mas reciente que cumple la politica. */
  const alertaActiva = useMemo(
    () => conContexto.find((s) => s.alerta.alertar) ?? null,
    [conContexto],
  );

  const mapaDe = useCallback(
    (sismoId: string) => construirMapaIntensidad(sismoId, respuestas),
    [respuestas],
  );

  return { sismos: conContexto, alertaActiva, cargando, degradado, responder, mapaDe, ahora };
}
