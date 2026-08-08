# Siguientes pasos — integración con Arbitrum

Estado actual: `NEXT_PUBLIC_CHAIN_MODE=simulado`. El frontend (adaptador, lectura de eventos) y
los tres contratos ya están escritos y testeados (ADR-030 a ADR-034). **No queda código por
escribir para activar la integración real** — falta una wallet con ETH de testnet para
desplegar, y después cargar tres direcciones en Vercel.

Los contratos viven en [`contracts/`](../contracts), un proyecto Hardhat 3 + viem separado del
frontend (tiene su propio `package.json`, no afecta `npm run check` ni `npm run build`). Antes
de tocarlo: `cd contracts && npm install`.

---

## 1. Lo que el frontend ya tiene resuelto

| Pieza | Dónde | Qué les sirve |
| --- | --- | --- |
| Interfaz de cadena | `src/lib/chain/types.ts` | La firma exacta que hay que implementar |
| ABIs esperadas | `src/lib/chain/abis.ts` | Formato legible, compatible con `parseAbi` de viem |
| Redes | `src/lib/chain/redes.ts` | chainId, RPC público y explorador de Sepolia y One |
| Política anti-Sybil | `src/lib/antisybil.ts` | La especificación de `TokenReward.sol`, con tests |
| Hash canónico | `src/lib/hash.ts` | Qué se hashea y cómo, para que el `bytes32` coincida |
| Payload de anclaje | `src/lib/flujo-reporte.ts` | El frontend ya arma `latE6`, `lngE6`, `zoneId`, `category` |

---

## 2. Contratos — ya escritos en `contracts/contracts/` (ADR-033, ADR-034)

Los tres contratos están completos, compilan y tienen 27 tests en verde (26 en Solidity con
`forge-std`, 1 de integración en TypeScript con viem — correr con `npm run contracts:test` desde
la raíz). Lo de abajo describe lo que **ya implementan**, no una especificación por escribir.

### `ReportRegistry.sol`

```solidity
function submitReport(
    bytes32 contentHash,
    int32   latE6,
    int32   lngE6,
    uint8   category,
    bytes32 zoneId,
    string  calldata cid
) external returns (uint256 reportId);

event ReportSubmitted(
    uint256 indexed reportId,
    address indexed reporter,
    bytes32 contentHash,
    int32   latE6,
    int32   lngE6,
    uint8   category,
    uint64  timestamp,
    string  cid
);
```

> **Cambio sobre la versión anterior de este documento (ADR-031):** `submitReport` gana el
> parámetro `cid` y el evento lo emite. Sin él, un vecino no puede ver la evidencia de un
> reporte hecho desde otro teléfono — no hay ningún otro lugar on-chain de donde leerlo, y el
> índice compartido (§6) ya está construido asumiendo que este campo existe.

- `contentHash` = SHA-256 del payload canónico (ver §4). Son 32 bytes exactos.
- `latE6` / `lngE6` = grados × 1e6, ya truncados a 4 decimales por el cliente. Entran en `int32`.
- `category`: `0` = actividad sospechosa, `1` = infraestructura, `2` = sismo sentido.
  **Los índices no se reordenan nunca**: los que ya están escritos en cadena no se pueden
  cambiar (`src/lib/categorias.ts`). No pongan un máximo de 2 categorías en el contrato —
  la tercera se agregó el 7 de agosto (ADR-019) y puede haber más después del hackathon.
- `zoneId`: celda de ~550 m. El cliente la calcula como string (`z-2391_-15409`) y el adaptador
  del frontend la manda como `keccak256(zoneId)` (ADR-030) — es la opción que este documento
  dejaba abierta. Si prefieren otro formato, es una función en `arbitrum-adapter.ts`, avisen.
- `cid`: string del CID de IPFS, o cadena vacía si el reporte no lleva evidencia.

### `TokenReward.sol` (ERC-20, símbolo `VSG`)

Las constantes vienen de `src/lib/antisybil.ts`. **Cópienlas literalmente**, el frontend ya las
aplica antes de enviar y los mensajes de error al vecino se basan en ellas:

| Constante | Valor | Regla |
| --- | --- | --- |
| `recompensaBase` | 10 VSG | Pago por reporte válido antes de multiplicadores |
| `maxReportesPorVentana` | 3 | Máximo por wallet dentro de la ventana |
| `ventanaMs` | 1 hora | Ventana del límite por wallet |
| `esperaMismaZonaMs` | 15 min | Espera de la misma wallet en la misma zona |
| `radioCorroboracionM` | 300 m | Radio para que otro reporte corrobore |
| `ventanaCorroboracionMs` | 30 min | Ventana temporal de corroboración |
| `multiplicadorCorroborado` | 1.5× | Multiplicador con ≥1 corroboración independiente |

Orden de las reglas (los tests lo verifican, en ambos lados): **primero el límite horario,
después el de zona**. Los 18 tests de `src/lib/antisybil.test.ts` describen los casos borde;
`contracts/contracts/ReportRegistry.t.sol` y `TokenReward.t.sol` cubren los que tienen un
análogo on-chain (no todos: los que dependen de geometría o de comparar strings en mayúsculas no
aplican a una `address` de Solidity — ver ADR-034 para el detalle completo).

> **ADR-014 resuelta:** el mint es conservador y en dos pasos (ADR-034). `corroborate(reportId)`
> no mintea nada, solo fija el monto final la primera vez que alguien distinto del autor
> corrobora dentro de los 30 minutos. `claim(reportId)` — solo el autor, solo una vez, solo si ya
> está liberado — es quien de verdad emite el ERC-20. **Consecuencia a tener presente:** un
> reporte que nunca se corrobora nunca paga nada, ni la base.
>
> **Límite declarado:** `corroborate()` no repite el chequeo de radio de 300 m que sí hace el
> cliente, porque el ABI no le pasa coordenadas del corroborador — es una señal solo del cliente
> en esta versión. Extender el ABI para que las reciba (y entonces sí valdría la pena medir
> Stylus, ver §7) es un cambio de interfaz que no se tomó sin que el equipo lo pida.

### `IdentityEscrow.sol`

Multisig 2-de-3 (sujeto + plataforma + autoridad, con la dirección de autoridad configurable por
el owner). Sin circuitos ZK para el MVP. Lo importante del diseño: **toda solicitud de
revelación deja rastro público en cadena** (eventos `DisclosureRequested`/`DisclosureApproved`).

---

## 3. `ArbitrumChainAdapter` — ya implementado (ADR-030)

Ya no es tarea del equipo de contratos. `src/lib/chain/arbitrum-adapter.ts` implementa
`AdaptadorCadena` con `viem`, y `src/lib/chain/index.ts` ya intenta usarlo cuando hay direcciones
cargadas (con fallback seguro al simulado si falla). Nada de esto cambia cuando desplieguen:
solo hace falta que las variables de entorno del §5 apunten a contratos reales.

Un detalle a conocer: el adaptador firma con lo que devuelva `src/lib/chain/proveedor-inyectado.ts`
(hoy, `window.ethereum` — MetaMask u otra wallet inyectada), porque el frontend todavía no decidió
Privy vs Web3Auth. Para probar el adaptador contra Sepolia hace falta una wallet inyectada con esa
red configurada y con fondos de un faucet.

---

## 4. Qué se hashea (para que los `bytes32` coincidan)

`src/lib/hash.ts` serializa así, en este orden exacto:

```
autor=<address en minúsculas>|categoria=<id>|cid=<CID IPFS o vacío>|latE6=<int>|lngE6=<int>|ts=<epoch segundos>
```

y aplica SHA-256. Ejemplo verificable en `src/lib/hash.test.ts`.

> **Decisión pendiente (ADR-003):** SHA-256 se eligió porque está en Web Crypto sin dependencias
> y también son 32 bytes. Si prefieren `keccak256` por consistencia con el ecosistema EVM,
> es cambiar una función en el cliente. Decidan y avisen antes de desplegar.

---

## 5. Cómo desplegar y activar la integración

Con una wallet nueva (nunca una con fondos reales) fondeada desde un faucet de Arbitrum Sepolia:

```bash
cd contracts
cp .env.example .env        # completar DEPLOYER_PRIVATE_KEY como minimo
npm install                 # si no se hizo antes
npm run compile
npm run test                # 27 tests, deberian pasar todos antes de desplegar
npm run deploy:sepolia      # corre el modulo de Hardhat Ignition, imprime las 3 direcciones
npm run verify:sepolia      # opcional pero recomendado: verifica el codigo fuente en Arbiscan
```

`contracts/ignition/modules/VecinoSeguro.ts` despliega los tres en el orden correcto
(`ReportRegistry` primero, `TokenReward` depende de su dirección) y usa la misma cuenta como
owner/autoridad de `IdentityEscrow` por defecto — para una autoridad distinta, agregar
`--parameters '{"VecinoSeguro":{"autoridad":"0x..."}}'` al comando de deploy.

Con las tres direcciones ya impresas, en Vercel (Project Settings → Environment Variables):

```
NEXT_PUBLIC_CHAIN_MODE=arbitrum
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_REWARD_ADDRESS=0x...
NEXT_PUBLIC_IDENTITY_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_REPORT_REGISTRY_DEPLOY_BLOCK=0
```

`NEXT_PUBLIC_REPORT_REGISTRY_DEPLOY_BLOCK` es nuevo: el bloque en el que quedó desplegado
`ReportRegistry`. El índice compartido (§6) pagina `getLogs` desde ahí — sin este valor pagina
desde el bloque 0, que en un RPC público puede fallar o ser lento. **Dejarlo en `0` no rompe
nada** (`eventos.ts` pagina en lotes de 100k bloques igual), solo es más lento la primera carga.

**Cómo encontrar el número de bloque** (el CLI de Ignition solo imprime direcciones, no el
bloque): abrir la dirección de `ReportRegistry` en `sepolia.arbiscan.io`, entrar a la pestaña
"Contract Creation" y leer el número de bloque de esa transacción.

Las etiquetas `Simulado` de la interfaz desaparecen solas cuando el adaptador reporta
`simulado: false`. No hay que buscarlas y borrarlas.

**Estado local del despliegue**: `contracts/ignition/deployments/` está en `.gitignore` a
propósito — no commitear nunca esa carpeta. Un despliegue de prueba contra un nodo local ya
quedó commiteado por error una vez, en una carpeta `chain-421614` idéntica a la que usaría un
despliegue real, y generó la impresión de que algo estaba desplegado cuando no lo estaba. Las
direcciones reales viven en las variables de entorno de Vercel, no en el repo.

---

## 6. Índice compartido entre dispositivos — ya implementado (ADR-032)

Ya no es tarea del equipo de contratos. `src/lib/chain/eventos.ts` reconstruye la lista leyendo
`getLogs` sobre `ReportSubmitted`, resuelve la evidencia con el `cid` del evento (§2), y
`AppProvider` la combina con lo que ya hay en el dispositivo la primera vez que carga en modo
`arbitrum`. Limitación conocida y declarada (no oculta): un reporte que llega solo por evento no
trae descripción ni las corroboraciones de otros dispositivos todavía — ver la nota_para_humano
de ADR-032 y el paso "Sincronizar corroboraciones" en la pestaña Arquitectura.

---

## 7. Roadmap: Stylus

La verificación geoespacial (distancia entre reportes para corroborar, pertenencia a zona) es
cómputo caro en la EVM. En Stylus, con Rust, es sustancialmente más barato.

**No prometerlo en el pitch sin medirlo.** El paso previo es comparar el gas de la versión
Solidity contra la versión Stylus con datos reales. Hasta entonces se presenta como candidato
evaluado, que es más creíble que un logo en una slide.

---

## Checklist de entrega

Ya hecho — frontend (ADR-030, ADR-031, ADR-032):

- [x] `ArbitrumChainAdapter` implementado y `chain/index.ts` actualizado, con fallback seguro
- [x] Mapa hidratado desde eventos `ReportSubmitted` (best-effort, ver §6)
- [x] Formato de `zoneId` resuelto: `keccak256` del string, aplicado en el adaptador
- [x] ABI corregido para incluir `cid` en `submitReport`/`ReportSubmitted`

Ya hecho — contratos (ADR-033, ADR-034):

- [x] Los tres contratos escritos: `ReportRegistry.sol`, `TokenReward.sol`, `IdentityEscrow.sol`
- [x] Constantes de `antisybil.ts` portadas a `ReportRegistry`/`TokenReward` (rate-limit en el
      registro, economía en el token — ver ADR-034 para por qué se dividió así)
- [x] 27 tests en verde: 26 en Solidity cubriendo los casos aplicables de `antisybil.test.ts`,
      1 de integración en TypeScript con viem contra el flujo completo
- [x] Confirmado SHA-256 vs keccak256 (ADR-003, sin cambios: `bytes32` acepta cualquiera) y
      `keccak256(zoneId)` (ADR-030) del lado del contrato
- [x] Decidido mint optimista vs conservador (ADR-014 → conservador, patrón pull en ADR-034)
- [x] Módulo de despliegue (`contracts/ignition/modules/VecinoSeguro.ts`) listo para correr

Hecho — desplegado y verificado el 2026-08-08 (requirió una wallet fondeada, la tuvo el equipo):

- [x] Los tres contratos desplegados en Arbitrum Sepolia:
      - `ReportRegistry`: `0x322a2862C2218136124DF6f1d030E9942aBe43Ba`
      - `TokenReward`: `0x6E1B4747913431343196FD1D4b6772c5d43E9Fa5`
      - `IdentityEscrow`: `0x84F39967863b42D4041988ADc9a88F8D32729eF2`
- [x] Código fuente verificado en Arbiscan, Blockscout y Sourcify (`npm run --prefix contracts verify:sepolia` —
      el script necesitaba `--network arbitrumSepolia`, ya corregido)
- [x] `.env.local` cargado con las tres direcciones para desarrollo local

Pendiente:

- [ ] Variables de entorno cargadas en **Vercel** (Project Settings → Environment Variables) y
      redeploy — `.env.local` no llega a Vercel, hay que copiarlas ahí también
- [ ] Costo real por anclaje medido → reemplazar la estimación en `src/lib/chain/redes.ts`
- [ ] Probar `ArbitrumChainAdapter` end-to-end contra los contratos reales, desde la app y con
      una wallet inyectada de verdad (MetaMask) — la validación hecha hasta ahora fue contra un
      nodo local, no contra estos contratos ya desplegados

Pendiente, del frontend, fuera de esta pasada:

- [ ] Conectar Privy o Web3Auth en vez de la wallet inyectada interina
- [ ] Sincronizar corroboraciones desde `TokenReward.corroborate()` en el índice compartido
- [ ] Si se decide verificar distancia on-chain en `corroborate()`, extender su ABI con
      coordenadas y recién ahí medir si Stylus se justifica (§7)
- [ ] **`IdentityEscrow` no está conectado a ninguna pantalla.** Desplegarlo y cargar
      `NEXT_PUBLIC_IDENTITY_ESCROW_ADDRESS` activa `ReportRegistry`/`TokenReward`, pero
      `RevelacionSelectiva.tsx` (pestaña Cuenta) sigue siendo una demo puramente client-side,
      con su `EtiquetaSimulado` puesta a propósito — nada llama a `bindIdentity`,
      `requestDisclosure` ni `approveDisclosure` todavía. No bloquea el flujo de reportar/
      recompensar, que es independiente.

### Verificación de que esto está listo (auditoría del 2026-08-07)

Se comparó `src/lib/chain/abis.ts` contra los tres `.sol` función por función y evento por
evento: coinciden exactamente (tipos, orden de parámetros, `indexed`). No hay ninguna firma que
vaya a fallar al conectar contra un despliegue real. El módulo de Ignition, la red
`arbitrumSepolia` de `hardhat.config.ts` y los scripts de `npm run contracts:*` se revisaron de
punta a punta — nada de eso es un placeholder, es código que ya corrió (local, no en Sepolia
real) y compiló/testeó en verde. El único bloqueante real es una wallet con ETH de testnet.
