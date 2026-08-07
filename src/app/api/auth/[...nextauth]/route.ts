import { handlers } from "@/auth";

/**
 * Rutas de NextAuth: /api/auth/signin, /callback, /session, /signout.
 * Siempre montadas; si no hay credenciales de Google, simplemente no hay
 * proveedor con el que entrar y /api/auth/session responde vacio.
 */
export const { GET, POST } = handlers;
