/**
 * Regla de control de acceso (ADR-043, amend de ADR-035): que rutas exigen una cuenta.
 *
 * Sin sesion, la experiencia es la vitrina: Inicio cuenta la historia del proyecto,
 * el Mapa muestra los incidentes con sus filtros y la landing explica el porque. Todo
 * lo demas — reportar, el circulo, la cuenta y la arquitectura — pide entrar con Google.
 *
 * Ojo: la puerta (PuertaAcceso) deja pasar TODO cuando el despliegue no tiene
 * credenciales de Google configuradas, para que una beta sin variables de entorno no
 * quede inaccesible. Esta lista solo manda cuando el login existe.
 *
 * Funcion pura para que un cambio en la lista de rutas protegidas no dependa de leer con
 * cuidado un componente de React — un test la fija.
 */
export const RUTAS_PROTEGIDAS = ["/reportar", "/circulo", "/cuenta", "/arquitectura"] as const;

export function rutaRequiereSesion(pathname: string): boolean {
  return RUTAS_PROTEGIDAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}
