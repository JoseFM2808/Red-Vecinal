<!-- GENERADO AUTOMATICAMENTE desde src/data/arquitectura.json — no editar a mano. Corre `npm run docs`. -->

# Arquitectura — Vecino Seguro

**Version:** 0.1.0-beta.2 · **Actualizado:** 2026-08-09

Red vecinal de reporte de seguridad. El vecino reporta en 3 toques desde el celular; la evidencia se sube a IPFS, su hash se ancla en Arbitrum y la red vecinal se entera al instante. Un botón aparte escala a serenazgo o policía. Nadie ve quién reportó salvo que el propio usuario lo autorice o exista una orden judicial verificable.

## El problema

> Complementamos al serenazgo donde no llega o no genera confianza. No lo reemplazamos.

- **5,600 habitantes por agente de serenazgo en San Juan de Lurigancho** — Villa El Salvador, Comas, San Juan de Miraflores, Chorrillos, El Agustino, Carabayllo y San Martín de Porres superan los 2,000 hab/agente. En San Isidro o Miraflores la proporción es muchísimo menor.
  <br>Fuente: docs/PROYECTO.md — cobertura desigual de serenazgo
- **57% de peruanos desconfía del serenazgo** — Con casos documentados de corrupción dentro del propio servicio. Reportar a una sola institución no es una opción neutral para mucha gente.
  <br>Fuente: IEP, 2025 (citado en docs/PROYECTO.md)
- **Las apps municipales existentes dependen 100% del serenazgo** — Alerta Surco, Alerta Chorrillos, Alerta Pueblo Libre y similares usan al municipio para reportar, validar y responder. No cubren el vacío donde el serenazgo es débil.
  <br>Fuente: docs/PROYECTO.md — panorama competitivo
- **Ningún producto combina geolocalización + evidencia inmutable + validación sin institución única** — ResPública Seguridad (Argentina), AnonReport y las redes DePIN tipo Hivemapper resuelven piezas sueltas del problema.
  <br>Fuente: docs/PROYECTO.md — análisis de alternativas

### Para quien

| Perfil | Que necesita |
| --- | --- |
| Vecino de un distrito con cobertura débil | Avisar rápido y sin exponerse a represalias del denunciado. |
| Junta vecinal o directiva de condominio | Ver patrones por zona y coordinar respuesta sin depender de un grupo de WhatsApp caótico. |
| Serenazgo o comisaría | Recibir avisos georreferenciados con evidencia que sirva como prueba, no rumores. |
| Municipio, aseguradora u ONG | Mapas de riesgo agregados y anonimizados para decidir dónde invertir. |

## Principios

- Pseudónimo por defecto: la identidad real nunca toca la cadena.
- El reporte vale porque es verificable, no porque lo firme una institución.
- Doble ruta: la red vecinal y la autoridad son caminos paralelos, no excluyentes.
- Lo simulado se etiqueta como simulado, dentro del producto.
- Toda pieza que otro equipo va a reemplazar vive detrás de una interfaz.
- La recompensa premia presencia verificable, no tiempo de app abierta.

## Capas

### Interfaz mobile-first `ui` — Listo

Seis pestañas (la de Círculo solo con sesión iniciada), flujo de reporte en 3 pasos, mapa y panel de arquitectura. Diseñada para una mano, de noche, con prisa.

- Tecnologias: Next.js 15 (App Router), React 19, Tailwind CSS 4
- Codigo: `src/app`, `src/components`

### Dominio y reglas `dominio` — Listo

Tipos del reporte, catálogo de categorías, hash canónico, geometría de zonas y política anti-Sybil. Funciones puras, con tests, sin dependencias.

- Tecnologias: TypeScript estricto, Vitest
- Codigo: `src/lib/tipos.ts`, `src/lib/hash.ts`, `src/lib/geo.ts`, `src/lib/antisybil.ts`

### Estado y persistencia `estado` — Simulado

Repositorio de reportes con persistencia en el dispositivo, más el índice compartido leído de la cadena en modo arbitrum. Los datos sembrados de demostración existen solo con NEXT_PUBLIC_DATOS_DEMO=1 (ADR-040): en la prueba real la red muestra únicamente reportes reales.

- Tecnologias: React Context, localStorage
- Codigo: `src/lib/repositorio.ts`, `src/lib/seed.ts`, `src/components/proveedores/AppProvider.tsx`

### Capa de cadena (Arbitrum) `cadena` — Listo

Interfaz ChainAdapter: anclar reporte, consultar recompensa, resolver enlaces al explorador, leer el índice compartido. Los tres contratos están desplegados y verificados en Arbitrum Sepolia (2026-08-08) y ya registran reportes reales de la prueba de campo. ArbitrumChainAdapter firma con la wallet embebida de Privy (ADR-050) — o con una inyectada si existe — y el gas llega solo por el grifo automático (ADR-051). Gas medido del anclaje: 216,804 por submitReport. En producción (Vercel) el modo arbitrum se activa al cargar las variables y redesplegar; hasta entonces solo producción sigue en simulado, con el respaldo etiquetado del ADR-049 para quien no tenga firma.

- Tecnologias: Arbitrum Sepolia (421614), Arbitrum One (42161), viem, Privy (wallet embebida)
- Codigo: `src/lib/chain/types.ts`, `src/lib/chain/mock-adapter.ts`, `src/lib/chain/arbitrum-adapter.ts`, `src/lib/chain/proveedor-inyectado.ts`, `src/lib/chain/eventos.ts`, `src/lib/chain/redes.ts`, `src/lib/chain/abis.ts`, `src/components/proveedores/ProveedorPrivy.tsx`

### Evidencia (IPFS) `storage` — Simulado

Sube foto o video y devuelve un CID. La beta usa un adaptador local que produce un CID determinista desde el hash del archivo.

- Tecnologias: IPFS, Pinata (a integrar)
- Codigo: `src/lib/storage/types.ts`, `src/lib/storage/mock-adapter.ts`

### Puente con la autoridad `escalamiento` — Simulado

Ruta API que valida el aviso y genera folio para serenazgo, policía o ambulancia. Reenvía a un webhook real si está configurado.

- Tecnologias: Next.js Route Handler
- Codigo: `src/app/api/escalamiento/route.ts`

### Identidad, acceso y revelación selectiva `identidad` — Simulado

Puerta de acceso selectiva con Google (ADR-035, amend de ADR-027): navegar la app es libre, reportar y el circulo exigen sesion. El alias publico se deriva de la cuenta, asi que entrar desde otro telefono devuelve el mismo. La cuenta nunca se muestra a la red ni toca la cadena: es la identidad real que IdentityEscrow custodiaria bajo 2-de-3.

- Tecnologias: Auth.js v5 (Google), JWT en cookie, sin base de datos, Privy — wallet embebida integrada (ADR-050), IdentityEscrow.sol
- Codigo: `src/auth.ts`, `src/lib/identidad.ts`, `src/components/cuenta/AccesoGoogle.tsx`, `src/components/cuenta/RevelacionSelectiva.tsx`

### Agregado comunitario de sismos `sismos` — Listo

Cuando dos o más vecinos distintos reportan un sismo en 30 minutos, se muestra el agregado por zona y la intensidad más repetida. Cuenta reportes, no mide sismos: no hay acelerómetros ni detección propia.

- Tecnologias: Función pura con tests, Vitest
- Codigo: `src/lib/sismos.ts`, `src/components/sismos/AvisoSismo.tsx`

### Círculo de cuidado `circulo` — Simulado

Si alguien comparte su ubicación contigo, avisa cuando ocurre un reporte cerca de esa persona y deja su teléfono a un toque. Es la única parte de la app que exige cuenta, porque maneja teléfonos y ubicaciones de terceros.

- Tecnologias: Funciones puras con tests, Notification API, localStorage
- Codigo: `src/lib/circulo.ts`, `src/lib/circulo-simulacion.ts`, `src/components/circulo/PanelCirculo.tsx`

### Despliegue y cabeceras `despliegue` — Listo

Vercel con detección automática de Next.js. Cabeceras de seguridad y CSP declaradas en next.config.ts para poder probarlas en local. Un preflight aborta el build si alguien expone un secreto con prefijo NEXT_PUBLIC_.

- Tecnologias: Vercel, GitHub Actions, Content-Security-Policy
- Codigo: `next.config.ts`, `vercel.json`, `scripts/preflight-env.mjs`, `.github/workflows/ci.yml`

### Gobernanza del desarrollo con IA `gobernanza` — Listo

Bitácora de decisiones validada en CI y renderizada dentro del producto. La arquitectura y los docs se generan del mismo JSON, así no pueden divergir.

- Tecnologias: JSON validado, scripts de Node
- Codigo: `src/data/decisiones.json`, `src/data/arquitectura.json`, `scripts/validate-data.mjs`, `scripts/generate-docs.mjs`

## Flujo de un reporte

| # | Paso | Detalle | Capa | On-chain |
| --- | --- | --- | --- | --- |
| 1 | El vecino elige categoría | Tres opciones grandes: actividad sospechosa, infraestructura en riesgo o sismo sentido. Un toque. | `ui` | no |
| 2 | Adjunta evidencia y describe | Foto opcional desde la cámara del teléfono; descripción corta. Nada obligatorio que frene el reporte urgente. | `ui` | no |
| 3 | Se captura la ubicación | GPS del navegador. Las coordenadas se truncan a ~11 m antes de salir del dispositivo: suficiente para el mapa, insuficiente para señalar una puerta. Se muestra el margen de precisión y el distrito estimado, que el vecino puede corregir a mano. | `dominio` | no |
| 4 | La evidencia va a IPFS | El archivo se sube y devuelve un CID. La foto nunca pasa por un servidor nuestro. | `storage` | no |
| 5 | Se calcula el hash canónico | SHA-256 sobre el JSON canónico (CID + coordenadas en microgrados + categoría + timestamp). Es el bytes32 que verá el contrato. | `dominio` | no |
| 6 | Se ancla en Arbitrum | ReportRegistry.submitReport() guarda el hash y emite ReportSubmitted. Es lo único que toca la cadena: ni foto, ni nombre, ni dirección exacta. | `cadena` | si |
| 7 | Se evalúa la recompensa | La política anti-Sybil revisa límites por wallet y por zona. Si hay corroboración independiente cerca, la recompensa se multiplica; si no, queda pendiente. | `dominio` | si |
| 8 | La red vecinal ve el reporte | El mapa se actualiza con el marcador y el vecindario recibe el aviso. | `ui` | no |
| 9 | Opcional: escalar a la autoridad | Botón aparte. Genera un folio con las coordenadas y el enlace a la evidencia para serenazgo, policía o ambulancia. | `escalamiento` | no |

## Contratos

### `ReportRegistry.sol` — Listo

Registro inmutable de reportes: hash de contenido, coordenadas en microgrados, categoría y timestamp. Emite el evento que alimenta el mapa compartido.

Red: Arbitrum Sepolia — 0x322a2862C2218136124DF6f1d030E9942aBe43Ba (verificado en Arbiscan)

- `submitReport(bytes32 contentHash, int32 latE6, int32 lngE6, uint8 category, bytes32 zoneId)`
  <br>El frontend ya construye exactamente este payload. category: 0 actividad sospechosa, 1 infraestructura, 2 sismo sentido. Los índices ya escritos en cadena no se reordenan.
- `event ReportSubmitted(uint256 indexed id, address indexed reporter, bytes32 contentHash, int32 latE6, int32 lngE6, uint8 category, uint64 timestamp)`
  <br>Fuente de verdad del índice compartido entre dispositivos.

### `TokenReward.sol` — Listo

ERC-20 que mintea la recompensa con los límites anti-Sybil. La especificación ejecutable está en src/lib/antisybil.ts.

Red: Arbitrum Sepolia — 0x6E1B4747913431343196FD1D4b6772c5d43E9Fa5 (verificado en Arbiscan)

- `claim(uint256 reportId)`
  <br>Revalida en cadena los mismos límites que el cliente ya verificó.
- `corroborate(uint256 reportId)`
  <br>Un pseudónimo distinto confirma el hecho: activa el multiplicador de presencia.

### `IdentityEscrow.sol` — Listo

Custodia el vínculo cifrado wallet↔identidad. Libera solo con 2 de 3 firmas (usuario, plataforma, autoridad judicial).

Red: Arbitrum Sepolia — 0x84F39967863b42D4041988ADc9a88F8D32729eF2 (verificado en Arbiscan)

- `requestDisclosure(address subject, bytes32 caseHash)`
  <br>Deja rastro público de que alguien pidió revelar una identidad.
- `approveDisclosure(uint256 requestId)`
  <br>Umbral 2-de-3 simplificado para el MVP; sin circuitos ZK.

## Por que Arbitrum

> Un reporte por vecino por día solo cierra si anclar cuesta fracciones de centavo. Ya no es una estimación: medido en Sepolia, submitReport consume 216,804 de gas — alrededor de un centavo en Arbitrum One y varios dólares en Ethereum L1. En L1 el producto no existe.

- **Asentamiento de evidencia** — El hash del reporte vive en Arbitrum. Es lo que convierte un aviso en una prueba con fecha cierta que ninguna institución puede editar.
- **Economía del token** — El costo de gas por mint tiene que ser menor que el valor de la recompensa. Con Arbitrum lo es; con L1 no.
- **Índice compartido vía eventos** — El mapa multi-dispositivo se reconstruye leyendo ReportSubmitted, sin servidor propio ni base de datos.
- **Stylus (candidato de roadmap)** — La verificación geoespacial (distancia entre reportes, pertenencia a zona) es cómputo pesado para la EVM. En Stylus, con Rust, es barato. Anotado como siguiente paso, no como promesa cumplida.

| Red | chainId | Uso |
| --- | --- | --- |
| Arbitrum Sepolia | 421614 | Red del hackathon |
| Arbitrum One | 42161 | Destino de producción |

## Limites honestos de la beta

| Tema | Que hace hoy | Que falta |
| --- | --- | --- |
| Anclaje on-chain | Anclaje REAL en Arbitrum Sepolia: contratos desplegados y verificados, la wallet embebida de Privy firma (ADR-050), el gas llega solo (ADR-051) y hay reportes reales de la prueba de campo en el contrato. Quien no active la firma conserva el comprobante simulado, etiquetado (ADR-049). | Producción: cargar en Vercel NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_REPORT_REGISTRY_DEPLOY_BLOCK y GAS_DRIP_PRIVATE_KEY, y hacer push (bloqueado hoy por la conexión a GitHub del equipo). La app de Privy sigue en modo development. |
| Anti-Sybil | Límite por wallet y por zona, más multiplicador por corroboración independiente. | Un adversario con varios dispositivos todavía puede farmear. La prueba de presencia criptográfica es roadmap y así se dice en el pitch. |
| Círculo de cuidado | Vinculo por QR o enlace con consentimiento explicito (ADR-046): quien comparte elige el plazo (15 min a indefinido) y corta cuando quiere. La posicion viaja cifrada de extremo a extremo — la clave va dentro del QR/enlace y el servidor solo ve sobres opacos con TTL de minutos. Geometria, avisos de cercania y deduplicacion, con tests. | Solo publica con la app abierta: sin proceso de fondo no hay avisos con el telefono bloqueado. En Vercel el canal necesita un Redis de Upstash (dos variables); sin el, cada telefono puede caer en una instancia distinta. Los contactos de demo siguen simulados y etiquetados, solo con NEXT_PUBLIC_DATOS_DEMO=1. |
| Acceso con Google | Puerta de acceso selectiva con Auth.js (ADR-035): navegar no pide sesion, reportar y el circulo si. El alias se deriva de la cuenta, asi que entrar desde otro telefono devuelve el mismo seudonimo. Sin base de datos: la sesion es una cookie firmada en el dispositivo. Con Privy (ADR-050), la misma cuenta de Google activa una wallet embebida que firma los anclajes de verdad, con el gas goteado por la plataforma (ADR-051). | Si el despliegue no tiene credenciales de Google, tambien reportar y el circulo se abren solos para no dejar esas rutas inaccesibles. La derivacion del alias es de demostracion, no una KDF. |
| Revelación selectiva | Demostración del mecanismo 2-de-3 y del rastro público de cada solicitud. | Integración legal real con el Poder Judicial y custodia de claves por un tercero acreditado. |
| Escalamiento a la autoridad | Ruta API que valida y emite folio; reenvía a un webhook real si está configurado. | Convenio con un municipio y su endpoint de recepción. |
| Índice compartido | Lee los eventos ReportSubmitted del contrato real y los fusiona con lo local: dos teléfonos en modo arbitrum ven los mismos reportes anclados. | Las corroboraciones aún no se sincronizan: un reporte reconstruido desde el evento llega sin descripción ni conteo de corroboraciones de otros dispositivos. |
| Detección de distrito | 49 distritos de referencia de Lima y Callao, resueltos en el dispositivo. Si el punto no cae claramente dentro de uno, se dice 'Cerca de X' en vez de afirmarlo, y el vecino puede corregirlo a mano. | Cerca del borde de un distrito grande la estimación puede apuntar al vecino de al lado. No se usa geocoding externo a propósito: enviaría la coordenada del vecino a un tercero. |
| Detección de sismos | Los sismos llegan del Centro Sismológico Nacional del IGP (ADR-042): la app alerta a quien está dentro del radio de esa magnitud, con distancia y rumbo, y el vecino responde cómo lo sintió. Esas respuestas, agregadas por zona, dan el mapa de intensidad. | Seguimos sin medir nada: la detección es del IGP y la app lo dice. Las respuestas de intensidad son locales al dispositivo hasta que haya contrato; el IGP no publica SLA para su endpoint, así que si no responde la app se degrada con aviso. |
| Evidencia en IPFS | CID determinista calculado desde el hash del archivo. | Pinata con JWT en variables de entorno de Vercel. |

## Siguientes pasos

- **Activar el modo arbitrum en producción** (Equipo (Vercel + push)) — El código y los contratos ya están: falta push de los commits en cola (bloqueado por la conexión a GitHub) y cargar en Vercel NEXT_PUBLIC_PRIVY_APP_ID, NEXT_PUBLIC_REPORT_REGISTRY_DEPLOY_BLOCK=295929385 y GAS_DRIP_PRIVATE_KEY (Sensitive).
  <br>Desbloquea: La prueba multi-teléfono en producción: hoy el anclaje real solo corre en local.
- **Conectar IdentityEscrow a la pantalla de revelación selectiva** (Frontend) — El contrato está desplegado pero RevelacionSelectiva.tsx sigue siendo una demo client-side: nada llama a bindIdentity, requestDisclosure ni approveDisclosure. No bloquea reportar/recompensar.
  <br>Desbloquea: Que la revelación bajo orden judicial deje de ser demo conceptual.
- **Sincronizar corroboraciones desde TokenReward.corroborate()** (Frontend) — El índice compartido reconstruye reportes remotos sin corroboraciones ni descripción. Leer también estos eventos para que la recompensa mostrada coincida entre dispositivos.
  <br>Desbloquea: Que el multiplicador x1.5 se vea igual en todos los teléfonos.
- **Unificar la sesión y la firma en un solo login** (Frontend (post-demo)) — Hoy conviven NextAuth (sesión) y Privy (firma): dos consentimientos de Google. Unificarlos toca la puerta de acceso y la identidad — decisión de después del 12 (ADR-050).
  <br>Desbloquea: Nada de la demo; es deuda de experiencia.
- **Evaluar Stylus para verificación geoespacial** (Equipo de contratos) — Sigue siendo candidato de roadmap: medir el gas de corroborate() con coordenadas contra una versión Stylus antes de prometer nada en el pitch.
  <br>Desbloquea: Nada: es roadmap honesto.

## Como responde a la rubrica

### Problema e impacto — 20%

- Pantalla de inicio con las cifras de cobertura y desconfianza, cada una con su fuente.
- Cuatro perfiles de usuario declarados con su necesidad concreta.
- Posicionamiento explícito: complementa al serenazgo, no lo reemplaza.

### Producto y experiencia de usuario — 20%

- Reporte en 3 pasos, sin campos obligatorios que frenen la urgencia.
- Mobile-first real: barra inferior, áreas táctiles grandes, safe-area, tema oscuro.
- Sin seed phrase ni wallet que gestionar: se entra con Google y el alias se deriva solo.

### Implementación técnica — 25%

- Adaptadores con interfaz para cadena, storage e identidad.
- Reglas de dominio como funciones puras con 112 tests en Vitest, incluidos el adaptador de Arbitrum y la lectura de eventos.
- npm run check: preflight de entorno, validación de datos, docs sincronizados, tipos, lint y tests.
- CSP y cabeceras de seguridad verificadas contra el build real, no asumidas.
- El build aborta si alguien expone un secreto con prefijo NEXT_PUBLIC_.

### Uso del ecosistema Arbitrum — 20%

- Argumento económico de por qué el producto solo existe en L2.
- Redes, ABIs y formato de enlaces al explorador ya cableados.
- Stylus evaluado con criterio, no mencionado por moda.

### Pitch y demo — 15%

- Pestaña Arquitectura que expone el estado real de cada módulo ante el jurado.
- Límites de la beta declarados dentro del producto.
- docs/PITCH.md con guion, tiempos y respuestas a las preguntas difíciles.
