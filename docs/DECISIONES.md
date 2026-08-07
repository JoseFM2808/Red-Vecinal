<!-- GENERADO AUTOMATICAMENTE desde src/data/decisiones.json — no editar a mano. Corre `npm run docs`. -->

# Bitacora de decisiones — Vecino Seguro

Bitácora auditable de decisiones. Toda decisión no trivial tomada por la IA o por el equipo se registra aquí ANTES o AL MOMENTO de escribir el código que la implementa. `docs/DECISIONES.md` se genera desde este archivo (npm run docs) y la pestaña Arquitectura de la app lo renderiza.

**15 decisiones registradas · 5 esperan validacion humana**

## Esperan que una persona decida

| ID | Decision | Que hay que confirmar |
| --- | --- | --- |
| ADR-002 | Las reglas anti-Sybil viven en TypeScript puro y son la especificación del contrato | El equipo de contratos debe confirmar que los límites (3 reportes/hora, 1 por zona cada 15 min) son los que se codifican en TokenReward.sol. |
| ADR-003 | El hash on-chain es SHA-256 sobre JSON canónico | Confirmar con el equipo de contratos: ¿SHA-256 o keccak256 en ReportRegistry.sol? |
| ADR-009 | Persistencia local en el dispositivo, sin base de datos | Para la demo en vivo con varios teléfonos hace falta un índice compartido. Opción recomendada: leer eventos de ReportRegistry vía RPC de Arbitrum Sepolia (lo cubre el equipo de contratos). |
| ADR-012 | Arbitrum como capa de asentamiento, no como adorno | Validar con el equipo de contratos el costo real por reporte medido en Arbitrum Sepolia para reemplazar la estimación de la UI por un dato medido. |
| ADR-014 | Prueba de presencia: la beta mide corroboración, no tiempo de app abierta | Decidir con el equipo si la recompensa se mintea al reportar (optimista) o solo tras corroborarse (conservador). La beta implementa el conservador. |

## Indice

| ID | Decision | Autor | Estado | Reversibilidad | Rubrica |
| --- | --- | --- | --- | --- | --- |
| [ADR-001](#adr-001) | La beta se construye como app Next.js sin dependencia de red blockchain | IA | aceptada | alta | Implementacion tecnica, Ecosistema Arbitrum, Pitch y demo |
| [ADR-002](#adr-002) | Las reglas anti-Sybil viven en TypeScript puro y son la especificación del contrato | IA | aceptada | alta | Implementacion tecnica, Ecosistema Arbitrum |
| [ADR-003](#adr-003) | El hash on-chain es SHA-256 sobre JSON canónico | IA | aceptada | media | Implementacion tecnica, Ecosistema Arbitrum |
| [ADR-004](#adr-004) | Mapa con Leaflet + OpenStreetMap, sin API key | IA | aceptada | alta | Producto y UX, Pitch y demo |
| [ADR-005](#adr-005) | Identidad pseudónima local en la beta; wallet abstraction queda como costura | IA | aceptada | alta | Producto y UX, Implementacion tecnica |
| [ADR-006](#adr-006) | La arquitectura es un dato, no un dibujo | IA | aceptada | alta | Implementacion tecnica, Pitch y demo |
| [ADR-007](#adr-007) | Los estados simulados se etiquetan como simulados dentro del producto | IA | aceptada | alta | Pitch y demo, Problema e impacto |
| [ADR-008](#adr-008) | Dos categorías de reporte, ni una más | IA+Humano | aceptada | alta | Producto y UX, Problema e impacto |
| [ADR-009](#adr-009) | Persistencia local en el dispositivo, sin base de datos | IA | aceptada | media | Implementacion tecnica, Producto y UX |
| [ADR-010](#adr-010) | El escalamiento a autoridad es una ruta API real con destino simulado | IA | aceptada | alta | Problema e impacto, Implementacion tecnica |
| [ADR-011](#adr-011) | Interfaz en español peruano y diseño mobile-first oscuro | IA | aceptada | alta | Producto y UX |
| [ADR-012](#adr-012) | Arbitrum como capa de asentamiento, no como adorno | IA | aceptada | baja | Ecosistema Arbitrum, Pitch y demo, Implementacion tecnica |
| [ADR-013](#adr-013) | Toda decisión de la IA queda registrada aquí antes de escribir el código | IA | aceptada | alta | Implementacion tecnica, Pitch y demo |
| [ADR-014](#adr-014) | Prueba de presencia: la beta mide corroboración, no tiempo de app abierta | IA | aceptada | alta | Implementacion tecnica, Problema e impacto, Ecosistema Arbitrum |
| [ADR-015](#adr-015) | El nombre del distrito se resuelve en el dispositivo, sin servicio de geocoding | IA | aceptada | alta | Producto y UX, Implementacion tecnica, Problema e impacto |

---

## ADR-001

### La beta se construye como app Next.js sin dependencia de red blockchain

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El equipo de contratos trabaja en paralelo sobre Arbitrum. Si el frontend depende de contratos desplegados para arrancar, ninguna de las dos mitades puede demostrarse hasta el final y el riesgo se concentra el día de la demo.

**Alternativas descartadas.**

- *Esperar a que los contratos estén desplegados* — Bloquea el frontend varios días y deja la demo sin plan B.
- *Escribir el frontend contra un mock desechable* — El mock se tira a la basura y la integración real se escribe dos veces bajo presión.

**Decision.** El frontend habla con una interfaz `ChainAdapter`. La beta usa `MockChainAdapter` (local, determinista); el equipo de contratos implementa `ArbitrumChainAdapter` contra la MISMA interfaz. Se cambia con la variable NEXT_PUBLIC_CHAIN_MODE.

**Consecuencias.**

- La demo funciona siempre, aun sin RPC ni faucet.
- La integración con Arbitrum es un archivo nuevo, no una reescritura.
- Hay que mantener el mock fiel a la semántica de los contratos (mismos límites, mismos errores).

**Costo de revertir.** Bajo: borrar el adaptador simulado y dejar solo el real.

**Sirve a.** Implementacion tecnica, Ecosistema Arbitrum, Pitch y demo

**Evidencia en el codigo.** `src/lib/chain/types.ts`, `src/lib/chain/mock-adapter.ts`, `src/lib/chain/index.ts`

---

## ADR-002

### Las reglas anti-Sybil viven en TypeScript puro y son la especificación del contrato

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** `TokenReward.sol` necesita reglas anti-farmeo. Si el frontend y el contrato implementan reglas distintas, el usuario ve una recompensa que la cadena rechaza.

**Alternativas descartadas.**

- *Reglas solo en Solidity* — El frontend no puede avisar antes de gastar gas y la UX se degrada.
- *Reglas duplicadas a mano en ambos lados* — Divergen en el primer cambio.

**Decision.** `src/lib/antisybil.ts` es una función pura, sin dependencias, con tests. Sus constantes (`POLITICA_RECOMPENSA`) son la especificación literal que el equipo de contratos porta a Solidity. El frontend valida antes de enviar; el contrato revalida en cadena.

**Consecuencias.**

- Los límites son testeables sin desplegar nada.
- El equipo de contratos recibe una spec ejecutable, no un párrafo en prosa.
- Duplicación consciente: validar dos veces es correcto, la cadena es la autoridad final.

**Costo de revertir.** Bajo.

**Sirve a.** Implementacion tecnica, Ecosistema Arbitrum

**Evidencia en el codigo.** `src/lib/antisybil.ts`, `src/lib/antisybil.test.ts`

> **Necesita decision humana:** El equipo de contratos debe confirmar que los límites (3 reportes/hora, 1 por zona cada 15 min) son los que se codifican en TokenReward.sol.

---

## ADR-003

### El hash on-chain es SHA-256 sobre JSON canónico

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **media**

**Contexto.** `ReportRegistry.sol` guarda un `bytes32 contentHash`. Hay que decidir qué se hashea y cómo, o dos clientes producirán hashes distintos para el mismo reporte.

**Alternativas descartadas.**

- *keccak256 (nativo de EVM)* — Requiere una librería extra en el navegador; SHA-256 está en Web Crypto sin dependencias y también son 32 bytes.
- *Hashear el JSON tal como salga* — El orden de las claves cambia el hash. No es reproducible.

**Decision.** Serialización canónica (claves ordenadas, coordenadas en microgrados enteros) y SHA-256 vía Web Crypto. El resultado es un `0x…` de 32 bytes que entra directo como `bytes32`.

**Consecuencias.**

- Cualquiera puede recomputar el hash desde la evidencia y verificar el reporte.
- Coordenadas truncadas a ~11 m: privacidad y determinismo en el mismo paso.
- Si el equipo prefiere keccak256, se cambia una sola función.

**Costo de revertir.** Medio: cambia el hash de los reportes ya anclados.

**Sirve a.** Implementacion tecnica, Ecosistema Arbitrum

**Evidencia en el codigo.** `src/lib/hash.ts`, `src/lib/hash.test.ts`

> **Necesita decision humana:** Confirmar con el equipo de contratos: ¿SHA-256 o keccak256 en ReportRegistry.sol?

---

## ADR-004

### Mapa con Leaflet + OpenStreetMap, sin API key

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El MVP necesita mapa en tiempo real. Mapbox exige token y cuota; una key vencida o ausente rompe la demo delante del jurado.

**Alternativas descartadas.**

- *Mapbox GL* — Depende de una API key que puede faltar en Vercel el día de la demo.

**Decision.** Leaflet + teselas de OpenStreetMap, cargado con import dinámico y `ssr: false`. Cero variables de entorno para que el mapa funcione.

**Consecuencias.**

- El mapa funciona en un deploy limpio sin configurar nada.
- Estética menos pulida que Mapbox; se compensa con marcadores propios (divIcon).
- Migrar a Mapbox después es un cambio localizado en un componente.

**Costo de revertir.** Bajo.

**Sirve a.** Producto y UX, Pitch y demo

**Evidencia en el codigo.** `src/components/mapa/MapaLeaflet.tsx`, `src/components/mapa/MapaReportes.tsx`

---

## ADR-005

### Identidad pseudónima local en la beta; wallet abstraction queda como costura

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El diseño acordado exige pseudonimato por wallet sin seed phrases visibles (Privy/Web3Auth). Integrar Privy hoy añade una dependencia con configuración de dashboard que el equipo aún no tiene.

**Alternativas descartadas.**

- *Integrar Privy ya* — Requiere App ID y configuración externa; bloquea la beta desplegable.
- *Pedir wallet tipo MetaMask* — Contradice la decisión de producto: el vecino no maneja seed phrases.

**Decision.** La beta genera un pseudónimo determinista en el dispositivo (`vecino-####` + dirección derivada) guardado en localStorage, detrás de la interfaz `IdentidadProvider`. Privy entra reemplazando ese proveedor, sin tocar pantallas.

**Consecuencias.**

- La experiencia 'sin seed phrase' se puede demostrar hoy.
- Hay que decir con transparencia que la wallet de la beta no firma transacciones reales.
- El punto de integración está aislado en un archivo.

**Costo de revertir.** Bajo.

**Sirve a.** Producto y UX, Implementacion tecnica

**Evidencia en el codigo.** `src/lib/identidad.ts`, `src/components/proveedores/AppProvider.tsx`

---

## ADR-006

### La arquitectura es un dato, no un dibujo

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** Se pide una pestaña 'Arquitectura' que exhiba cómo está construido el programa. Un diagrama estático se desactualiza en el primer commit y el jurado lo detecta.

**Alternativas descartadas.**

- *Imagen o diagrama estático* — Se desincroniza del código y no es verificable.
- *Documento Markdown a mano* — Se duplica con la pantalla de la app.

**Decision.** `src/data/arquitectura.json` es la única fuente de verdad. La pestaña Arquitectura lo renderiza y `docs/ARQUITECTURA.md` se genera desde él con `npm run docs`. `npm run docs:check` falla si el doc quedó desactualizado.

**Consecuencias.**

- Imposible que la documentación y la app digan cosas distintas.
- El jurado ve, dentro del producto, el estado real de cada módulo (listo / simulado / pendiente).
- Editar arquitectura obliga a editar un JSON validado, no prosa suelta.

**Costo de revertir.** Bajo.

**Sirve a.** Implementacion tecnica, Pitch y demo

**Evidencia en el codigo.** `src/data/arquitectura.json`, `scripts/generate-docs.mjs`, `src/app/arquitectura/page.tsx`

---

## ADR-007

### Los estados simulados se etiquetan como simulados dentro del producto

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El pitch exige transparencia sobre qué es MVP y qué sería producto real. Un jurado que descubre por su cuenta que algo es falso castiga más que uno al que se lo advierten.

**Alternativas descartadas.**

- *Ocultar el modo simulado para que la demo se vea completa* — Riesgo reputacional alto y contradice la decisión de comunicación del equipo.

**Decision.** Todo lo simulado lleva una etiqueta visible en la UI (`Simulado`) y aparece en la pestaña Arquitectura bajo 'Límites honestos de la beta': anclaje on-chain, escalamiento a autoridad, revelación selectiva y storage IPFS.

**Consecuencias.**

- El jurado ve honestidad como característica, no como debilidad.
- El equipo tiene una lista exacta de lo que falta conectar.

**Costo de revertir.** Bajo: la etiqueta desaparece sola cuando el adaptador real entra.

**Sirve a.** Pitch y demo, Problema e impacto

**Evidencia en el codigo.** `src/components/ui/EtiquetaSimulado.tsx`, `src/data/arquitectura.json`

---

## ADR-008

### Dos categorías de reporte, ni una más

`2026-08-06` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El alcance fijado en CLAUDE.md limita el MVP a 2 categorías. La tentación de agregar más (sismos, accidentes) diluye el tiempo restante antes del 12 de agosto.

**Alternativas descartadas.**

- *Agregar 'sismo sentido'* — Está marcado como roadmap en docs/PROYECTO.md, no como núcleo.

**Decision.** Solo `actividad_sospechosa` e `infraestructura`. Las categorías viven en un catálogo tipado; agregar una es un objeto nuevo, pero requiere una entrada en esta bitácora.

**Consecuencias.**

- El flujo completo funciona end-to-end antes de ampliar.
- El catálogo tipado impide categorías inventadas en tiempo de ejecución.

**Costo de revertir.** Bajo.

**Sirve a.** Producto y UX, Problema e impacto

**Evidencia en el codigo.** `src/lib/categorias.ts`

---

## ADR-009

### Persistencia local en el dispositivo, sin base de datos

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **media**

**Contexto.** La beta necesita que los reportes sobrevivan a recargar la página durante la demo. Montar Postgres o Supabase añade infraestructura, credenciales y un punto de fallo.

**Alternativas descartadas.**

- *Base de datos gestionada (Supabase/Neon)* — Infraestructura y credenciales que el MVP no necesita: la fuente de verdad final es la cadena, no un servidor.

**Decision.** localStorage detrás de un repositorio (`src/lib/repositorio.ts`). El deploy en Vercel es estático + rutas API sin estado.

**Consecuencias.**

- Cero credenciales, cero costo, despliegue inmediato.
- Los reportes no se comparten entre dispositivos: en la demo se explica que el índice compartido lo dan los eventos del contrato.
- Los datos sembrados dan la sensación de red activa desde el primer arranque.

**Costo de revertir.** Medio: cambiar la implementación del repositorio, no las pantallas.

**Sirve a.** Implementacion tecnica, Producto y UX

**Evidencia en el codigo.** `src/lib/repositorio.ts`, `src/lib/seed.ts`

> **Necesita decision humana:** Para la demo en vivo con varios teléfonos hace falta un índice compartido. Opción recomendada: leer eventos de ReportRegistry vía RPC de Arbitrum Sepolia (lo cubre el equipo de contratos).

---

## ADR-010

### El escalamiento a autoridad es una ruta API real con destino simulado

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** La doble ruta de respuesta (red vecinal + autoridad) es parte central de la propuesta. No hay convenio con ningún serenazgo para el hackathon.

**Alternativas descartadas.**

- *Botón que solo cambia el estado en pantalla* — No demuestra que la costura de integración exista.
- *Integrar WhatsApp/SMS real* — Requiere proveedor, número verificado y costo; no aporta puntaje adicional.

**Decision.** `POST /api/escalamiento` valida el payload, genera un ticket con folio y responde con el destino que recibiría el municipio. Si existe `ESCALATION_WEBHOOK_URL`, reenvía de verdad; si no, responde en modo simulado y lo declara en la respuesta.

**Consecuencias.**

- El contrato de integración con el municipio ya está escrito y documentado.
- Conectar un serenazgo real es configurar una variable de entorno.

**Costo de revertir.** Bajo.

**Sirve a.** Problema e impacto, Implementacion tecnica

**Evidencia en el codigo.** `src/app/api/escalamiento/route.ts`

---

## ADR-011

### Interfaz en español peruano y diseño mobile-first oscuro

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El usuario es un vecino de Lima usando el teléfono, muchas veces de noche y con una mano.

**Alternativas descartadas.**

- *Interfaz bilingüe* — Duplica trabajo sin sumar en la rúbrica.

**Decision.** Español, tema oscuro por defecto, barra de pestañas inferior con área táctil ≥44 px, respeto de safe-area en iPhone, y un botón de reporte destacado al centro. Sin scroll horizontal en 360 px de ancho.

**Consecuencias.**

- Coherente con el contexto de uso real (noche, urgencia, una mano).
- El jurado prueba la demo desde su propio teléfono sin fricción.

**Costo de revertir.** Bajo.

**Sirve a.** Producto y UX

**Evidencia en el codigo.** `src/app/globals.css`, `src/components/navegacion/BarraPestanas.tsx`

---

## ADR-012

### Arbitrum como capa de asentamiento, no como adorno

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **baja**

**Contexto.** El criterio 'Uso del ecosistema Arbitrum' pesa 20% y exige que la tecnología sea parte esencial, no decorativa. Esa integración la ejecuta el equipo de contratos.

**Alternativas descartadas.**

- *Anclar en L1 Ethereum* — El costo por reporte hace inviable el volumen vecinal.
- *Solo base de datos centralizada* — Elimina la razón de ser: prueba inmutable sin depender de una institución.

**Decision.** Arbitrum es la razón por la que el modelo cierra: un reporte por vecino por día a costo de L1 es inviable; en Arbitrum el anclaje cuesta fracciones de centavo. La beta deja preparado: chainId 421614/42161, formato de enlaces al explorador, ABIs y el costo estimado por reporte visible en la UI. Stylus queda anotado como candidato para la verificación geoespacial por su costo de cómputo.

**Consecuencias.**

- El argumento de por qué Arbitrum es defendible con números, no con adjetivos.
- El equipo de contratos hereda direcciones, ABIs y red ya cableadas.

**Costo de revertir.** Alto: es la premisa del proyecto.

**Sirve a.** Ecosistema Arbitrum, Pitch y demo, Implementacion tecnica

**Evidencia en el codigo.** `src/lib/chain/redes.ts`, `src/lib/chain/abis.ts`, `docs/SIGUIENTES-PASOS-ARBITRUM.md`

> **Necesita decision humana:** Validar con el equipo de contratos el costo real por reporte medido en Arbitrum Sepolia para reemplazar la estimación de la UI por un dato medido.

---

## ADR-013

### Toda decisión de la IA queda registrada aquí antes de escribir el código

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El proyecto se desarrolla con asistencia de IA a alta velocidad. Sin un registro, en tres días nadie recuerda por qué algo está así y el equipo revierte decisiones buenas o repite las malas.

**Alternativas descartadas.**

- *Documentar al final* — Al final no hay tiempo y se escribe una racionalización, no la decisión real.
- *Confiar en los mensajes de commit* — No capturan las alternativas descartadas ni la reversibilidad.

**Decision.** Cada decisión no trivial se agrega a `src/data/decisiones.json` con alternativas descartadas, reversibilidad y a qué criterio de la rúbrica sirve. `npm run validate` rechaza entradas incompletas. Las que llevan `requiere_validacion_humana: true` se muestran destacadas para que una persona las apruebe.

**Consecuencias.**

- El equipo puede auditar el criterio de la IA sin leer todo el código.
- Las decisiones que necesitan aprobación humana no se pierden entre commits.
- Cuesta un minuto por decisión.

**Costo de revertir.** Bajo.

**Sirve a.** Implementacion tecnica, Pitch y demo

**Evidencia en el codigo.** `src/data/decisiones.json`, `scripts/validate-data.mjs`, `docs/REGLAS-IA.md`

---

## ADR-014

### Prueba de presencia: la beta mide corroboración, no tiempo de app abierta

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** docs/PROYECTO.md descarta explícitamente recompensar 'tiempo de app abierta'. Hay que traducir 'prueba de presencia' a algo implementable en días.

**Alternativas descartadas.**

- *Prueba de presencia criptográfica completa* — Es un proyecto de investigación en sí mismo; no cabe antes del 12 de agosto.
- *Recompensa fija por reporte* — Es exactamente lo que el equipo decidió evitar: farmeable sin salir de casa.

**Decision.** La recompensa base se multiplica por corroboración independiente: otro pseudónimo distinto reportando la misma categoría a menos de 300 m dentro de 30 minutos. Sin corroboración, la recompensa queda en estado 'pendiente de corroboración'.

**Consecuencias.**

- El incentivo premia estar donde pasan las cosas, no tener la app abierta.
- Sigue siendo atacable por un adversario con varios dispositivos: se declara como límite conocido.
- La regla es una función pura testeada, lista para portar a Solidity.

**Costo de revertir.** Bajo.

**Sirve a.** Implementacion tecnica, Problema e impacto, Ecosistema Arbitrum

**Evidencia en el codigo.** `src/lib/antisybil.ts`, `src/lib/antisybil.test.ts`

> **Necesita decision humana:** Decidir con el equipo si la recompensa se mintea al reportar (optimista) o solo tras corroborarse (conservador). La beta implementa el conservador.

---

## ADR-015

### El nombre del distrito se resuelve en el dispositivo, sin servicio de geocoding

`2026-08-06` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El mapa y las tarjetas necesitan mostrar 'San Juan de Lurigancho' en vez de un par de números. Lo natural sería llamar a un servicio de geocoding inverso.

**Alternativas descartadas.**

- *Geocoding inverso (Nominatim, Google, Mapbox)* — Enviaría la coordenada del vecino a un tercero en cada reporte, que es exactamente lo que el producto promete no hacer. Además añade una dependencia de red en el momento más crítico del flujo.
- *Mostrar solo las coordenadas* — Un par de números no le dice nada al vecino ni al jurado.

**Decision.** Una lista corta de 16 distritos de referencia con sus centroides, y se elige el más cercano. No es geocodificación y no se presenta como tal: si el punto queda a más de 12 km de todos, dice 'Zona sin referencia'.

**Consecuencias.**

- La coordenada nunca sale del dispositivo para resolver un nombre.
- Funciona sin conexión y sin latencia.
- La precisión es de distrito, no de calle: suficiente para la interfaz, y se declara como aproximación.

**Costo de revertir.** Bajo: es una función pura de un solo archivo.

**Sirve a.** Producto y UX, Implementacion tecnica, Problema e impacto

**Evidencia en el codigo.** `src/lib/zonas.ts`
