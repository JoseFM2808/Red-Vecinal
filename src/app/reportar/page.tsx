import { FlujoReporte } from "@/components/reportar/FlujoReporte";
import { Encabezado } from "@/components/ui/Encabezado";

export default function PaginaReportar() {
  return (
    <div>
      <Encabezado
        titulo="Nuevo reporte"
        bajada="Tres pasos. Sin registro, sin nombre, sin numero de telefono."
      />
      <FlujoReporte />
    </div>
  );
}
