/** Utilidades de presentacion. Nada de logica de negocio aqui. */

export function tiempoRelativo(epoch: number, ahora: number = Date.now()): string {
  const segundos = Math.max(0, Math.round((ahora - epoch) / 1000));
  if (segundos < 60) return "hace un momento";

  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} dias`;
}

export function abreviarHash(hash: string, visibles = 6): string {
  if (hash.length <= visibles * 2 + 3) return hash;
  return `${hash.slice(0, visibles + 2)}…${hash.slice(-visibles)}`;
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatearUsd(monto: number): string {
  if (monto === 0) return "sin costo (testnet)";
  if (monto < 0.01) return `$${monto.toFixed(4)}`;
  return `$${monto.toFixed(2)}`;
}
