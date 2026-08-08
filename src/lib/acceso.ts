/**
 * Regla de control de acceso (ADR-035, amend ADR-027): que rutas exigen una cuenta real.
 *
 * Navegar la app (Inicio, Mapa, Arquitectura, Cuenta) es libre. Reportar y Circulo si exigen
 * sesion: son las dos acciones que necesitan una identidad real detras (la prueba de que
 * "quien reporto" es alguien a quien se le puede pedir revelacion bajo orden judicial, y los
 * contactos guardados de Circulo, ADR-102).
 *
 * Funcion pura para que un cambio en la lista de rutas protegidas no dependa de leer con
 * cuidado un componente de React — un test la fija.
 */
export const RUTAS_PROTEGIDAS = ["/reportar", "/circulo"] as const;

export function rutaRequiereSesion(pathname: string): boolean {
  return RUTAS_PROTEGIDAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}
