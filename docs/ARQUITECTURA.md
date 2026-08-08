<!-- GENERADO AUTOMATICAMENTE desde src/data/arquitectura.json — no editar a mano. Corre `npm run docs`. -->

# Arquitectura — Vecino Seguro

**Version:** 0.1.0-beta.2 · **Actualizado:** 2026-08-07

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

Repositorio de reportes con persistencia en el dispositivo y datos sembrados de Lima para que la red se vea activa desde el primer arranque.

- Tecnologias: React Context, localStorage
- Codigo: `src/lib/repositorio.ts`, `src/lib/seed.ts`, `src/components/proveedores/AppProvider.tsx`

### Capa de cadena (Arbitrum) `cadena` — Simulado

Interfaz ChainAdapter: anclar reporte, consultar recompensa, resolver enlaces al explorador, leer el índice compartido. La beta corre el adaptador simulado por defecto; ArbitrumChainAdapter (ADR-030) implementa la misma interfaz con viem y firma con wallet inyectada. Los tres contratos (ReportRegistry, TokenReward, IdentityEscrow) ya están escritos y testeados en contracts/ (ADR-033, ADR-034) — falta solo desplegarlos con una wallet fondeada y cargar las direcciones: activar es un despliegue y variables de entorno, no escribir código.

- Tecnologias: Arbitrum Sepolia (421614), Arbitrum One (42161), ABIs tipadas, viem
- Codigo: `src/lib/chain/types.ts`, `src/lib/chain/mock-adapter.ts`, `src/lib/chain/arbitrum-adapter.ts`, `src/lib/chain/proveedor-inyectado.ts`, `src/lib/chain/eventos.ts`, `src/lib/chain/redes.ts`, `src/lib/chain/abis.ts`

### Evidencia (IPFS) `storage` — Simulado

Sube foto o video y devuelve un CID. La beta usa un adaptador local que produce un CID determinista desde el hash del archivo.

- Tecnologias: IPFS, Pinata (a integrar)
- Codigo: `src/lib/storage/types.ts`, `src/lib/storage/mock-adapter.ts`

### Puente con la autoridad `escalamiento` — Simulado

Ruta API que valida el aviso y genera folio para serenazgo, policía o ambulancia. Reenvía a un webhook real si está configurado.

- Tecnologias: Next.js Route Handler
- Codigo: `src/app/api/escalamiento/route.ts`

### Identidad, acceso y revelación selectiva `identidad` — Simulado

Puerta de acceso con Google: sin sesion no se entra (ADR-027). El alias publico se deriva de la cuenta, asi que entrar desde otro telefono devuelve el mismo. La cuenta nunca se muestra a la red ni toca la cadena: es la identidad real que IdentityEscrow custodiaria bajo 2-de-3.

- Tecnologias: Auth.js v5 (Google), JWT en cookie, sin base de datos, Privy o Web3Auth (a integrar), IdentityEscrow.sol
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

### `ReportRegistry.sol` — Pendiente (equipo de contratos)

Registro inmutable de reportes: hash de contenido, coordenadas en microgrados, categoría y timestamp. Emite el evento que alimenta el mapa compartido.

Red: Arbitrum Sepolia → Arbitrum One

- `submitReport(bytes32 contentHash, int32 latE6, int32 lngE6, uint8 category, bytes32 zoneId)`
  <br>El frontend ya construye exactamente este payload. category: 0 actividad sospechosa, 1 infraestructura, 2 sismo sentido. Los índices ya escritos en cadena no se reordenan.
- `event ReportSubmitted(uint256 indexed id, address indexed reporter, bytes32 contentHash, int32 latE6, int32 lngE6, uint8 category, uint64 timestamp)`
  <br>Fuente de verdad del índice compartido entre dispositivos.

### `TokenReward.sol` — Pendiente (equipo de contratos)

ERC-20 que mintea la recompensa con los límites anti-Sybil. La especificación ejecutable está en src/lib/antisybil.ts.

Red: Arbitrum Sepolia → Arbitrum One

- `claim(uint256 reportId)`
  <br>Revalida en cadena los mismos límites que el cliente ya verificó.
- `corroborate(uint256 reportId)`
  <br>Un pseudónimo distinto confirma el hecho: activa el multiplicador de presencia.

### `IdentityEscrow.sol` — Pendiente (equipo de contratos)

Custodia el vínculo cifrado wallet↔identidad. Libera solo con 2 de 3 firmas (usuario, plataforma, autoridad judicial).

Red: Arbitrum Sepolia → Arbitrum One

- `requestDisclosure(address subject, bytes32 caseHash)`
  <br>Deja rastro público de que alguien pidió revelar una identidad.
- `approveDisclosure(uint256 requestId)`
  <br>Umbral 2-de-3 simplificado para el MVP; sin circuitos ZK.

## Por que Arbitrum

> Un reporte por vecino por día solo cierra si anclar cuesta fracciones de centavo. En L1 el mismo gesto cuesta dólares y el producto no existe.

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
| Anclaje on-chain | El adaptador simulado produce un hash de transacción y un enlace al explorador con el formato real. | Desplegar ReportRegistry y activar NEXT_PUBLIC_CHAIN_MODE=arbitrum. |
| Anti-Sybil | Límite por wallet y por zona, más multiplicador por corroboración independiente. | Un adversario con varios dispositivos todavía puede farmear. La prueba de presencia criptográfica es roadmap y así se dice en el pitch. |
| Círculo de cuidado | Geometría, frescura de la ubicación, evaluación de cercanía y deduplicación de avisos, todo real y con tests. Avisos con la Notification API del navegador. | El transporte: hoy la ubicación del contacto se mueve localmente. El tiempo real entre dispositivos necesita servidor, y eso choca con la promesa de no guardar datos de nadie. Tampoco hay avisos con la app cerrada. |
| Acceso con Google | Puerta de acceso con Auth.js: sin sesion no se entra. El alias se deriva de la cuenta, asi que entrar desde otro telefono devuelve el mismo seudonimo. Sin base de datos: la sesion es una cookie firmada en el dispositivo. | Si el despliegue no tiene credenciales de Google, la puerta se abre sola para no dejar la app inaccesible. La derivacion del alias es de demostracion, no una KDF. |
| Revelación selectiva | Demostración del mecanismo 2-de-3 y del rastro público de cada solicitud. | Integración legal real con el Poder Judicial y custodia de claves por un tercero acreditado. |
| Escalamiento a la autoridad | Ruta API que valida y emite folio; reenvía a un webhook real si está configurado. | Convenio con un municipio y su endpoint de recepción. |
| Índice compartido | Los reportes persisten en el dispositivo; la app arranca con datos sembrados de Lima. | Leer eventos de ReportSubmitted por RPC para que dos teléfonos vean el mismo mapa. |
| Detección de distrito | 49 distritos de referencia de Lima y Callao, resueltos en el dispositivo. Si el punto no cae claramente dentro de uno, se dice 'Cerca de X' en vez de afirmarlo, y el vecino puede corregirlo a mano. | Cerca del borde de un distrito grande la estimación puede apuntar al vecino de al lado. No se usa geocoding externo a propósito: enviaría la coordenada del vecino a un tercero. |
| Detección de sismos | Agrega los reportes de vecinos: si varios coinciden en media hora, muestra el mapa comunitario por zonas. | No hay medición sismológica. Un detector real es procesamiento de señal sobre acelerómetros, un proyecto aparte. |
| Evidencia en IPFS | CID determinista calculado desde el hash del archivo. | Pinata con JWT en variables de entorno de Vercel. |

## Siguientes pasos

- **Desplegar los tres contratos en Arbitrum Sepolia** (Quien tenga una wallet con ETH de testnet) — Los contratos ya están escritos, compilados y con 27 tests en verde (contracts/, ADR-033, ADR-034) — no falta código, falta una wallet fondeada. Correr `npm run contracts:deploy:sepolia` tras llenar contracts/.env (ver contracts/.env.example) y publicar las tres direcciones en las variables NEXT_PUBLIC_*_ADDRESS.
  <br>Desbloquea: Anclaje real, recompensa real, índice compartido
- **Verificar el código fuente en Arbiscan** (Quien despliegue) — `npm run --prefix contracts verify:sepolia` (o `hardhat ignition verify`) con ARBISCAN_API_KEY en contracts/.env. Sin esto el contrato es una caja negra para el jurado.
  <br>Desbloquea: Que el criterio de Arbitrum se pueda verificar de verdad, no solo argumentar
- **Probar ArbitrumChainAdapter contra Sepolia real** (Frontend) — El adaptador (src/lib/chain/arbitrum-adapter.ts) y la lectura de eventos (src/lib/chain/eventos.ts) ya están implementados y gateados por NEXT_PUBLIC_CHAIN_MODE (ADR-030, ADR-032), firmando con wallet inyectada. Falta solo que existan direcciones desplegadas para verificar end-to-end.
  <br>Desbloquea: Confirmar el formato de zoneId (hoy keccak256 del string, ver ADR-030) y medir el costo real de gas
- **Conectar Privy o Web3Auth** (Frontend) — Reemplazar la wallet inyectada interina (src/lib/chain/proveedor-inyectado.ts) por la wallet embebida. La interfaz ya está aislada para que sea un cambio de un archivo.
  <br>Desbloquea: Firmar transacciones reales sin que el vecino instale una wallet aparte
- **Sincronizar corroboraciones desde TokenReward.corroborate()** (Frontend) — El índice compartido (ADR-032) hoy reconstruye reportes remotos sin corroboraciones ni descripción. Leer también estos eventos para que la recompensa mostrada coincida entre dispositivos.
  <br>Desbloquea: Que el saldo mostrado sea el mismo en todos los teléfonos
- **Evaluar Stylus para verificación geoespacial** (Equipo de contratos) — Medir el costo en gas del cálculo de distancia en Solidity contra Rust/Stylus antes de prometerlo en el pitch.
  <br>Desbloquea: Nada del MVP; es argumento de escalabilidad

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
- Reglas de dominio como funciones puras con 59 tests en Vitest.
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
