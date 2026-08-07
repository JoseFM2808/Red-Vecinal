import { obtenerAdaptadorDeCadena } from "./chain";
import { truncarCoordenada, zonaIdDe } from "./geo";
import { calcularContentHash } from "./hash";
import { recompensaTrasCorroborar } from "./antisybil";
import type { Coordenada, IdCategoria, Reporte } from "./tipos";
import { nombreDeZona } from "./zonas";

/**
 * Datos sembrados para que la red se vea viva desde el primer arranque.
 *
 * Son ficticios y estan marcados con `esSemilla: true`: la app los muestra como
 * "red simulada" y se pueden borrar desde Cuenta. Estan puestos en los distritos
 * que docs/PROYECTO.md identifica con menor cobertura de serenazgo, porque el mapa
 * tiene que contar la misma historia que el pitch.
 *
 * Los dos primeros son a proposito el mismo hecho visto por dos vecinos distintos
 * a 120 m y 6 minutos de diferencia: es la corroboracion que activa el multiplicador.
 */

interface Semilla {
  categoria: IdCategoria;
  descripcion: string;
  coordenada: Coordenada;
  minutosAtras: number;
  autorSeudonimo: string;
  autorDireccion: string;
  corroboradaPor?: string[];
  escalada?: boolean;
}

const SEMILLAS: readonly Semilla[] = [
  // --- Sismo sentido: cuatro vecinos de distritos distintos en 8 minutos. -----------
  // Es el evento que enciende el panel comunitario "lo sentiste" (src/lib/sismos.ts).
  // Estan a menos de 30 minutos a proposito; si pasa mas tiempo el panel se apaga solo,
  // que es el comportamiento correcto. Antes de presentar: Cuenta > Reiniciar datos.
  {
    categoria: "sismo_sentido",
    descripcion: "Moderado: se movieron las cosas. Se escucho crujir la estructura.",
    coordenada: { lat: -11.9748, lng: -76.9968 },
    minutosAtras: 4,
    autorSeudonimo: "vecina-4410",
    autorDireccion: "0xc41d09a7e3b5824f16db09e4a752c8031f6b9e47",
  },
  {
    categoria: "sismo_sentido",
    descripcion: "Fuerte: dificil mantenerse en pie, se cayo un cuadro.",
    coordenada: { lat: -12.0451, lng: -77.0402 },
    minutosAtras: 6,
    autorSeudonimo: "vecino-9037",
    autorDireccion: "0x5b0e83f1a94c27d6083be51749fa2c60d38e7b19",
  },
  {
    categoria: "sismo_sentido",
    descripcion: "Moderado: se balancearon las lamparas.",
    coordenada: { lat: -12.1596, lng: -76.9712 },
    minutosAtras: 7,
    autorSeudonimo: "vecina-1725",
    autorDireccion: "0xe80a4c25b7139df6042ba8e51370c9f4a26d8b03",
  },
  {
    categoria: "sismo_sentido",
    descripcion: "Leve: apenas se sintio, pero se movio el agua del bidon.",
    coordenada: { lat: -11.9518, lng: -77.0601 },
    minutosAtras: 9,
    autorSeudonimo: "vecino-6284",
    autorDireccion: "0x1f7c60b3ae925d84013fc7e6a4820d59b3ef14a7",
  },
  // --- Seguridad e infraestructura --------------------------------------------------
  {
    categoria: "actividad_sospechosa",
    descripcion: "Dos personas en moto dando vueltas a la cuadra desde hace media hora.",
    coordenada: { lat: -11.9762, lng: -76.9941 },
    minutosAtras: 12,
    autorSeudonimo: "vecino-3117",
    autorDireccion: "0x7f3a19c4d2be51a8036fbc9e4471d2a8c5e60b41",
    corroboradaPor: ["0x22b8c7e1f9043ad65c1e88b2703f4a19de5c7f80"],
  },
  {
    categoria: "actividad_sospechosa",
    descripcion: "Confirmo la moto sin placa, ahora parada frente al parque.",
    coordenada: { lat: -11.9772, lng: -76.9936 },
    minutosAtras: 18,
    autorSeudonimo: "vecina-8842",
    autorDireccion: "0x22b8c7e1f9043ad65c1e88b2703f4a19de5c7f80",
    corroboradaPor: ["0x7f3a19c4d2be51a8036fbc9e4471d2a8c5e60b41"],
  },
  {
    categoria: "infraestructura",
    descripcion: "Poste sin luz hace tres noches. La esquina queda completamente oscura.",
    coordenada: { lat: -11.9503, lng: -77.0634 },
    minutosAtras: 95,
    autorSeudonimo: "vecino-0459",
    autorDireccion: "0x9d41ba07e6c2385fa17b0e94cc23d158a7e4f602",
  },
  {
    categoria: "actividad_sospechosa",
    descripcion: "Arrebato de celular en el paradero. La victima esta bien.",
    coordenada: { lat: -12.2118, lng: -76.9382 },
    minutosAtras: 140,
    autorSeudonimo: "vecina-6620",
    autorDireccion: "0x4c9e37a15d8b26f0913ec7a54028bd6f19c3e775",
    escalada: true,
  },
  {
    categoria: "infraestructura",
    descripcion: "Buzon abierto en plena vereda, sin senalizacion.",
    coordenada: { lat: -12.0431, lng: -76.9973 },
    minutosAtras: 220,
    autorSeudonimo: "vecino-1284",
    autorDireccion: "0xb15c8f2e04a7d3691fc5820ae67d419b3a8e0cd2",
  },
  {
    categoria: "actividad_sospechosa",
    descripcion: "Vehiculo con lunas polarizadas estacionado frente al colegio a la hora de salida.",
    coordenada: { lat: -12.1573, lng: -76.9688 },
    minutosAtras: 310,
    autorSeudonimo: "vecina-7031",
    autorDireccion: "0x6ea2941c73f80b5d2ac4187e93f06b2154da8e39",
  },
  {
    categoria: "infraestructura",
    descripcion: "Cable de alta tension colgando sobre la pista despues del viento de anoche.",
    coordenada: { lat: -12.0098, lng: -77.0864 },
    minutosAtras: 430,
    autorSeudonimo: "vecino-5573",
    autorDireccion: "0x03fd6b8a2e14c790d5b28af61034e7c9182b45de",
    escalada: true,
  },
  {
    categoria: "actividad_sospechosa",
    descripcion: "Grupo forzando la reja de una casa deshabitada en el pasaje.",
    coordenada: { lat: -11.8988, lng: -77.0347 },
    minutosAtras: 620,
    autorSeudonimo: "vecina-2298",
    autorDireccion: "0xa7418e05cb2d936f1e0a58c7b249d306fe81527c",
  },
];

const folioDemo = (indice: number) => `VS-DEMO-${(1000 + indice).toString()}`;

/** Construye los reportes sembrados. Async porque el hash es el real, no uno inventado. */
export async function construirReportesSembrados(ahora: number): Promise<Reporte[]> {
  const cadena = obtenerAdaptadorDeCadena();

  const reportes = await Promise.all(
    SEMILLAS.map(async (semilla, indice): Promise<Reporte> => {
      const creadoEn = ahora - semilla.minutosAtras * 60_000;
      const coordenada = truncarCoordenada(semilla.coordenada);
      const corroboraciones = semilla.corroboradaPor ?? [];

      const contentHash = await calcularContentHash({
        cid: null,
        coordenada,
        categoria: semilla.categoria,
        creadoEnSegundos: Math.floor(creadoEn / 1000),
        autor: semilla.autorDireccion,
      });

      const recibo = {
        txHash: `0x${contentHash.slice(2).split("").reverse().join("")}`,
        bloque: 90_000_000 + indice * 137,
        chainId: cadena.red.chainId,
        urlExplorador: `${cadena.red.explorador}/tx/0x${contentHash.slice(2, 66)}`,
        costoGasUsd: cadena.red.esTestnet ? 0 : cadena.red.costoAnclajeUsd,
        confirmadoEn: creadoEn + 2000,
        simulado: true,
      };

      return {
        id: `semilla-${indice}`,
        categoria: semilla.categoria,
        descripcion: semilla.descripcion,
        coordenada,
        zonaId: zonaIdDe(coordenada),
        zonaNombre: nombreDeZona(coordenada),
        creadoEn,
        autorSeudonimo: semilla.autorSeudonimo,
        autorDireccion: semilla.autorDireccion,
        contentHash,
        evidencia: null,
        cadena: recibo,
        estadoAnclaje: "anclado",
        recompensa: recompensaTrasCorroborar(corroboraciones.length),
        corroboraciones,
        escalamiento: semilla.escalada
          ? {
              folio: folioDemo(indice),
              destino: "serenazgo",
              creadoEn: creadoEn + 60_000,
              simulado: true,
              mensaje: "Aviso enviado al canal municipal (simulado).",
            }
          : null,
        esSemilla: true,
      };
    }),
  );

  return reportes.sort((a, b) => b.creadoEn - a.creadoEn);
}
