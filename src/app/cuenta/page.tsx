import { PanelCuenta } from "@/components/cuenta/PanelCuenta";
import { Encabezado } from "@/components/ui/Encabezado";
import { IndicadorRed } from "@/components/ui/IndicadorRed";

export default function PaginaCuenta() {
  return (
    <div>
      <Encabezado
        titulo="Tu cuenta"
        bajada="Alias, recompensas y el mecanismo que protege tu identidad."
        accion={<IndicadorRed />}
      />
      <PanelCuenta />
    </div>
  );
}
