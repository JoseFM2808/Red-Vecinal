import type { ReactNode } from "react";

/** Cabecera de pantalla. Titulo corto arriba, contexto abajo. */
export function Encabezado({
  titulo,
  bajada,
  accion,
}: {
  titulo: string;
  bajada?: string;
  accion?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-5">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-texto">{titulo}</h1>
        {bajada ? <p className="mt-1 text-sm leading-snug text-suave">{bajada}</p> : null}
      </div>
      {accion}
    </header>
  );
}
