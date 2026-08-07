# Vecino Seguro — Contexto del proyecto (Claude Code)

> Este archivo se carga automáticamente cuando trabajas en este repo con Claude Code.
> **Reglas de trabajo con IA (obligatorias): `docs/REGLAS-IA.md`**
> Contexto completo (problema, decisiones, arquitectura, monetización, roadmap, riesgos): **`docs/PROYECTO.md`**

## Qué es
Vecino Seguro: red vecinal de reporte de seguridad con geolocalización + blockchain, construida para
el Hackathon Ethereum Lima 2026 (deadline: 12 ago, 4pm). Complementa al serenazgo/policía en zonas
donde no llegan o no generan confianza — no los reemplaza.

## Diseño ya decidido (no reabrir sin razón)
- Identidad **pseudónima por defecto** (wallet). Revelación de identidad real solo bajo
  consentimiento del usuario o solicitud judicial verificable (multisig usuario + plataforma + autoridad).
- **Doble ruta de respuesta**: red vecinal + botón de escalamiento directo a serenazgo/policía/ambulancia.
- Recompensa en token orientada a **prueba de presencia** (no "tiempo de app abierta"), con
  rate-limit anti-Sybil básico para el MVP.
- On-chain se guarda el **hash** del reporte (IPFS + coordenadas + timestamp), no la identidad.

## Stack técnico
- **Contratos**: Solidity sobre Arbitrum Sepolia (testnet) → mira a Arbitrum One.
  - `ReportRegistry.sol` — hash IPFS + coordenadas + categoría + timestamp, emite evento.
  - `TokenReward.sol` (ERC-20) — mint con rate-limit por wallet/zona/tiempo.
  - `IdentityEscrow.sol` — vínculo wallet↔identidad cifrado, multisig simplificado 2-de-3 para el MVP.
- **Frontend** (este repo): Next.js 15 App Router + React 19 + Tailwind 4, TypeScript estricto, mobile-first.
  - Login **opcional** con Google (Auth.js v5). No identifica ante la red: el alias publico no cambia (ADR-021).
  - Wallet abstraction: Privy o Web3Auth (nada de seed phrases visibles al usuario).
  - Mapa en tiempo real: Leaflet + OpenStreetMap (sin API key — ver ADR-004).
  - Flujo: categoría → foto/video → geolocalización automática → confirmar → recompensa.
  - Botón de escalamiento a autoridad (webhook/SMS/WhatsApp simulado para demo).
  - Pantalla conceptual de "revelación bajo orden judicial" (demo, no integración legal real).
- **Storage**: IPFS/Pinata para evidencia multimedia.
- **Despliegue**: Vercel desde `main`. La beta arranca sin ninguna variable de entorno.
  Cabeceras y CSP en `next.config.ts` (probables en local con `next start`). Runbook completo
  y checklist previo a la demo: `docs/DESPLIEGUE.md`.

## Reparto de trabajo
- **Este repo (frontend + producto)**: pantallas, dominio, reglas anti-Sybil, hash canónico,
  adaptadores simulados, pestaña Arquitectura, documentación.
- **Equipo de contratos**: los tres `.sol`, su despliegue en Arbitrum Sepolia y el
  `ArbitrumChainAdapter` que implementa la interfaz ya definida en `src/lib/chain/types.ts`.
  Su lista de tareas está en `docs/SIGUIENTES-PASOS-ARBITRUM.md`.

## Alcance del MVP (no expandir sin justificación fuerte)
- **3 categorías de reporte**, cerradas: actividad sospechosa, infraestructura, sismo sentido.
  Los `indiceContrato` (0, 1, 2) nunca se reordenan: ya están escritos en la cadena.
- Si el tiempo aprieta: priorizar que **una sola categoría** funcione end-to-end
  (reporte → token → mapa → escalamiento) antes que varias a medio terminar.
- Sismos: es la versión liviana tipo USGS "Did You Feel It?" (ADR-019) — agrega reportes de
  vecinos, **nunca** un motor de detección propio. No toca la economía del token.
- **Seis pestañas**: Inicio, Mapa, Reportar, Círculo, Cuenta, Arquitectura. La de Círculo
  solo aparece con sesión de Google iniciada (ADR-102). No agregar más.

## Riesgos a comunicar con transparencia (no ocultar en el pitch)
- Anti-Sybil del MVP es básico (rate-limit + corroboración), no prueba de presencia completa.
- Revelación selectiva es demo conceptual del mecanismo, no integración legal real.
- Lo simulado se etiqueta **dentro del producto** (`EtiquetaSimulado`), no solo en el pitch.

## Convenciones de trabajo
- Antes de tocar el alcance o las decisiones de diseño de arriba, confirmar que el cambio no
  compromete la entrega del 12 de agosto.
- **Toda decisión no trivial se registra en `src/data/decisiones.json`** antes o al momento de
  implementarla, con alternativas descartadas y reversibilidad. Formato y criterios: `docs/REGLAS-IA.md`.
  Las que necesitan aprobación de una persona van con `requiere_validacion_humana: true`.
- `docs/ARQUITECTURA.md` y `docs/DECISIONES.md` **son generados**. Se edita el JSON en `src/data/`
  y se corre `npm run docs`. Editarlos a mano es trabajo perdido.
- Todo lo que el equipo de contratos va a reemplazar vive detrás de una interfaz (`src/lib/chain`,
  `src/lib/storage`). Las pantallas nunca importan un adaptador concreto.
- Las reglas de negocio (`src/lib/antisybil.ts`, `src/lib/hash.ts`, `src/lib/geo.ts`) son funciones
  puras con tests: reciben `ahora` como parámetro, no tocan React ni `window`.
- Sin dependencias nuevas sin su ADR. Cada paquete es algo más que puede romper el build el 12 de agosto.

## Comandos
```bash
npm run dev       # desarrollo en localhost:3000
npm run check     # preflight + validate + docs:check + typecheck + lint + test  ← antes de decir "listo"
npm run docs      # regenera docs/ARQUITECTURA.md y docs/DECISIONES.md desde src/data
npm run preflight # valida el entorno; aborta si un secreto lleva prefijo NEXT_PUBLIC_
npm run build     # build de produccion (lo mismo que corre Vercel)
```
