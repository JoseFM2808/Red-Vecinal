import { PanelArquitectura } from "@/components/arquitectura/PanelArquitectura";
import { Encabezado } from "@/components/ui/Encabezado";
import { IndicadorRed } from "@/components/ui/IndicadorRed";

export const metadata = {
  // El layout raiz aplica la plantilla "%s · Vecino Seguro".
  title: "Arquitectura",
  description:
    "Como esta construido Vecino Seguro: capas, flujo de un reporte, contratos en Arbitrum, bitacora de decisiones y limites declarados de la beta.",
};

export default function PaginaArquitectura() {
  return (
    <div>
      <Encabezado
        titulo="Arquitectura"
        bajada="Como esta construido esto, que funciona de verdad y que todavia no. Todo sale de los mismos archivos que generan la documentacion del repositorio."
        accion={<IndicadorRed />}
      />
      <PanelArquitectura />
    </div>
  );
}
