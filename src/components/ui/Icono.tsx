/**
 * Iconos como SVG en linea: cero dependencias y cero peticiones extra.
 * Trazo de 1.6 para que se lean bien en pantallas pequenas.
 */

export type NombreIcono =
  | "inicio"
  | "mapa"
  | "reportar"
  | "cuenta"
  | "arquitectura"
  | "alerta"
  | "foco"
  | "camara"
  | "ubicacion"
  | "escudo"
  | "cadena"
  | "reloj"
  | "check"
  | "cerrar"
  | "enlace"
  | "candado"
  | "personas"
  | "megafono"
  | "flecha";

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  inicio: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" />,
  mapa: (
    <>
      <path d="m9 4-6 2.5v13.5L9 17.5m0-13.5 6 2.5m-6-2.5v13.5m6-11v13.5m0-13.5 6-2.5v13.5L15 20" />
    </>
  ),
  reportar: (
    <>
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
      <path d="M10.3 3.9 2.6 17.4a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  cuenta: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  arquitectura: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 8.5v4" />
      <path d="M12 16h.01" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  foco: (
    <>
      <path d="M9 17h6M10 20.5h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </>
  ),
  camara: (
    <>
      <path d="M3 8.5A2 2 0 0 1 5 6.5h2l1.2-2h7.6l1.2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3 5 6v6c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6Z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </>
  ),
  cadena: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 1 0 11 18.7l1.5-1.5" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  cerrar: <path d="m6 6 12 12M18 6 6 18" />,
  enlace: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10.5 13.5" />
      <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5" />
    </>
  ),
  candado: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  personas: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.5A6 6 0 0 1 21 20" />
    </>
  ),
  megafono: (
    <>
      <path d="M4 10.5v3a1.5 1.5 0 0 0 1.5 1.5H8l7 4.5V6L8 10.5H5.5A1.5 1.5 0 0 0 4 12Z" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" />
    </>
  ),
  flecha: <path d="M5 12h13m-5-5.5L18.5 12 13 17.5" />,
};

export function Icono({
  nombre,
  className = "h-5 w-5",
}: {
  nombre: NombreIcono;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
