"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { obtenerCategoria } from "@/lib/categorias";
import type { Coordenada, Reporte } from "@/lib/tipos";

/**
 * Mapa con Leaflet + OpenStreetMap (ADR-004): sin API key, para que la demo no
 * dependa de un token que puede faltar en Vercel el dia del pitch.
 *
 * Este modulo solo se carga en el navegador (import dinamico con ssr: false en
 * MapaReportes), por eso puede importar `leaflet` en el nivel superior.
 */

/** Contacto del circulo dibujado en el mapa (rama Lab_Dai). */
export interface ContactoEnMapa {
  id: string;
  nombre: string;
  coordenada: Coordenada;
  /** Hay un reporte reciente dentro de su radio de aviso. */
  enRiesgo: boolean;
  radioAvisoM: number;
}

interface Props {
  reportes: Reporte[];
  centro: Coordenada;
  zoom: number;
  seleccionado: string | null;
  posicionUsuario: Coordenada | null;
  contactos?: ContactoEnMapa[];
  /** Radio de incertidumbre del GPS, para dibujarlo en vez de fingir precision. */
  precisionUsuarioM?: number | null;
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

/** Contacto del circulo: inicial dentro de un disco, rojo si tiene un reporte cerca. */
function iconoContacto(nombre: string, enRiesgo: boolean): L.DivIcon {
  const color = enRiesgo ? "#ff5c5c" : "#2fe6a8";
  const inicial = nombre.slice(0, 1).toUpperCase();
  return L.divIcon({
    className: "",
    html: `<div class="marcador-contacto${enRiesgo ? " marcador-contacto-alerta" : ""}" style="--color-contacto:${color}">${inicial}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** Sigue al reporte seleccionado sin recrear el mapa. */
function Seguir({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.6 });
  }, [lat, lng, map, zoom]);
  return null;
}

export default function MapaLeaflet({
  reportes,
  centro,
  zoom,
  seleccionado,
  posicionUsuario,
  contactos,
  precisionUsuarioM,
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

      <Seguir lat={centro.lat} lng={centro.lng} zoom={zoom} />

      {marcadores.map(({ reporte, icono }) => (
        <Marker
          key={reporte.id}
          position={[reporte.coordenada.lat, reporte.coordenada.lng]}
          icon={icono}
          eventHandlers={{ click: () => onSeleccionar(reporte.id) }}
        />
      ))}

      {/* Circulo de cuidado: el radio de aviso se dibuja para que se entienda de un vistazo. */}
      {(contactos ?? []).map((contacto) => (
        <Circle
          key={`radio-${contacto.id}`}
          center={[contacto.coordenada.lat, contacto.coordenada.lng]}
          radius={contacto.radioAvisoM}
          pathOptions={{
            color: contacto.enRiesgo ? "#ff5c5c" : "#2fe6a8",
            weight: 1,
            opacity: 0.45,
            fillOpacity: 0.06,
          }}
        />
      ))}

      {(contactos ?? []).map((contacto) => (
        <Marker
          key={contacto.id}
          position={[contacto.coordenada.lat, contacto.coordenada.lng]}
          icon={iconoContacto(contacto.nombre, contacto.enRiesgo)}
          zIndexOffset={500}
        >
          <Tooltip direction="top" offset={[0, -16]}>
            {contacto.nombre}
          </Tooltip>
        </Marker>
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
