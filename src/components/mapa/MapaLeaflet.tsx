"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { obtenerCategoria } from "@/lib/categorias";
import type { Coordenada, Reporte } from "@/lib/tipos";

/**
 * Mapa con Leaflet + OpenStreetMap (ADR-004): sin API key, para que la demo no
 * dependa de un token que puede faltar en Vercel el dia del pitch.
 *
 * Este modulo solo se carga en el navegador (import dinamico con ssr: false en
 * MapaReportes), por eso puede importar `leaflet` en el nivel superior.
 */

interface Props {
  reportes: Reporte[];
  centro: Coordenada;
  zoom: number;
  seleccionado: string | null;
  posicionUsuario: Coordenada | null;
  /** Radio de incertidumbre del GPS, para dibujarlo en vez de fingir precision. */
  precisionUsuarioM?: number | null;
  /** Cambia para forzar un nuevo vuelo aunque el destino sea el mismo. */
  intento: number;
  onMover: (centro: Coordenada, zoom: number) => void;
  onSeleccionar: (id: string) => void;
}

function iconoReporte(color: string, activo: boolean): L.DivIcon {
  const escala = activo ? 1.45 : 1;
  return L.divIcon({
    className: "marcador-reporte",
    html: `<span style="color:${color};background:${color};transform:scale(${escala})"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const ICONO_USUARIO = L.divIcon({
  className: "",
  html: '<div class="pulso-yo"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/**
 * Avisa a Leaflet cuando su contenedor cambia de tamano.
 *
 * Leaflet calcula el tamano del mapa UNA vez, al montarse, y no vuelve a mirarlo. Si el
 * contenedor cambia despues, sigue pintando teselas para el tamano viejo y aparece una
 * banda gris en el borde. Pasa mas de lo que parece:
 *
 *   - al rotar el telefono
 *   - al redimensionar la ventana en escritorio
 *   - y sobre todo al hacer scroll en un movil: la barra de direcciones se oculta, cambia
 *     el valor de dvh y con el la altura del contenedor, que es h-[46dvh]
 *
 * Medido antes de este arreglo: contenedor de 512 px con teselas cubriendo solo hasta 457.
 */
function AjustarTamano() {
  const map = useMap();

  useEffect(() => {
    const contenedor = map.getContainer();
    if (typeof ResizeObserver === "undefined") return;

    const observador = new ResizeObserver(() => {
      // Sin animacion: es una correccion, no un movimiento que el usuario deba ver.
      map.invalidateSize({ animate: false });
    });
    observador.observe(contenedor);

    return () => observador.disconnect();
  }, [map]);

  return null;
}

/**
 * Avisa hacia arriba de donde dejo el usuario el mapa.
 *
 * Sin esto, arrastrar el mapa no se recuerda en ningun sitio: al cerrar la hoja de un
 * reporte o al cambiar de filtro, el encuadre volaba de vuelta al punto calculado y se
 * perdia lo que la persona estaba mirando.
 *
 * No hay bucle: tras un flyTo programatico esto guarda exactamente el mismo centro y
 * zoom al que se acaba de volar, asi que las dependencias del efecto de `Seguir` no
 * cambian y no se vuelve a volar.
 */
function Encuadre({
  onMover,
}: {
  onMover: (centro: Coordenada, zoom: number) => void;
}) {
  const map = useMapEvents({
    dragend: () => {
      const c = map.getCenter();
      onMover({ lat: c.lat, lng: c.lng }, map.getZoom());
    },
    zoomend: () => {
      const c = map.getCenter();
      onMover({ lat: c.lat, lng: c.lng }, map.getZoom());
    },
  });
  return null;
}

/**
 * Sigue al reporte seleccionado sin recrear el mapa.
 *
 * `intento` permite forzar el vuelo aunque las coordenadas sean identicas: el boton de
 * "centrar en mi ubicacion" pasaba la misma referencia y a partir del segundo toque no
 * pasaba nada.
 */
function Seguir({
  lat,
  lng,
  zoom,
  intento,
}: {
  lat: number;
  lng: number;
  zoom: number;
  intento: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.6 });
  }, [intento, lat, lng, map, zoom]);
  return null;
}

export default function MapaLeaflet({
  reportes,
  centro,
  zoom,
  seleccionado,
  posicionUsuario,
  precisionUsuarioM,
  intento,
  onMover,
  onSeleccionar,
}: Props) {
  const marcadores = useMemo(
    () =>
      reportes.map((reporte) => ({
        reporte,
        icono: iconoReporte(
          obtenerCategoria(reporte.categoria).color,
          reporte.id === seleccionado,
        ),
      })),
    [reportes, seleccionado],
  );

  return (
    <MapContainer
      center={[centro.lat, centro.lng]}
      zoom={zoom}
      zoomControl={false}
      scrollWheelZoom
      className="mapa-oscuro h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <AjustarTamano />
      <Encuadre onMover={onMover} />
      <Seguir lat={centro.lat} lng={centro.lng} zoom={zoom} intento={intento} />

      {marcadores.map(({ reporte, icono }) => (
        <Marker
          key={reporte.id}
          position={[reporte.coordenada.lat, reporte.coordenada.lng]}
          icon={icono}
          eventHandlers={{ click: () => onSeleccionar(reporte.id) }}
        />
      ))}

      {/* Circulo de precision: se dibuja el margen real del GPS en vez de fingir un punto exacto. */}
      {posicionUsuario && precisionUsuarioM && precisionUsuarioM > 30 ? (
        <Circle
          center={[posicionUsuario.lat, posicionUsuario.lng]}
          radius={precisionUsuarioM}
          pathOptions={{ color: "#62a8ff", weight: 1, opacity: 0.4, fillOpacity: 0.08 }}
        />
      ) : null}

      {posicionUsuario ? (
        <Marker
          position={[posicionUsuario.lat, posicionUsuario.lng]}
          icon={ICONO_USUARIO}
          zIndexOffset={1000}
        />
      ) : null}
    </MapContainer>
  );
}
