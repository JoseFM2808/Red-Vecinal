<!-- GENERADO AUTOMATICAMENTE desde src/data/decisiones.json — no editar a mano. Corre `npm run docs`. -->

# Bitacora de decisiones — Vecino Seguro

Bitácora auditable de decisiones. Toda decisión no trivial tomada por la IA o por el equipo se registra aquí ANTES o AL MOMENTO de escribir el código que la implementa. `docs/DECISIONES.md` se genera desde este archivo (npm run docs) y la pestaña Arquitectura de la app lo renderiza.

**29 decisiones registradas · 13 esperan validacion humana**

## Esperan que una persona decida

| ID | Decision | Que hay que confirmar |
| --- | --- | --- |
| ADR-002 | Las reglas anti-Sybil viven en TypeScript puro y son la especificación del contrato | El equipo de contratos debe confirmar que los límites (3 reportes/hora, 1 por zona cada 15 min) son los que se codifican en TokenReward.sol. |
| ADR-003 | El hash on-chain es SHA-256 sobre JSON canónico | Confirmar con el equipo de contratos: ¿SHA-256 o keccak256 en ReportRegistry.sol? |
| ADR-009 | Persistencia local en el dispositivo, sin base de datos | Para la demo en vivo con varios teléfonos hace falta un índice compartido. Opción recomendada: leer eventos de ReportRegistry vía RPC de Arbitrum Sepolia (lo cubre el equipo de contratos). |
| ADR-012 | Arbitrum como capa de asentamiento, no como adorno | Validar con el equipo de contratos el costo real por reporte medido en Arbitrum Sepolia para reemplazar la estimación de la UI por un dato medido. |
| ADR-014 | Prueba de presencia: la beta mide corroboración, no tiempo de app abierta | Decidir con el equipo si la recompensa se mintea al reportar (optimista) o solo tras corroborarse (conservador). La beta implementa el conservador. |
| ADR-017 | Sin analítica de terceros, aunque Vercel la ofrezca en un clic | Confirmar que el equipo está de acuerdo en renunciar a métricas de uso de la demo a cambio de coherencia con la promesa de privacidad. |
| ADR-019 | Tercera categoría: sismo sentido, como agregado comunitario y no como detector | Confirmar con el equipo de contratos que `uint8 category` acepta el índice 2 y que ReportRegistry no valida un máximo de 2 categorías. |
| ADR-020 | La detección de distrito afirmaba con seguridad un distrito equivocado | Verificar en el celular, desde tu distrito real, que ahora aparece el correcto y que el margen de precisión que muestra es razonable. Si sigue fallando con ±20 m de precisión, avísame el distrito y la coordenada para ajustar el centroide. |
| ADR-021 | Login con Google opcional: da continuidad entre dispositivos, no identidad pública | Falta lo único que no puedo hacer yo: crear el cliente OAuth en Google Cloud Console y cargar AUTH_SECRET, AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET en Vercel. Pasos exactos en docs/DESPLIEGUE.md. Hasta entonces el login queda invisible y la app funciona igual. Confirmar también que al equipo le parece bien que la cuenta de Google sea privada y no el identificador público. |
| ADR-101 | Círculo de cuidado: aviso cuando pasa algo cerca de alguien de tu familia | Dos preguntas que SIGUEN ABIERTAS aunque la funcionalidad ya esté en producción (ver ADR-025). (1) Producto: ¿cómo se evita que se use para controlar a una pareja o a un hijo adolescente en vez de para cuidarlos? Sin una respuesta, la funcionalidad puede hacer más daño que bien. (2) Técnica: el tiempo real de verdad necesita servidor, y eso rompe la promesa de 'no hay servidor con tus datos'. Hay que decidir si se acepta ese costo o si se busca algo peer-to-peer. |
| ADR-102 | El círculo es la única parte de la app que exige cuenta | Decidir si al cerrar sesión se borran los contactos del dispositivo. Hoy se conservan y reaparecen al volver a entrar, que es cómodo pero deja teléfonos de terceros guardados en un equipo donde ya nadie inició sesión. |
| ADR-025 | El círculo de cuidado sale del laboratorio y entra a producción | Decidir cómo se presenta el círculo en el pitch. Si se muestra, hay que poder responder la pregunta de control vs cuidado delante del jurado; si no se responde bien, es la funcionalidad que más fácil se vuelve en contra. La alternativa es tenerla en la app pero no demostrarla. |
| ADR-027 | El acceso pasa a ser una puerta: sin cuenta no se entra | Confirmar que el equipo asume el intercambio: se gana una puerta clara y una identidad real que revelar, se pierde el argumento de "se reporta sin registro" que el pitch usaba como ventaja frente a las apps municipales. Si el jurado pregunta por friccion en una emergencia, hay que tener respuesta. |

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
| [ADR-008](#adr-008) | Dos categorías de reporte, ni una más | IA+Humano | reemplazada | alta | Producto y UX, Problema e impacto |
| [ADR-009](#adr-009) | Persistencia local en el dispositivo, sin base de datos | IA | aceptada | media | Implementacion tecnica, Producto y UX |
| [ADR-010](#adr-010) | El escalamiento a autoridad es una ruta API real con destino simulado | IA | aceptada | alta | Problema e impacto, Implementacion tecnica |
| [ADR-011](#adr-011) | Interfaz en español peruano y diseño mobile-first oscuro | IA | aceptada | alta | Producto y UX |
| [ADR-012](#adr-012) | Arbitrum como capa de asentamiento, no como adorno | IA | aceptada | baja | Ecosistema Arbitrum, Pitch y demo, Implementacion tecnica |
| [ADR-013](#adr-013) | Toda decisión de la IA queda registrada aquí antes de escribir el código | IA | aceptada | alta | Implementacion tecnica, Pitch y demo |
| [ADR-014](#adr-014) | Prueba de presencia: la beta mide corroboración, no tiempo de app abierta | IA | aceptada | alta | Implementacion tecnica, Problema e impacto, Ecosistema Arbitrum |
| [ADR-015](#adr-015) | El nombre del distrito se resuelve en el dispositivo, sin servicio de geocoding | IA | aceptada | alta | Producto y UX, Implementacion tecnica, Problema e impacto |
| [ADR-016](#adr-016) | Cabeceras de seguridad en next.config.ts, con una CSP honesta sobre lo que no protege | IA | aceptada | alta | Implementacion tecnica, Producto y UX |
| [ADR-017](#adr-017) | Sin analítica de terceros, aunque Vercel la ofrezca en un clic | IA | aceptada | alta | Problema e impacto, Pitch y demo, Implementacion tecnica |
| [ADR-018](#adr-018) | Vercel se configura solo; lo que sí bloquea el build es un secreto expuesto | IA | aceptada | alta | Implementacion tecnica, Pitch y demo |
| [ADR-019](#adr-019) | Tercera categoría: sismo sentido, como agregado comunitario y no como detector | IA+Humano | aceptada | alta | Problema e impacto, Producto y UX, Implementacion tecnica, Pitch y demo |
| [ADR-020](#adr-020) | La detección de distrito afirmaba con seguridad un distrito equivocado | IA+Humano | aceptada | alta | Producto y UX, Problema e impacto, Implementacion tecnica |
| [ADR-021](#adr-021) | Login con Google opcional: da continuidad entre dispositivos, no identidad pública | IA+Humano | reemplazada | alta | Producto y UX, Implementacion tecnica, Problema e impacto |
| [ADR-022](#adr-022) | Pantalla de bienvenida en el primer arranque, no una barrera de login | IA+Humano | reemplazada | alta | Producto y UX, Pitch y demo |
| [ADR-023](#adr-023) | Tu ubicación actual es visible siempre, con cuenta o sin ella | IA+Humano | aceptada | alta | Producto y UX, Problema e impacto |
| [ADR-024](#adr-024) | El mapa se aísla del resto de la interfaz y la app fija su escala de z-index | IA+Humano | aceptada | alta | Producto y UX, Implementacion tecnica |
| [ADR-101](#adr-101) | Círculo de cuidado: aviso cuando pasa algo cerca de alguien de tu familia | IA+Humano | aceptada | alta | Problema e impacto, Producto y UX, Implementacion tecnica |
| [ADR-102](#adr-102) | El círculo es la única parte de la app que exige cuenta | IA+Humano | aceptada | alta | Producto y UX, Problema e impacto, Implementacion tecnica |
| [ADR-025](#adr-025) | El círculo de cuidado sale del laboratorio y entra a producción | IA+Humano | aceptada | media | Producto y UX, Problema e impacto, Pitch y demo |
| [ADR-026](#adr-026) | El acceso deja de depender de la pantalla de bienvenida | IA+Humano | reemplazada | alta | Producto y UX, Pitch y demo |
| [ADR-027](#adr-027) | El acceso pasa a ser una puerta: sin cuenta no se entra | IA+Humano | aceptada | alta | Producto y UX, Pitch y demo, Problema e impacto |

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

`2026-08-06` · autor: **IA+Humano** · estado: **reemplazada** · reversibilidad: **alta**

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

---

## ADR-016

### Cabeceras de seguridad en next.config.ts, con una CSP honesta sobre lo que no protege

`2026-08-07` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** La app se despliega en Vercel y va a circular por WhatsApp. Sin cabeceras no hay ninguna política de seguridad. El riesgo real es el inverso al habitual: una directiva mal puesta rompe el mapa o el GPS delante del jurado, y eso cuesta más que la protección que aporta.

**Alternativas descartadas.**

- *Declarar las cabeceras en vercel.json* — Solo se verían en producción. En next.config.ts aplican también en `next start`, así que la política se prueba en local antes de desplegar — que es justo lo que permitió verificar que las teselas y la geolocalización siguen funcionando.
- *CSP estricta con nonces por middleware* — Exige un middleware.ts que volvería dinámicas las 5 rutas hoy estáticas, a cambio de un endurecimiento que no cabe verificar antes del 12 de agosto.
- *No poner CSP* — object-src 'none', base-uri 'self' y form-action 'self' valen aunque script-src lleve 'unsafe-inline'.

**Decision.** CSP y cabeceras en `next.config.ts`, solo en producción. script-src y style-src llevan 'unsafe-inline' porque Next serializa el payload RSC en scripts inline y los marcadores del mapa se pintan con atributo style; img-src incluye data: y blob: por las miniaturas de canvas y la vista previa de la foto. Los orígenes de Arbitrum y Pinata ya están permitidos para que la integración del equipo no falle en silencio. Permissions-Policy declara geolocation=(self) y camera=(self): verificado en el navegador con document.featurePolicy.allowsFeature(), no asumido.

**Consecuencias.**

- Verificado contra el build real: teselas 4/4, los 12 marcadores conservan color, cero violaciones en consola.
- Con 'unsafe-inline' la CSP no es defensa anti-XSS y hay que decirlo así en el pitch; lo que sí aporta es acotar orígenes, formularios y base URI.
- Se omiten a propósito X-Frame-Options, COEP y HSTS manual: romperían el iframe de las plataformas de hackathon, las teselas y un futuro dominio propio.
- Queda la válvula CSP_MODO=report-only para degradar sin tocar código si algo falla el 11 de agosto.

**Costo de revertir.** Bajo: una variable de entorno pasa la CSP a solo-reporte, o se borra el bloque headers().

**Sirve a.** Implementacion tecnica, Producto y UX

**Evidencia en el codigo.** `next.config.ts`

---

## ADR-017

### Sin analítica de terceros, aunque Vercel la ofrezca en un clic

`2026-08-07` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** Al configurar el despliegue, lo natural es añadir @vercel/analytics y @vercel/speed-insights: son de primera parte, pesan poco y se activan con una línea.

**Alternativas descartadas.**

- *Añadir Vercel Analytics y Speed Insights* — El producto promete que la ubicación del vecino no sale del dispositivo y que no hay servidor propio guardando nada. Incluir un script que reporta la navegación de cada usuario a un tercero contradice esa promesa, y es exactamente el tipo de detalle que un jurado atento encuentra revisando el bundle.
- *Añadirla solo en preview* — Complica la configuración para medir a un público que son cuatro personas del equipo.

**Decision.** No se instala analítica de terceros. Si en algún momento hace falta medir, se hace con métricas agregadas del lado del servidor, sin identificar sesiones, y se registra aquí antes.

**Consecuencias.**

- Coherencia entre lo que el pitch promete y lo que el bundle hace.
- Dos dependencias menos que puedan romper el build.
- No hay datos de uso de la demo: se acepta a cambio de no contradecir la propuesta de valor.

**Costo de revertir.** Bajo, pero exigiría revisar el discurso de privacidad del pitch.

**Sirve a.** Problema e impacto, Pitch y demo, Implementacion tecnica

**Evidencia en el codigo.** `package.json`, `src/app/layout.tsx`

> **Necesita decision humana:** Confirmar que el equipo está de acuerdo en renunciar a métricas de uso de la demo a cambio de coherencia con la promesa de privacidad.

---

## ADR-018

### Vercel se configura solo; lo que sí bloquea el build es un secreto expuesto

`2026-08-07` · autor: **IA** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** Hay que decidir cuánto configurar en vercel.json, si CI debe bloquear el despliegue y qué debería impedir que un build salga a producción.

**Alternativas descartadas.**

- *vercel.json con buildCommand, installCommand y outputDirectory* — Vercel detecta Next.js solo. Fijar esos comandos a mano añade tres formas de que el deploy se rompa al cambiar algo del proyecto, sin ganar nada.
- *Bloquear el despliegue con el resultado de GitHub Actions* — Un build roto ya no llega a producción: Vercel conserva el deployment anterior. Añadir un bloqueo es una vía más de fallo el día de la demo.
- *No validar el entorno* — Un secreto con prefijo NEXT_PUBLIC_ se publica en el bundle sin que nadie se entere.

**Decision.** `vercel.json` mínimo (solo `$schema` y `framework`). CI en GitHub Actions corre `npm run check` y `npm run build` como red de seguridad, sin bloquear el despliegue. Lo que sí aborta el build es `scripts/preflight-env.mjs`, y solo por dos motivos: un secreto con prefijo NEXT_PUBLIC_ o una NEXT_PUBLIC_SITE_URL malformada. Todo lo demás son avisos.

**Consecuencias.**

- El único build que se cae es el que publicaría un secreto o el que iba a fallar igual más adelante con un error peor.
- La región de las funciones se elige en el panel, no en vercel.json: un valor no soportado allí tumbaría el deploy.
- El equipo tiene los pasos del panel escritos en docs/DESPLIEGUE.md en vez de en un archivo que Vercel podría interpretar distinto.

**Costo de revertir.** Bajo.

**Sirve a.** Implementacion tecnica, Pitch y demo

**Evidencia en el codigo.** `vercel.json`, `.github/workflows/ci.yml`, `scripts/preflight-env.mjs`, `docs/DESPLIEGUE.md`

---

## ADR-019

### Tercera categoría: sismo sentido, como agregado comunitario y no como detector

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El equipo pidió incorporar reporte de sismos. ADR-008 había cerrado el catálogo en dos categorías, pero docs/PROYECTO.md sección 6 ya identificaba una versión liviana como la única viable antes del 12 de agosto: reportar 'lo sentí' reutilizando la infraestructura existente, al estilo del 'Did You Feel It?' del USGS.

**Alternativas descartadas.**

- *Motor de detección propio con acelerómetros* — Es procesamiento de señal e infraestructura de sensores en tiempo real, un proyecto aparte que además no usa el ecosistema Arbitrum — diluiría dos criterios de la rúbrica a la vez. docs/PROYECTO.md ya lo descartaba.
- *Ensanchar el radio de corroboración para sismos* — Un sismo lo siente toda la ciudad, así que el radio tendría que ser de decenas de kilómetros — y entonces dos cuentas cualesquiera de Lima se corroborarían entre sí. Sería un agujero anti-Sybil a cambio de nada, porque el panel comunitario no reparte tokens.
- *Añadir un campo de intensidad al reporte* — Cambiaría el modelo de dominio y el payload canónico que el equipo de contratos está portando. La intensidad se captura con chips que rellenan la descripción: mismo valor de interfaz, cero cambios en el contrato.

**Decision.** Se agrega `sismo_sentido` con `indiceContrato: 2` (los índices ya escritos en cadena no se reordenan). El panel 'lo sentiste' aparece cuando dos o más vecinos distintos reportan en 30 minutos y muestra el agregado por zona y la intensidad más repetida. Es informativo: la recompensa se calcula con las mismas reglas anti-Sybil que cualquier otra categoría, sin excepciones.

**Consecuencias.**

- Reutiliza mapa, hash, anclaje y recompensa sin código nuevo en la capa de cadena.
- El texto dice siempre 'vecinos reportaron', nunca 'se detectó un sismo de magnitud X': la app no puede saber eso.
- Los reportes de sismo rara vez alcanzarán el multiplicador, porque exige otro vecino a menos de 300 m. Es el precio consciente de no debilitar el anti-Sybil.
- El pitch pasa de 'roadmap futuro' a 'ya funciona', con el límite declarado de que cuenta reportes, no mide sismos.
- Reemplaza a ADR-008: el catálogo queda en tres categorías.

**Costo de revertir.** Bajo: quitar la entrada del catálogo. El índice 2 quedaría reservado y no se reutiliza.

**Sirve a.** Problema e impacto, Producto y UX, Implementacion tecnica, Pitch y demo

**Evidencia en el codigo.** `src/lib/categorias.ts`, `src/lib/sismos.ts`, `src/lib/sismos.test.ts`, `src/components/sismos/AvisoSismo.tsx`

> **Necesita decision humana:** Confirmar con el equipo de contratos que `uint8 category` acepta el índice 2 y que ReportRegistry no valida un máximo de 2 categorías.

---

## ADR-020

### La detección de distrito afirmaba con seguridad un distrito equivocado

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** Un miembro del equipo reportó desde su ubicación real y la app lo ubicó en Miraflores. La causa estaba en la implementación de ADR-015: `nombreDeZona()` elegía el más cercano de solo 16 distritos de referencia, con un radio de tolerancia de 12 km. Desde casi cualquier punto de Lima hay un centroide de esa lista a menos de 12 km, así que la función nunca decía 'no sé' y siempre afirmaba un distrito — con frecuencia el equivocado. Quien estaba en Surquillo, Barranco, San Borja, Lince o Jesús María aparecía en Miraflores. No es un detalle estético: la etiqueta de zona viaja en el aviso que recibe la autoridad.

**Alternativas descartadas.**

- *Geocodificación inversa con un servicio externo* — Sigue vigente la razón de ADR-015: enviaría la coordenada exacta del vecino a un tercero en cada reporte, que es justo lo que el producto promete no hacer.
- *Solo ampliar la lista de distritos* — Reduce el error pero no lo elimina: en distritos grandes el centroide queda lejos del borde. Sin admitir la incertidumbre, la app seguiría afirmando con seguridad algo que a veces es falso.
- *Mostrar solo las coordenadas y quitar el nombre* — Un par de números no le sirve ni al vecino ni al serenazgo que recibe el aviso.

**Decision.** Tres cambios juntos. (1) La lista pasa de 16 a 49 referencias, cubriendo Lima Metropolitana y el Callao. (2) El radio de confianza baja a 2.5 km y el máximo a 8 km: más allá el texto dice 'Cerca de X' o 'Zona sin referencia' en vez de afirmar. (3) La app muestra la precisión que reporta el navegador y avisa cuando supera los 200 m, porque en una laptop la ubicación viene por wifi y ningún catálogo de distritos puede arreglar un error de kilómetros. Además el vecino puede corregir el distrito a mano antes de publicar.

**Consecuencias.**

- Siete distritos que antes caían en Miraflores ahora resuelven bien, con tests de regresión que lo fijan.
- La app admite cuando no está segura, en vez de inventar con confianza.
- La corrección manual cambia solo la etiqueta que se muestra y se envía a la autoridad; `zonaId`, que alimenta el límite anti-Sybil por zona, se sigue derivando de la coordenada. Si fuera editable sería un modo trivial de saltarse el límite.
- Queda un límite conocido: cerca del borde de un distrito grande la estimación puede seguir apuntando al vecino de al lado. Por eso lo que se envía a la autoridad es la coordenada, no el nombre.

**Costo de revertir.** Bajo: es una función pura de un solo archivo con sus tests.

**Sirve a.** Producto y UX, Problema e impacto, Implementacion tecnica

**Evidencia en el codigo.** `src/lib/zonas.ts`, `src/lib/zonas.test.ts`, `src/components/reportar/FlujoReporte.tsx`

> **Necesita decision humana:** Verificar en el celular, desde tu distrito real, que ahora aparece el correcto y que el margen de precisión que muestra es razonable. Si sigue fallando con ±20 m de precisión, avísame el distrito y la coordenada para ajustar el centroide.

---

## ADR-021

### Login con Google opcional: da continuidad entre dispositivos, no identidad pública

`2026-08-07` · autor: **IA+Humano** · estado: **reemplazada** · reversibilidad: **alta**

**Contexto.** El equipo pidió incorporar login de usuario, con Google como método suficiente. El riesgo evidente es contradecir la promesa central del producto: identidad pseudónima por defecto. Un login mal planteado convertiría a Vecino Seguro en una app más que sabe quién eres.

**Alternativas descartadas.**

- *Que la cuenta de Google sea la identidad pública del vecino* — Rompe el diseño acordado en ADR-005 y la razón de ser del proyecto. Nadie reporta a un vecino peligroso con su nombre y foto al lado.
- *Login obligatorio* — Cada paso previo al primer reporte cuesta usuarios, y el producto presume de no pedir registro. Reportar tiene que seguir funcionando sin cuenta.
- *Integrar Privy o Web3Auth ahora* — Es lo correcto para producción y sigue en el roadmap, pero exige configuración de dashboard que el equipo aún no tiene. Google resuelve hoy lo que se pidió.
- *Guardar las cuentas en una base de datos* — Crearía justo lo que el producto promete no tener: un servidor con los datos de los vecinos, que alguien puede pedir o filtrar.

**Decision.** Auth.js v5 con Google, opcional. La sesión es un JWT en cookie firmada, sin base de datos. El alias público se deriva por SHA-256 del identificador de la cuenta, así que entrar desde otro teléfono devuelve el MISMO seudónimo y los mismos reportes propios — que es lo que resuelve el login. La cuenta de Google nunca se muestra a la red ni toca la cadena: es exactamente la identidad real que IdentityEscrow custodiaría bajo 2-de-3.

**Consecuencias.**

- Wallet abstraction demostrable hoy: continuidad entre dispositivos sin que nadie vea una seed phrase.
- La app sigue funcionando sin credenciales configuradas: el botón no aparece y todos usan su seudónimo local.
- La disponibilidad del proveedor se consulta a /api/auth/providers en runtime. Leer process.env en el layout no bastaba: las páginas son estáticas y el valor quedaba horneado en el build — verificado fallando antes de corregirlo.
- Las 12 rutas siguen estáticas: no se usa middleware ni auth() en server components.
- La derivación del alias es de demostración, no una KDF: produce un identificador estable, no una llave con la que firmar.
- Quien opera la plataforma podría vincular cuenta y alias, porque la derivación es pública. Es el mismo supuesto que ya asume IdentityEscrow, y hay que decirlo así.

**Costo de revertir.** Bajo: quitar el proveedor deja a todos con su seudónimo local, que es el camino por defecto y nunca se retiró.

**Sirve a.** Producto y UX, Implementacion tecnica, Problema e impacto

**Evidencia en el codigo.** `src/auth.ts`, `src/lib/identidad.ts`, `src/lib/identidad.test.ts`, `src/components/cuenta/AccesoGoogle.tsx`, `src/components/proveedores/SesionProvider.tsx`

> **Necesita decision humana:** Falta lo único que no puedo hacer yo: crear el cliente OAuth en Google Cloud Console y cargar AUTH_SECRET, AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET en Vercel. Pasos exactos en docs/DESPLIEGUE.md. Hasta entonces el login queda invisible y la app funciona igual. Confirmar también que al equipo le parece bien que la cuenta de Google sea privada y no el identificador público.

---

## ADR-022

### Pantalla de bienvenida en el primer arranque, no una barrera de login

`2026-08-07` · autor: **IA+Humano** · estado: **reemplazada** · reversibilidad: **alta**

**Contexto.** Al probar la app, el equipo esperaba ver el login al abrirla y no lo encontró. El acceso vivía dentro de la pestaña Cuenta (ADR-021) y había que ir a buscarlo: existía pero era invisible. El problema real no era la falta de login, era la falta de presentación.

**Alternativas descartadas.**

- *Login obligatorio al iniciar* — Rompe la promesa central de que se puede reportar sin registro, que está en el pitch y escrita en la propia pantalla de Cuenta. Además mete fricción justo antes de la acción que la app existe para hacer, y penaliza el criterio de UX.
- *Dejarlo solo en la pestaña Cuenta* — Es lo que ya estaba y el equipo comprobó en la práctica que nadie lo encuentra.
- *Mostrar la bienvenida solo si Google está configurado* — Hoy no lo está, así que no se vería nada y el problema seguiría igual. Además la pantalla vale por sí sola como presentación del producto, que la app no tenía.

**Decision.** Pantalla a pantalla completa en el primer arranque, una sola vez, con la propuesta de valor en tres líneas y dos salidas: 'Continuar con Google' y 'Entrar sin cuenta'. No bloquea: descartarla deja la app completa. Si no hay credenciales de Google, la pantalla igual aparece y lo dice, en vez de fingir que el login no existe.

**Consecuencias.**

- El acceso deja de ser invisible sin convertirse en un peaje.
- La app gana la presentación que le faltaba: quien la abre por primera vez entiende qué es antes de tocar nada.
- Un toque extra en el primer arranque. Solo una vez, y la bandera vive en el dispositivo.
- Quien ya entró con Google no la ve nunca.
- Se lee después de montar para no romper la hidratación: las páginas siguen siendo estáticas.

**Costo de revertir.** Bajo: se quita un componente del layout.

**Sirve a.** Producto y UX, Pitch y demo

**Evidencia en el codigo.** `src/components/bienvenida/PantallaBienvenida.tsx`, `src/app/layout.tsx`

---

## ADR-023

### Tu ubicación actual es visible siempre, con cuenta o sin ella

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** Ver dónde estás solo era posible pulsando un icono pequeño en una esquina del mapa, y el resultado se perdía al cambiar de pestaña. El equipo pidió que la ubicación se vea siempre y que no dependa de estar logueado. Es coherente con el producto: la app promete funcionar completa sin registro, así que atar la ubicación a la sesión sería incoherente.

**Alternativas descartadas.**

- *Pedir el permiso automáticamente al abrir la app* — Un navegador que recibe la petición sin gesto previo del usuario suele bloquearla de forma permanente. Se perdería la ubicación para siempre a cambio de ahorrar un toque.
- *Dejar el estado dentro del componente del mapa* — Se perdía al navegar y no servía para el resto de pantallas.
- *getCurrentPosition en vez de watchPosition* — Da una foto fija. 'Mi ubicación actual' implica que se mantenga al día mientras la persona camina.

**Decision.** `UbicacionProvider` vive en el layout, FUERA del proveedor de sesión, para que quede claro en el código que no depende del login. Al montar consulta el estado del permiso —lo que no abre ninguna ventana— y solo si ya estaba concedido empieza a seguir la posición; si no, espera al gesto del usuario. Se muestra en Inicio con el distrito y el margen de precisión, y en el mapa con el punto y su círculo de incertidumbre.

**Consecuencias.**

- La ubicación sobrevive al cambio de pestaña: se pide una vez, no en cada pantalla.
- El flujo de reporte arranca con la posición ya conocida y aun así pide una lectura fresca: en una emergencia, esperar al GPS con la pantalla en blanco es lo que hace que la gente cierre la app.
- Se dibuja el margen de error real en vez de fingir un punto exacto.
- Verificado con el permiso denegado (explica cómo reactivarlo) y con GPS simulado: 'Estas en Surquillo · ±24 m', punto en el mapa y persistencia entre pestañas, todo sin sesión iniciada.
- watchPosition consume más batería que una lectura puntual. Aceptable para el MVP; si el uso crece habrá que revisarlo.

**Costo de revertir.** Bajo: es un proveedor y dos componentes de presentación.

**Sirve a.** Producto y UX, Problema e impacto

**Evidencia en el codigo.** `src/components/proveedores/UbicacionProvider.tsx`, `src/components/ubicacion/TarjetaUbicacion.tsx`, `src/components/mapa/MapaReportes.tsx`

---

## ADR-024

### El mapa se aísla del resto de la interfaz y la app fija su escala de z-index

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El equipo reportó errores de compatibilidad entre pantallas, sobre todo en el mapa. La auditoría encontró la causa común: Leaflet trae su propia escala de z-index (paneles 200-700, controles 800-1000) y su contenedor no crea contexto de apilamiento, así que convivía en el mismo plano que la barra de pestañas (50), la hoja de detalle (60) y la bienvenida (100). Además, dos reglas del tema oscuro apuntaban a `.mapa-oscuro .leaflet-container` con combinador descendiente, pero react-leaflet pone ambas clases en el MISMO div: nunca aplicaron, y el mapa se veía con el gris #ddd de Leaflet y la atribución en blanco sobre fondo oscuro.

**Alternativas descartadas.**

- *Subir los overlays de la app por encima de 1000* — Es una carrera armamentística: cada librería que se agregue vuelve a competir. Aislar el mapa resuelve la clase entera de una vez.
- *Sobrescribir los z-index de Leaflet uno por uno* — Frágil ante cualquier actualización de la librería y difícil de razonar seis días antes de una demo.
- *Dejarlo como estaba porque en portrait no se notaba* — El recorte por overflow ocultaba el problema, no lo resolvía. Bastaba una hoja a pantalla completa o un cambio de alto para que apareciera.

**Decision.** El contenedor del mapa lleva `isolate`, así que todo lo de Leaflet queda encerrado en su caja y no puede competir con el chrome de la app. La escala de la app (10 / 50 / 60 / 100) queda documentada en globals.css. Los selectores del tema pasan a `.mapa-oscuro.leaflet-container` sin espacio. Se añade un ResizeObserver que llama a `invalidateSize()`, porque Leaflet mide su contenedor una sola vez y `h-[46dvh]` cambia cuando se oculta la barra del navegador móvil.

**Consecuencias.**

- Verificado: el fondo del mapa pasó de rgb(221,221,221) a rgb(10,12,15) y la atribución de blanco a oscuro.
- Cualquier overlay futuro solo tiene que respetar la escala documentada; ya no hay que pensar en Leaflet.
- Se corrigieron además dos fallos que dejaban la app inutilizable: la pantalla de bienvenida sin scroll (en horizontal el botón de entrar quedaba fuera y no había salida) y la píldora de estado saliéndose de su tarjeta en Arquitectura.
- El mapa ahora recuerda el encuadre del usuario: filtrar o cerrar un reporte ya no lo devuelve de un salto a otro sitio.
- Lección para el equipo: con react-leaflet, el className que se le pasa aterriza en el mismo elemento que `.leaflet-container`. Nunca usar combinador descendiente para estilarlo.

**Costo de revertir.** Bajo: son clases y selectores, sin cambios de arquitectura.

**Sirve a.** Producto y UX, Implementacion tecnica

**Evidencia en el codigo.** `src/app/globals.css`, `src/components/mapa/MapaReportes.tsx`, `src/components/mapa/MapaLeaflet.tsx`, `src/components/bienvenida/PantallaBienvenida.tsx`, `src/components/arquitectura/PanelArquitectura.tsx`

---

## ADR-101

### Círculo de cuidado: aviso cuando pasa algo cerca de alguien de tu familia

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El equipo quiere probar una idea que no estaba contemplada: si alguien comparte su ubicación contigo, recibir un aviso cuando ocurre un reporte cerca de ESA persona, con su teléfono a un toque para llamarla. Tipo family care. Nació como exploración en la rama Lab_Dai; ADR-025 registra su promoción a producción. La numeración 1xx marca decisiones de ramas experimentales.

**Alternativas descartadas.**

- *Backend en tiempo real (Supabase, Pusher, Firebase)* — Es lo que haría falta para que la ubicación viaje de verdad entre dispositivos, pero contradice ADR-009 (sin base de datos) y crearía justo lo que el producto promete no tener: un servidor con las ubicaciones de las familias. Para un experimento no se justifica; si la idea prospera, esa es la conversación seria que hay que tener.
- *Compartir la ubicación en cadena* — Publicar dónde está tu madre en un registro inmutable y público es exactamente lo contrario de lo que la app defiende.
- *Radio de aviso fijo* — No es lo mismo cuidar a alguien en una avenida que en un pasaje. El radio lo elige quien recibe el aviso: 200 m, 500 m, 1 km o 2 km.

**Decision.** Se implementa completo salvo el transporte. La geometría, la frescura de la ubicación, la evaluación de cercanía y la deduplicación de avisos son funciones puras con 20 tests. Lo único simulado es que la posición del contacto se mueve localmente con una trayectoria determinista; en la versión real llegaría desde su dispositivo y ese archivo desaparece. Los avisos usan la Notification API real del navegador más un panel dentro de la app. Los teléfonos se guardan solo en el dispositivo.

**Consecuencias.**

- Sexta pestaña 'Círculo': es la excepción declarada al límite de cinco de CLAUDE.md, y solo en esta rama. Verificado que las seis entran en 360 px sin truncarse.
- Compartir nace desactivado: es decisión del contacto, no de quien lo agrega. Coherente con el resto del producto.
- El mapa muestra a los contactos con su radio de aviso dibujado, y late en rojo cuando tienen un reporte dentro.
- Un mismo reporte avisa una sola vez por contacto: la clave contacto+reporte se recuerda entre recargas.
- Los avisos no llegan con la app cerrada. Para eso harían falta push notifications con service worker y un servidor que las envíe.
- Riesgo de producto que hay que discutir antes de sacarlo del laboratorio: una app que muestra dónde está tu familia es también una herramienta de control. El consentimiento revocable por el contacto es el mínimo, y probablemente no basta.

**Costo de revertir.** Bajo: la rama se descarta o se quitan la pestaña y el proveedor. Nada de main depende de esto.

**Sirve a.** Problema e impacto, Producto y UX, Implementacion tecnica

**Evidencia en el codigo.** `src/lib/circulo.ts`, `src/lib/circulo.test.ts`, `src/lib/circulo-simulacion.ts`, `src/components/circulo/PanelCirculo.tsx`, `src/components/proveedores/CirculoProvider.tsx`

> **Necesita decision humana:** Dos preguntas que SIGUEN ABIERTAS aunque la funcionalidad ya esté en producción (ver ADR-025). (1) Producto: ¿cómo se evita que se use para controlar a una pareja o a un hijo adolescente en vez de para cuidarlos? Sin una respuesta, la funcionalidad puede hacer más daño que bien. (2) Técnica: el tiempo real de verdad necesita servidor, y eso rompe la promesa de 'no hay servidor con tus datos'. Hay que decidir si se acepta ese costo o si se busca algo peer-to-peer.

---

## ADR-102

### El círculo es la única parte de la app que exige cuenta

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El equipo pidió que la pestaña Círculo solo se vea con la autenticación de Google activa. Choca de frente con la regla del producto —todo funciona sin registro— así que hacía falta una razón que no fuera 'porque sí'.

**Alternativas descartadas.**

- *Mostrar el círculo siempre, como el resto* — Es lo que había, y guardaba teléfonos de familiares en un dispositivo sin ninguna cuenta detrás que permitiera revocarlos.
- *Ocultar solo la pestaña y dejar la ruta accesible* — Seguridad por oscuridad: la URL sigue funcionando y el proveedor seguiría emitiendo avisos en segundo plano.
- *Extender el requisito de cuenta al resto de la app* — Rompería la promesa central. La excepción se justifica por el dato que maneja el círculo, no por comodidad de implementación.

**Decision.** Sin sesión de Google: la pestaña no aparece (la barra vuelve a cinco), `/circulo` muestra una pantalla que explica por qué se pide la cuenta y ofrece entrar, y el proveedor no carga contactos, no corre el latido y no emite ningún aviso. La razón se dice en pantalla: aquí viven los teléfonos de tu familia y las posiciones que te comparten, y una cuenta detrás es lo que permite revocarlo.

**Consecuencias.**

- Con ADR-027 la app entera exige cuenta, asi que esto dejo de ser una excepcion; el circulo sigue siendo la parte que justifica el requisito por el dato que maneja.
- Le da al login un propósito visible más allá de recuperar el alias.
- El bloqueo es real, no cosmético: sin sesión el proveedor no ejecuta nada.
- Los contactos guardados sobreviven en el dispositivo tras cerrar sesión y reaparecen al volver a entrar. Es discutible: lo estricto sería borrarlos al salir.
- En un despliegue sin credenciales de Google el círculo queda inaccesible por completo. Es correcto, pero conviene saberlo antes de una demo.

**Costo de revertir.** Bajo: es un booleano derivado de la sesión.

**Sirve a.** Producto y UX, Problema e impacto, Implementacion tecnica

**Evidencia en el codigo.** `src/components/proveedores/CirculoProvider.tsx`, `src/components/navegacion/BarraPestanas.tsx`, `src/components/circulo/PanelCirculo.tsx`

> **Necesita decision humana:** Decidir si al cerrar sesión se borran los contactos del dispositivo. Hoy se conservan y reaparecen al volver a entrar, que es cómodo pero deja teléfonos de terceros guardados en un equipo donde ya nadie inició sesión.

---

## ADR-025

### El círculo de cuidado sale del laboratorio y entra a producción

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **media**

**Contexto.** El login con Google quedó funcionando en producción pero no en el preview de Lab_Dai: las variables de entorno de Vercel se asignan por entorno, no por rama, y el preview además está detrás de Deployment Protection y tiene otro dominio que Google no reconoce como callback. Arreglarlo exigía duplicar variables, registrar otra URI de redirección y convivir con un muro de SSO. El equipo decidió que era más simple llevar la rama a producción, donde las credenciales y el callback ya funcionan.

**Alternativas descartadas.**

- *Duplicar las variables en el entorno Preview y registrar el callback del preview en Google* — Tres pasos de configuración, un dominio más en el cliente OAuth de producción y un preview que igual no se puede compartir por Deployment Protection. Mucha ceremonia para una rama.
- *Probar el círculo solo en local con localhost, que ya está registrado* — Es lo que yo habría hecho para iterar, pero no permite probarlo desde un teléfono real ni enseñárselo a nadie, que es justo lo que el equipo quiere hacer.
- *Cambiar la rama de producción de Vercel a Lab_Dai* — Deja main sin desplegar y convierte una rama de laboratorio en la fuente de verdad. Confuso para el equipo de contratos, que espera main.

**Decision.** Se fusiona Lab_Dai en main. El círculo pasa a ser funcionalidad de producto: seis pestañas (la de Círculo solo con sesión iniciada), ADR-101 pasa de propuesta a aceptada, y se limpian de todo el repositorio las afirmaciones de que es una rama experimental fuera de alcance.

**Consecuencias.**

- El círculo funciona en el dominio de producción sin tocar ni una variable ni el cliente OAuth.
- Entra en la demo del 12 de agosto, con lo que el pitch debe cubrirlo en vez de ignorarlo.
- Las dos preguntas de producto de ADR-101 siguen SIN responder: cómo se evita que se use para controlar en vez de cuidar, y si se acepta el servidor que exige el tiempo real de verdad. Que esté en producción no las cierra.
- Sigue siendo la única parte de la app que exige cuenta, y sigue estando simulado el transporte de la ubicación del contacto. Ambas cosas están etiquetadas dentro del producto.
- La rama Lab_Dai deja de ser necesaria; queda como historia.

**Costo de revertir.** Medio: hay que quitar la pestaña, el proveedor y sus datos sembrados, y revisar el pitch. Nada de la cadena depende de esto.

**Sirve a.** Producto y UX, Problema e impacto, Pitch y demo

**Evidencia en el codigo.** `src/app/circulo/page.tsx`, `src/components/proveedores/CirculoProvider.tsx`, `CLAUDE.md`, `README.md`

> **Necesita decision humana:** Decidir cómo se presenta el círculo en el pitch. Si se muestra, hay que poder responder la pregunta de control vs cuidado delante del jurado; si no se responde bien, es la funcionalidad que más fácil se vuelve en contra. La alternativa es tenerla en la app pero no demostrarla.

---

## ADR-026

### El acceso deja de depender de la pantalla de bienvenida

`2026-08-07` · autor: **IA+Humano** · estado: **reemplazada** · reversibilidad: **alta**

**Contexto.** El equipo abrio la web y no encontro forma de entrar ni de elegir modo demostracion. La causa: la pantalla de bienvenida de ADR-022 solo aparece una vez por dispositivo, y una vez descartada el unico acceso volvia a estar escondido dentro de la pestana Cuenta. Es el mismo problema que ADR-022 pretendia resolver, reaparecido en cuanto alguien ya habia visitado el sitio.

**Alternativas descartadas.**

- *Mostrar la bienvenida en cada visita hasta que la persona inicie sesion* — Convierte en peaje recurrente algo que se diseno para no serlo, y castiga justamente a quien decidio usar la app sin cuenta, que es el camino por defecto del producto.
- *Poner el boton de Google en todas las cabeceras* — El acceso compite con el indicador de red y con la accion de cada pantalla. Inicio es donde tiene sentido, porque es la pantalla de presentacion.
- *Dejarlo como estaba y explicar que hay que ir a Cuenta* — Si una persona del propio equipo no lo encuentra, un jurado tampoco.

**Decision.** Entrada permanente en la cabecera de Inicio: un boton Entrar cuando no hay sesion, y el avatar con enlace a Cuenta cuando la hay. No bloquea nada. Ademas, Cuenta gana un boton para volver a ver la bienvenida, pensado para ensayar la demo desde el principio. La clave de localStorage se mueve a src/lib/bienvenida.ts para que pantalla y boton no se desincronicen.

**Consecuencias.**

- Entrar es visible desde el primer segundo sin convertirse en una barrera.
- Se puede ensayar la demo desde la pantalla de bienvenida las veces que haga falta.
- Si no hay credenciales de Google configuradas, el boton no aparece: la app sigue funcionando con el alias local.
- El indicador de red baja a su propia linea en Inicio para no competir con el acceso.

**Costo de revertir.** Bajo: un componente y una linea en la cabecera.

**Sirve a.** Producto y UX, Pitch y demo

**Evidencia en el codigo.** `src/components/inicio/AccesoRapido.tsx`, `src/lib/bienvenida.ts`, `src/app/page.tsx`, `src/components/cuenta/PanelCuenta.tsx`

---

## ADR-027

### El acceso pasa a ser una puerta: sin cuenta no se entra

`2026-08-07` · autor: **IA+Humano** · estado: **aceptada** · reversibilidad: **alta**

**Contexto.** El equipo probo la pantalla de bienvenida de ADR-022 y la describio como "un popup en lugar de una seccion que limita el acceso". La observacion tiene dos partes y ambas eran correctas: se comportaba como aviso descartable en vez de puerta, y ademas SE SENTIA como popup porque la app se renderizaba primero y la pantalla aparecia encima medio segundo despues.

**Alternativas descartadas.**

- *Mantener la bienvenida descartable de ADR-022* — Es lo que habia y el equipo, que es quien decide el producto, pidio explicitamente lo contrario tras verlo funcionando.
- *Puerta solo en las pantallas sensibles* — Deja la incoherencia de tener media app abierta y media cerrada, y obliga a explicar en cada pantalla por que si o por que no.
- *Puerta sin valvula de escape* — Un despliegue sin credenciales de Google —o cualquiera trabajando en local sin .env— quedaria con la aplicacion entera inaccesible y sin forma de diagnosticarlo desde dentro.

**Decision.** Sin sesion no se entra. La puerta se resuelve ANTES de pintar nada de la app: mientras se consulta la sesion se muestra una espera sobria, y solo entonces se decide entre la puerta y el contenido, de modo que nunca se ve la app por debajo. Si el despliegue no tiene credenciales de Google, la puerta deja pasar.

**Consecuencias.**

- Se acabo la sensacion de ventana emergente: el orden de render es lo que la producia, no el estilo.
- La promesa de "reportar sin registro" deja de ser cierta y se reescribio en todos los sitios donde estaba: pantallas, README, guion del pitch y datos de arquitectura. Sostenerla habria sido mentir en la demo.
- Se pierde el argumento de friccion cero, que sumaba en el criterio de UX. A cambio se gana coherencia con la revelacion selectiva: ahora si existe una identidad real que revelar bajo orden judicial, cosa que un seudonimo puramente local no tenia.
- Reemplaza a ADR-022 y a ADR-026, y deja obsoleta la parte de ADR-021 que declaraba el login opcional.
- El circulo (ADR-102) deja de ser la excepcion que exige cuenta, porque ahora la exige toda la app.

**Costo de revertir.** Bajo en codigo —quitar el envoltorio del layout— pero habria que volver a reescribir los textos. Conviene no ir y venir.

**Sirve a.** Producto y UX, Pitch y demo, Problema e impacto

**Evidencia en el codigo.** `src/components/acceso/PuertaAcceso.tsx`, `src/app/layout.tsx`, `docs/PITCH.md`

> **Necesita decision humana:** Confirmar que el equipo asume el intercambio: se gana una puerta clara y una identidad real que revelar, se pierde el argumento de "se reporta sin registro" que el pitch usaba como ventaja frente a las apps municipales. Si el jurado pregunta por friccion en una emergencia, hay que tener respuesta.
