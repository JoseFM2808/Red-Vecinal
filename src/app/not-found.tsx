import Link from "next/link";
import { Icono } from "@/components/ui/Icono";

export default function NoEncontrado() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-superficie-alta text-tenue">
        <Icono nombre="mapa" className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-texto">Esta pagina no existe</h1>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-suave">
        El enlace esta roto o la pantalla se movio. Vuelve al inicio y sigue desde ahi.
      </p>
      <Link
        href="/"
        className="toque mt-6 flex items-center justify-center rounded-xl bg-superficie-alta px-6 text-sm font-medium text-texto"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
