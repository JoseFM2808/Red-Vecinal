/**
 * Marca de "ya vio la bienvenida", compartida entre la pantalla y el panel de Cuenta.
 *
 * Vive aparte para que el boton de "volver a verla" no tenga que importar el componente
 * ni duplicar la clave, que es como se desincronizan estas cosas.
 */

const CLAVE = "vecino-seguro:bienvenida:v1";

export function bienvenidaYaVista(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CLAVE) === "1";
  } catch {
    // Modo privado sin almacenamiento: no se insiste con la bienvenida.
    return true;
  }
}

export function marcarBienvenidaVista(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, "1");
  } catch {
    // sin almacenamiento: reaparecera la proxima vez, no es grave
  }
}

export function reiniciarBienvenida(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    // nada que limpiar
  }
}
