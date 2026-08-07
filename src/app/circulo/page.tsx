import { PanelCirculo } from "@/components/circulo/PanelCirculo";
import { Encabezado } from "@/components/ui/Encabezado";

export const metadata = {
  title: "Circulo",
  description:
    "Recibe un aviso cuando ocurre un reporte cerca de alguien de tu familia que comparte su ubicacion contigo, con su telefono a un toque.",
};

export default function PaginaCirculo() {
  return (
    <div>
      <Encabezado
        titulo="Mi circulo"
        bajada="Si pasa algo cerca de alguien que te comparte su ubicacion, te avisamos y le llamas al toque."
      />
      <PanelCirculo />
    </div>
  );
}
