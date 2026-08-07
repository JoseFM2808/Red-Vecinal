import { MapaReportes } from "@/components/mapa/MapaReportes";
import { Encabezado } from "@/components/ui/Encabezado";
import { IndicadorRed } from "@/components/ui/IndicadorRed";

export default function PaginaMapa() {
  return (
    <div>
      <Encabezado
        titulo="Mapa vecinal"
        bajada="Lo que esta pasando cerca, por categoria. Toca un reporte para ver su prueba en cadena."
        accion={<IndicadorRed />}
      />
      <MapaReportes />
    </div>
  );
}
