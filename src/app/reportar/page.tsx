import { Suspense } from "react";
import { FlujoReporte } from "@/components/reportar/FlujoReporte";
import { Encabezado } from "@/components/ui/Encabezado";

export default function PaginaReportar() {
  return (
    <div>
      <Encabezado
        titulo="Nuevo reporte"
        bajada="Tres pasos. La red te ve con tu alias, nunca con tu nombre."
      />
      {/*
        FlujoReporte lee ?categoria= para que "Yo tambien lo senti" del panel de sismos
        caiga directo en el paso 2. useSearchParams necesita esta frontera para que la
        pagina siga siendo estatica en el build.
      */}
      <Suspense fallback={<p className="px-4 py-6 text-center text-sm text-tenue">Cargando…</p>}>
        <FlujoReporte />
      </Suspense>
    </div>
  );
}
