/**
 * URL publica del despliegue.
 *
 * Vercel inyecta variables de sistema en el build; no hay que configurarlas a mano:
 *   VERCEL_PROJECT_PRODUCTION_URL -> dominio estable de produccion (el que queremos para Open Graph)
 *   VERCEL_URL                    -> dominio unico de ESTE deploy (cambia en cada preview)
 *
 * Se usa para `metadataBase`: sin ella, Next resuelve las imagenes de Open Graph contra
 * rutas relativas y las tarjetas de WhatsApp o Twitter salen sin imagen.
 *
 * Orden: dominio propio configurado a mano > produccion de Vercel > este deploy > local.
 */
export function urlBase(): URL {
  const propio = process.env.NEXT_PUBLIC_SITE_URL;
  if (propio) return new URL(propio);

  const produccion = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (produccion) return new URL(`https://${produccion}`);

  const deploy = process.env.VERCEL_URL;
  if (deploy) return new URL(`https://${deploy}`);

  return new URL("http://localhost:3000");
}
