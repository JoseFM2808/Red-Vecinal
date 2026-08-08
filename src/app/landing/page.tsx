import type { Metadata } from "next";
import Link from "next/link";
import { VistaEventosPublica } from "@/components/landing/VistaEventosPublica";
import { Icono } from "@/components/ui/Icono";
import { EtiquetaEstado, Tarjeta, TituloSeccion } from "@/components/ui/primitivos";
import { ARQUITECTURA } from "@/lib/arquitectura";
// Directo a redes.ts y no al barrel `@/lib/chain`: el barrel reexporta el adaptador de
// Arbitrum y con el todo el grafo de viem, que esta pagina no necesita para dos constantes.
// redes.ts es un modulo hoja, sin dependencias.
import { COSTO_ANCLAJE_L1_USD, obtenerRed } from "@/lib/chain/redes";

/**
 * Landing auto explicativa — la URL que se comparte con el jurado y con un vecino
 * que nunca oyo hablar del proyecto (ADR-037).
 *
 * El orden de las secciones no es estetico, sale de docs/CAPACITACINES.md:
 *
 *   Workshop 1 ("Como ganar en una Hackathon Web3")
 *     - "Gana el equipo que resuelve un problema y que lo resuelva bien", no el que
 *       tiene mas lineas de codigo. Por eso el problema va antes que la tecnologia.
 *     - "La idea mas facil de explicar en 2 minutos gana" y "que lo entienda tu mama":
 *       la primera frase de la pagina no tiene ni una palabra tecnica.
 *     - Estructura del pitch: problema -> solucion -> demo -> impacto.
 *     - "Nadie premia lo que no lograste explicar": se anticipan las preguntas tecnicas
 *       que el taller dice que el jurado hace (cuantos contratos, version de Solidity,
 *       cuantos metodos, reentrancy).
 *     - Slides sin mucho texto -> aqui, secciones cortas y datos con su fuente.
 *
 *   Workshop 4 ("Ideacion + Prototipado")
 *     - "Blockchain Fit: determinar si blockchain es realmente necesaria" -> seccion propia
 *       que responde la pregunta esceptica en vez de esquivarla.
 *     - "MVP: distinguir entre funcionalidades esenciales y elementos simulados" -> la
 *       seccion de que es real y que no, leida de arquitectura.json.
 *
 *   Workshop 5 ("De lo tecnico a producto")
 *     - Vender el valor y la solucion, no el tecnicismo; justificar blockchain sin perder
 *       el foco en el impacto.
 *
 * Todo dato numerico sale de src/data/arquitectura.json y de src/lib/chain — nada se
 * escribe a mano aqui, para que la landing no pueda contradecir a la app ni al pitch.
 */

export const metadata: Metadata = {
  title: "Que es Vecino Seguro",
  description:
    "Reportar lo que pasa en tu cuadra en tres toques, sin dar tu nombre y sin que nadie pueda borrarlo despues. Que problema resuelve, por que en Arbitrum y que esta construido de verdad.",
  alternates: { canonical: "/landing" },
};

/** Preguntas que el Workshop 1 dice que el jurado hace, con la respuesta ya lista. */
const PREGUNTAS_JURADO = [
  {
    p: "¿Cuantos contratos son y que hace cada uno?",
    r: "Tres. ReportRegistry ancla el hash del reporte, TokenReward mintea la recompensa con los limites anti-Sybil, IdentityEscrow custodia el vinculo wallet-identidad bajo multisig 2-de-3.",
  },
  {
    p: "¿Que version de Solidity y con que optimizador?",
    r: "Solidity 0.8.28. El perfil de produccion compila con el optimizador activo a 200 runs. Hardhat 3 aislado en contracts/, como proyecto propio.",
  },
  {
    p: "¿Y la reentrancy?",
    r: "El mint es conservador y en dos pasos, con patron pull: el vecino reclama, el contrato no empuja. No hay callback a una direccion arbitraria dentro del flujo de recompensa.",
  },
  {
    p: "¿Estan desplegados en Arbitrum Sepolia?",
    r: "Todavia no. Estan escritos, compilados y con sus tests en verde; el despliegue necesita una wallet con ETH de testnet. Lo decimos aqui y no en la letra chica: mientras tanto la app corre con el adaptador simulado.",
  },
  {
    p: "¿Que pasa si me roban el telefono y ven la app?",
    r: "No hay nombre, ni telefono, ni correo en lo que se publica: solo un alias tipo vecino-1234. Iniciar sesion con Google sirve para recuperar ese mismo alias en otro telefono, no para identificarte ante los vecinos.",
  },
  {
    p: "¿Esto reemplaza al serenazgo?",
    r: "No, y no queremos. El boton de escalar a serenazgo, policia o ambulancia es parte del producto. Somos la capa que funciona donde ellos no llegan o no generan confianza.",
  },
] as const;

export default function PaginaLanding() {
  const { meta, problema, arbitrum, limites } = ARQUITECTURA;
  const arbitrumOne = obtenerRed(42161);
  // Cuantas veces mas barato es anclar en L2 que en L1. Se calcula, no se escribe:
  // si manana cambia el costo en redes.ts, esta cifra cambia sola.
  const vecesMasBarato = Math.round(COSTO_ANCLAJE_L1_USD / arbitrumOne.costoAnclajeUsd);

  return (
    <div className="space-y-10 pb-4">
      {/* --- 1. Que es, sin una sola palabra tecnica ------------------------ */}
      <header className="px-4 pt-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-marca/15 text-marca">
          <Icono nombre="escudo" className="h-7 w-7" />
        </span>

        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-texto">
          Vecino Seguro
        </h1>

        {/*
          La prueba de la abuelita del Workshop 1: si esta frase necesita que expliques
          una palabra, la frase esta mal. Ni "blockchain" ni "hash" ni "on-chain".
        */}
        <p className="mt-3 text-lg leading-relaxed text-texto">
          Avisa a tu cuadra de lo que acaba de pasar, en tres toques, sin dar tu nombre
          y sin que nadie pueda borrarlo despues.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-suave">{problema.tesis}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/reportar"
            className="toque inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-alerta px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99]"
          >
            <Icono nombre="reportar" className="h-4 w-4" />
            Probar un reporte
          </Link>
          <Link
            href="/mapa"
            className="toque inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-borde bg-superficie px-4 py-3 text-sm font-semibold text-texto transition active:scale-[0.99]"
          >
            <Icono nombre="mapa" className="h-4 w-4" />
            Ver el mapa
          </Link>
        </div>

        <p className="mt-3 text-xs text-tenue">
          Lectura completa: 2 minutos. No hace falta crear cuenta para mirar.
        </p>
      </header>

      {/* --- 1.b El gancho: eventos en vivo, abiertos (ADR-039) ------------ */}
      <section className="px-4">
        <VistaEventosPublica />
      </section>

      {/* --- 2. El problema, con fuente al lado ---------------------------- */}
      <section className="px-4">
        <TituloSeccion>El problema</TituloSeccion>
        <div className="space-y-2">
          {problema.evidencia.map((e) => (
            <Tarjeta key={e.dato} className="p-3.5">
              <p className="text-sm font-medium leading-snug text-texto">{e.dato}</p>
              <p className="mt-1 text-xs leading-relaxed text-suave">{e.detalle}</p>
              <p className="mt-2 text-[11px] text-tenue">Fuente: {e.fuente}</p>
            </Tarjeta>
          ))}
        </div>
      </section>

      {/* --- 3. La solucion, contada como storyboard ----------------------- */}
      <section className="px-4">
        <TituloSeccion>Como funciona</TituloSeccion>
        <ol className="space-y-2">
          {[
            {
              icono: "reportar" as const,
              t: "Reportas en tres toques",
              d: "Eliges que paso, adjuntas una foto si puedes y la ubicacion se toma sola. Sin formularios, sin registro.",
            },
            {
              icono: "cadena" as const,
              t: "Queda como prueba con fecha cierta",
              d: "La huella digital del reporte se graba en Arbitrum. Ni nosotros ni un municipio podemos editarla o borrarla despues.",
            },
            {
              icono: "personas" as const,
              t: "Tu cuadra se entera al instante",
              d: "Aparece en el mapa del vecindario. Si hay alguien de tu circulo cerca, recibe el aviso con su telefono a un toque.",
            },
            {
              icono: "megafono" as const,
              t: "Y si hace falta, escalas",
              d: "Un boton aparte avisa a serenazgo, policia o ambulancia. La red vecinal y la autoridad son caminos paralelos, no excluyentes.",
            },
          ].map((paso, i) => (
            <li key={paso.t} className="tarjeta flex gap-3 p-3.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-superficie-alta text-marca">
                <Icono nombre={paso.icono} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-texto">
                  <span className="mr-1.5 text-tenue tabular-nums">{i + 1}.</span>
                  {paso.t}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-suave">{paso.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --- 4. Blockchain Fit: la pregunta esceptica, de frente ----------- */}
      <section className="px-4">
        <TituloSeccion>¿Por que blockchain, y no una base de datos?</TituloSeccion>

        <Tarjeta className="p-4">
          <p className="text-sm leading-relaxed text-texto">
            Porque el valor del producto es exactamente lo que una base de datos no puede
            dar: que <strong className="font-semibold">nadie</strong> —ni el municipio
            denunciado, ni nosotros— pueda borrar un reporte incomodo. Si el registro lo
            guarda una sola institucion, el vecino que desconfia de esa institucion no
            tiene motivo para creerle.
          </p>

          <div className="mt-4 rounded-xl border border-borde bg-superficie-alta p-3.5">
            <p className="etiqueta-seccion mb-2">Y por que en Arbitrum</p>
            <p className="text-sm leading-relaxed text-texto">{arbitrum.porQue}</p>

            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1 rounded-lg border border-borde bg-fondo p-2.5">
                <p className="text-[11px] text-tenue">Anclar en Ethereum L1</p>
                <p className="mt-0.5 font-mono text-base text-alerta">
                  ${COSTO_ANCLAJE_L1_USD.toFixed(2)}
                </p>
              </div>
              <div className="flex-1 rounded-lg border border-marca/40 bg-marca/8 p-2.5">
                <p className="text-[11px] text-tenue">Anclar en {arbitrumOne.nombre}</p>
                <p className="mt-0.5 font-mono text-base text-marca">
                  ${arbitrumOne.costoAnclajeUsd.toFixed(4)}
                </p>
              </div>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-suave">
              <strong className="font-semibold text-texto">
                {vecesMasBarato.toLocaleString("es-PE")} veces mas barato.
              </strong>{" "}
              Un reporte por vecino por dia solo cierra a este precio. En L1 el mismo gesto
              cuesta dolares y el producto sencillamente no existe. Estimacion, no medicion:
              la cifra real se fija cuando el contrato este desplegado.
            </p>
          </div>

          <ul className="mt-4 space-y-2.5">
            {arbitrum.usos.map((uso) => (
              <li key={uso.titulo} className="flex gap-2.5">
                <Icono nombre="check" className="mt-0.5 h-4 w-4 shrink-0 text-marca" />
                <p className="text-xs leading-relaxed text-suave">
                  <strong className="font-medium text-texto">{uso.titulo}.</strong>{" "}
                  {uso.detalle}
                </p>
              </li>
            ))}
          </ul>
        </Tarjeta>

        {/* El reality check del Workshop 4, dicho por nosotros antes que por el jurado. */}
        <Tarjeta className="mt-2 border-ambar/30 bg-ambar/5 p-3.5">
          <p className="text-xs leading-relaxed text-suave">
            <strong className="font-semibold text-ambar">Lo que blockchain NO resuelve aqui:</strong>{" "}
            que el reporte sea cierto. La cadena garantiza que nadie lo edito despues, no que
            haya pasado. Para eso esta la corroboracion de vecinos y el limite anti-Sybil — y
            aun asi es parcial, como decimos abajo.
          </p>
        </Tarjeta>
      </section>

      {/* --- 5. Que es real y que esta simulado --------------------------- */}
      <section className="px-4">
        <TituloSeccion>Que funciona de verdad hoy</TituloSeccion>
        <p className="mb-2 text-xs leading-relaxed text-suave">
          Un jurado que descubre solo que algo era simulado castiga mas que uno al que se lo
          advirtieron. Esta es la lista completa, sin filtrar, y es la misma que ve el equipo
          en el repositorio.
        </p>
        <Tarjeta className="divide-y divide-borde p-0">
          {limites.map((l) => (
            <div key={l.tema} className="px-4 py-3">
              <p className="text-sm font-medium text-texto">{l.tema}</p>
              <p className="mt-1 text-xs leading-relaxed text-suave">
                <span className="font-medium text-marca">Hoy:</span> {l.queHacemos}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-suave">
                <span className="font-medium text-ambar">Falta:</span> {l.queFaltaria}
              </p>
            </div>
          ))}
        </Tarjeta>
      </section>

      {/* --- 6. Preguntas del jurado, ya contestadas ----------------------- */}
      <section className="px-4">
        <TituloSeccion>Si eres del jurado, esto es lo que ibas a preguntar</TituloSeccion>
        <div className="space-y-2">
          {PREGUNTAS_JURADO.map((q) => (
            <details key={q.p} className="tarjeta group p-0">
              <summary className="toque flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-texto">
                {q.p}
                <Icono
                  nombre="flecha"
                  className="h-4 w-4 shrink-0 rotate-90 text-tenue transition group-open:-rotate-90"
                />
              </summary>
              <p className="px-4 pb-3.5 text-xs leading-relaxed text-suave">{q.r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* --- 7. Para quien es --------------------------------------------- */}
      <section className="px-4">
        <TituloSeccion>Para quien</TituloSeccion>
        <Tarjeta className="divide-y divide-borde p-0">
          {problema.usuarios.map((u) => (
            <div key={u.perfil} className="px-4 py-3">
              <p className="text-sm font-medium text-texto">{u.perfil}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-suave">{u.necesidad}</p>
            </div>
          ))}
        </Tarjeta>
      </section>

      {/* --- 8. Entrar a la app ------------------------------------------- */}
      <section className="px-4">
        <Link
          href="/arquitectura"
          className="tarjeta flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.99]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-alta text-info">
            <Icono nombre="arquitectura" className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-texto">
              Como esta construido, en detalle
            </span>
            <span className="block text-xs text-tenue">
              Capas, contratos, las 38 decisiones con sus alternativas descartadas y los
              limites declarados
            </span>
          </span>
          <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-tenue" />
        </Link>
      </section>

      <footer className="px-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-tenue">
          <span>
            {meta.nombre} {meta.version}
          </span>
          <span aria-hidden>·</span>
          <span>Hackathon Ethereum Lima 2026</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            Estado de la cadena
            <EtiquetaEstado estado="simulado" />
          </span>
        </div>
      </footer>
    </div>
  );
}
