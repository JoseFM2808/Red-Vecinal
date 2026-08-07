/**
 * Estado de configuracion del login. Se lee en el servidor y se pasa a la interfaz
 * como un booleano: las credenciales de Google nunca cruzan al navegador.
 *
 * La app tiene que seguir funcionando sin login. Si no hay credenciales, el boton
 * no se muestra y todo el mundo sigue usando su seudonimo local — que es el
 * comportamiento por defecto del producto, no un modo degradado.
 */

export function googleConfigurado(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/**
 * NextAuth necesita un secreto para firmar la cookie de sesion. Si no hay login
 * configurado no puede existir ninguna sesion, asi que se usa un valor de relleno
 * para que /api/auth/session responda 200 vacio en vez de reventar con un 500.
 *
 * Cuando SI hay login, AUTH_SECRET es obligatorio y `npm run preflight` aborta el
 * build si falta: firmar sesiones reales con un secreto conocido seria un agujero.
 */
export function secretoAuth(): string | undefined {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  return googleConfigurado() ? undefined : "vecino-seguro-sin-login-configurado";
}
