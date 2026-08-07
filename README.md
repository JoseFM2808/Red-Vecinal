# Vecino Seguro — beta

Red vecinal de reporte de seguridad con geolocalización y evidencia anclada en Arbitrum.
Hackathon Ethereum Lima 2026.

El vecino reporta en tres toques desde el celular. La evidencia va a IPFS, su hash se ancla en
Arbitrum y la red vecinal se entera al instante. Un botón aparte escala a serenazgo, policía o
ambulancia. Nadie sabe quién reportó, salvo que el propio usuario lo autorice o exista una
orden judicial verificable.

> **Complementa al serenazgo donde no llega o no genera confianza. No lo reemplaza.**

---

## Arrancar

```bash
npm install
npm run dev
```

Abre http://localhost:3000. **No hace falta ninguna variable de entorno**: la beta corre en modo
simulado, sin RPC, sin faucet y sin wallet.

Para verlo como se va a usar de verdad: DevTools → vista móvil, 375 px de ancho.

---

## Desplegar en Vercel

El proyecto es un Next.js estándar; Vercel lo detecta solo.

1. Importar el repositorio en [vercel.com/new](https://vercel.com/new).
2. Framework: **Next.js** (autodetectado). Build: `npm run build`. Sin ajustes extra.
3. Deploy.

No hay que configurar nada más para que la demo funcione. Las variables de `.env.example` son
todas opcionales — se cargan cuando el equipo de contratos publique las direcciones
(ver [`docs/SIGUIENTES-PASOS-ARBITRUM.md`](docs/SIGUIENTES-PASOS-ARBITRUM.md)).

El botón de reportar usa la geolocalización del navegador, que exige HTTPS: en Vercel funciona,
en `localhost` también. Si el GPS falla, el flujo ofrece una ubicación de demostración.

---

## Comandos

```bash
npm run dev      # desarrollo
npm run check    # validate + docs:check + typecheck + lint + test   ← antes de decir "listo"
npm run test     # solo los tests del dominio
npm run docs     # regenera docs/ARQUITECTURA.md y docs/DECISIONES.md desde src/data
npm run build    # build de produccion (lo mismo que corre Vercel)
```

---

## Cómo está organizado

```
src/
├─ app/                    5 pestañas + la ruta API de escalamiento
│  ├─ page.tsx             Inicio — problema, impacto y estado de la red
│  ├─ mapa/                Mapa vecinal (Leaflet + OpenStreetMap, sin API key)
│  ├─ reportar/            Flujo de reporte en 3 pasos
│  ├─ cuenta/              Alias, recompensas y revelación selectiva
│  ├─ arquitectura/        Cómo está construido esto, dentro del producto
│  └─ api/escalamiento/    Puente con serenazgo / policía / ambulancia
├─ components/             UI, toda mobile-first
├─ data/                   FUENTES DE VERDAD (arquitectura.json, decisiones.json)
└─ lib/
   ├─ antisybil.ts         Política de recompensa — especificación de TokenReward.sol
   ├─ hash.ts              Hash canónico — el bytes32 que ve el contrato
   ├─ geo.ts               Truncado de coordenadas y celdas de zona
   ├─ flujo-reporte.ts     Orquestador: validar → IPFS → hash → anclar
   ├─ chain/               Interfaz con Arbitrum + adaptador simulado
   └─ storage/             Interfaz con IPFS + adaptador simulado
```

**Regla de oro de la arquitectura:** todo lo que otro equipo va a reemplazar vive detrás de una
interfaz. Las pantallas nunca importan un adaptador concreto.

---

## Estado de la beta

Lo simulado está etiquetado **dentro del producto** (pestaña Arquitectura → Entrega), no solo aquí:

| Pieza | Hoy | Falta |
| --- | --- | --- |
| Anclaje on-chain | Comprobante simulado con el formato real de Arbiscan | Desplegar `ReportRegistry` |
| Recompensas | Política aplicada en cliente, con tests | `TokenReward.sol` |
| Evidencia IPFS | CID determinista derivado del hash del archivo | Pinata con JWT |
| Escalamiento | Ruta API real, destino simulado | Convenio municipal |
| Identidad | Pseudónimo local, sin seed phrase | Privy o Web3Auth |
| Índice compartido | Local al dispositivo + datos sembrados | Leer eventos `ReportSubmitted` |

---

## Documentación

| Documento | Qué contiene |
| --- | --- |
| [`docs/PROYECTO.md`](docs/PROYECTO.md) | Problema, decisiones de producto, monetización, riesgos |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Capas, flujo, contratos, límites *(generado)* |
| [`docs/DECISIONES.md`](docs/DECISIONES.md) | Bitácora de decisiones con alternativas descartadas *(generado)* |
| [`docs/REGLAS-IA.md`](docs/REGLAS-IA.md) | Reglas de trabajo con IA en este repositorio |
| [`docs/SIGUIENTES-PASOS-ARBITRUM.md`](docs/SIGUIENTES-PASOS-ARBITRUM.md) | Handoff al equipo de contratos |
| [`docs/PITCH.md`](docs/PITCH.md) | Guion de 5 minutos y respuestas a las preguntas difíciles |

`ARQUITECTURA.md` y `DECISIONES.md` **se generan** desde `src/data/`. Editarlos a mano es trabajo
que se pierde en el siguiente `npm run docs`.

---

## Trabajar con IA en este repositorio

Este proyecto se construye con asistencia de IA bajo reglas explícitas: toda decisión no trivial
se registra en `src/data/decisiones.json` antes de implementarse, con sus alternativas descartadas
y su costo de revertir. `npm run validate` rechaza entradas incompletas, y las que necesitan
aprobación humana aparecen destacadas en la app y en la documentación.

Antes de tocar código, leer [`AGENTS.md`](AGENTS.md) y [`docs/REGLAS-IA.md`](docs/REGLAS-IA.md).
