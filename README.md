# Vecino Seguro — beta

Red vecinal de reporte de seguridad con geolocalización y evidencia anclada en Arbitrum.
Hackathon Ethereum Lima 2026.

**Demo en vivo: https://vecino-seguro.vercel.app**
**Si llegas en frio, empieza por aqui: [/landing](https://vecino-seguro.vercel.app/landing)** — que problema
resuelve, por que en Arbitrum y que funciona de verdad hoy. Dos minutos, sin cuenta.

El vecino reporta en tres toques desde el celular. La evidencia va a IPFS, su hash se ancla en
Arbitrum y la red vecinal se entera al instante. Un botón aparte escala a serenazgo, policía o
ambulancia. Nadie sabe quién reportó, salvo que el propio usuario lo autorice o exista una
orden judicial verificable.

> **Complementa al serenazgo donde no llega o no genera confianza. No lo reemplaza.**

### Círculo de cuidado

Si alguien comparte su ubicación contigo, recibes un aviso cuando ocurre un reporte cerca de
esa persona, con su teléfono a un toque para llamarla.

Los teléfonos de tu familia y las posiciones que te comparten son el dato más sensible del
producto, así que el círculo se apoya en la cuenta con la que entraste (`ADR-102`): sin
sesión la pestaña no aparece y el proveedor no carga nada ni emite avisos.

Lo único simulado es el transporte de la ubicación del contacto; la geometría, los avisos y
la deduplicación son reales y tienen 20 tests. Las dos preguntas de producto que siguen
abiertas están en `ADR-101` y `ADR-025` de [`docs/DECISIONES.md`](docs/DECISIONES.md).

---

## Arrancar

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno la beta corre en modo simulado —sin RPC,
sin faucet, sin wallet. **Navegar (Inicio, Mapa, Arquitectura, Cuenta) nunca pide cuenta.**
Reportar y el Círculo de cuidado sí la piden (`ADR-035`, amend de `ADR-027`) — y sin credenciales
de Google configuradas, hasta esas dos rutas dejan pasar, para que un despliegue sin `.env` no
quede inaccesible.

Para verlo como se va a usar de verdad: DevTools → vista móvil, 375 px de ancho.

---

## Desplegar en Vercel

El proyecto es un Next.js estándar; Vercel lo detecta solo.

1. Importar el repositorio en [vercel.com/new](https://vercel.com/new).
2. Framework: **Next.js** (autodetectado). Dejar todos los *Override* apagados.
3. Deploy. Cada push a `main` redespliega solo.

**No hay que configurar ninguna variable para que la demo funcione.** Las de `.env.example` son
todas opcionales.

> Las variables `NEXT_PUBLIC_*` se incrustan en el bundle durante el **build**. Cambiar una en
> el panel **no** afecta a un deploy ya publicado: hay que hacer **Redeploy**. Lo mismo vale
> para `ESCALATION_WEBHOOK_URL`, porque Vercel congela el entorno al crear el deployment.

Ámbitos recomendados para los dos secretos:

- `PINATA_JWT` → Production y Preview, marcada **Sensitive**. Nunca con prefijo `NEXT_PUBLIC_`
  (el preflight aborta el build si alguien lo intenta).
- `ESCALATION_WEBHOOK_URL` → **solo Production**, para que una rama de preview no pueda avisar
  a un serenazgo real por accidente.

El resto se cargan cuando el equipo de contratos publique las direcciones
(ver [`docs/SIGUIENTES-PASOS-ARBITRUM.md`](docs/SIGUIENTES-PASOS-ARBITRUM.md)).

El botón de reportar usa la geolocalización del navegador, que exige HTTPS: en Vercel funciona,
en `localhost` también. Si el GPS falla, el flujo ofrece una ubicación de demostración.

**Ajustes del panel, cabeceras, CSP y checklist previo a la demo:
[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).**

---

## Comandos

```bash
npm run dev       # desarrollo
npm run check     # preflight + validate + docs:check + typecheck + lint + test  ← antes de "listo"
npm run test      # solo los tests del dominio (88)
npm run docs      # regenera docs/ARQUITECTURA.md y docs/DECISIONES.md desde src/data
npm run preflight # valida el entorno; aborta si un secreto lleva prefijo NEXT_PUBLIC_
npm run build     # build de produccion (lo mismo que corre Vercel)
```

---

## Cómo está organizado

```
src/
├─ app/                    6 pestañas + rutas API de escalamiento y de sesión
│  ├─ page.tsx             Inicio — problema, impacto y estado de la red
│  ├─ landing/             Landing auto explicativa (ADR-037), publica y fuera de la barra
│  ├─ mapa/                Mapa vecinal (Leaflet + OpenStreetMap, sin API key)
│  ├─ reportar/            Flujo de reporte en 3 pasos
│  ├─ circulo/             Círculo de cuidado (requiere sesión)
│  ├─ cuenta/              Alias, acceso con Google, recompensas y revelación selectiva
│  ├─ arquitectura/        Cómo está construido esto, dentro del producto
│  ├─ api/escalamiento/    Puente con serenazgo / policía / ambulancia
│  └─ api/auth/            NextAuth (Google), sesión en cookie, sin base de datos
├─ components/             UI, toda mobile-first
├─ data/                   FUENTES DE VERDAD (arquitectura.json, decisiones.json)
└─ lib/
   ├─ antisybil.ts         Política de recompensa — especificación de TokenReward.sol
   ├─ hash.ts              Hash canónico — el bytes32 que ve el contrato
   ├─ geo.ts               Truncado de coordenadas y celdas de zona
   ├─ zonas.ts             Distrito estimado en el dispositivo, sin geocoding externo
   ├─ sismos.ts            Agregado comunitario "lo sentiste" (cuenta reportes, no mide)
   ├─ circulo.ts           Cercanía a contactos y deduplicación de avisos
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
| Detección de sismos | Agrega los reportes de vecinos por zona ("lo sentiste") | Nada previsto: **cuenta reportes, no mide sismos** |
| Distrito del reporte | Estimado en el dispositivo con 49 referencias de Lima y Callao, corregible a mano | Cerca de un borde puede apuntar al distrito vecino |
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
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Vercel: panel, variables, CSP y checklist previo a la demo |
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
