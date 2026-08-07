# Siguientes pasos — integración con Arbitrum

Documento de handoff para el equipo de contratos. El frontend ya está construido contra
la interfaz de abajo: cuando la implementen, **no hay que tocar ninguna pantalla**.

Estado actual: `NEXT_PUBLIC_CHAIN_MODE=simulado`. Todo lo que falta está listado aquí.

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

## 2. Contratos a desplegar en Arbitrum Sepolia (chainId 421614)

### `ReportRegistry.sol`

```solidity
function submitReport(
    bytes32 contentHash,
    int32   latE6,
    int32   lngE6,
    uint8   category,
    bytes32 zoneId
) external returns (uint256 reportId);

event ReportSubmitted(
    uint256 indexed reportId,
    address indexed reporter,
    bytes32 contentHash,
    int32   latE6,
    int32   lngE6,
    uint8   category,
    uint64  timestamp
);
```

- `contentHash` = SHA-256 del payload canónico (ver §4). Son 32 bytes exactos.
- `latE6` / `lngE6` = grados × 1e6, ya truncados a 4 decimales por el cliente. Entran en `int32`.
- `category`: `0` = actividad sospechosa, `1` = infraestructura. **Los índices no se reordenan nunca**:
  los que ya están escritos en cadena no se pueden cambiar (`src/lib/categorias.ts`).
- `zoneId`: celda de ~550 m. Hoy el cliente la manda como string `z-2391_-15409`; decidan si la
  quieren como `keccak256(zoneId)` y avisen — es un cambio de una línea en `flujo-reporte.ts`.

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

Orden de las reglas (los tests lo verifican): **primero el límite horario, después el de zona**.
Los 18 tests de `src/lib/antisybil.test.ts` describen los casos borde — úsenlos como lista de
casos para los tests de Solidity.

> **Decisión pendiente (ADR-014):** ¿el mint es optimista al reportar, o solo tras corroborarse?
> El frontend implementa el conservador: sin corroboración la recompensa queda
> `pendiente_corroboracion`. Si eligen el optimista, avísennos.

### `IdentityEscrow.sol`

Multisig 2-de-3 (usuario + plataforma + autoridad). Sin circuitos ZK para el MVP.
Lo importante del diseño: **toda solicitud de revelación deja rastro público en cadena**.

---

## 3. Implementar `ArbitrumChainAdapter`

Crear `src/lib/chain/arbitrum-adapter.ts` implementando la interfaz de `src/lib/chain/types.ts`:

```ts
export interface AdaptadorCadena {
  readonly id: "simulado" | "arbitrum";
  readonly red: RedArbitrum;
  readonly simulado: boolean;
  readonly explicacion: string;
  anclarReporte(entrada: EntradaAnclaje): Promise<ReciboCadena>;
  saldoRecompensas(direccion: string): Promise<number>;
}
```

Y cambiar **una sola línea** en `src/lib/chain/index.ts`:

```ts
if (integracionCadenaLista()) return crearAdaptadorArbitrum(CONFIG);
```

Esqueleto sugerido con viem (agregar `viem` como dependencia y registrar el ADR correspondiente
según `docs/REGLAS-IA.md`):

```ts
import { createPublicClient, createWalletClient, custom, http, parseAbi } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { ABI_REPORT_REGISTRY } from "./abis";

const abi = parseAbi(ABI_REPORT_REGISTRY);
// submitReport(contentHash, latE6, lngE6, category, zoneId)
```

Puntos a respetar para que la UI siga funcionando sin cambios:

- `anclarReporte` devuelve `ReciboCadena` con `txHash`, `bloque`, `chainId`, `urlExplorador`,
  `costoGasUsd` y `simulado: false`.
- `urlExplorador` se arma con `urlTransaccion(chainId, txHash)` de `src/lib/chain/redes.ts`.
- Si la transacción falla, lanzar `Error` con mensaje en español: el flujo ya lo captura y lo
  muestra al vecino sin romperse.

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

## 5. Activar la integración

Una vez desplegados, en Vercel (Project Settings → Environment Variables):

```
NEXT_PUBLIC_CHAIN_MODE=arbitrum
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_REWARD_ADDRESS=0x...
NEXT_PUBLIC_IDENTITY_ESCROW_ADDRESS=0x...
```

Las etiquetas `Simulado` de la interfaz desaparecen solas cuando el adaptador reporta
`simulado: false`. No hay que buscarlas y borrarlas.

---

## 6. Índice compartido entre dispositivos

Hoy los reportes viven en el dispositivo (ADR-009). Para que dos teléfonos vean el mismo mapa
—lo que la demo en vivo necesita— hay que reconstruir la lista desde los eventos:

1. `getLogs` sobre `ReportSubmitted` en `ReportRegistry`.
2. Resolver el CID de cada reporte contra el gateway de IPFS.
3. Sustituir `cargarReportes()` en `src/lib/repositorio.ts` por esa lectura.

Nada más cambia: las pantallas solo conocen esas cuatro funciones del repositorio.

---

## 7. Roadmap: Stylus

La verificación geoespacial (distancia entre reportes para corroborar, pertenencia a zona) es
cómputo caro en la EVM. En Stylus, con Rust, es sustancialmente más barato.

**No prometerlo en el pitch sin medirlo.** El paso previo es comparar el gas de la versión
Solidity contra la versión Stylus con datos reales. Hasta entonces se presenta como candidato
evaluado, que es más creíble que un logo en una slide.

---

## Checklist de entrega

- [ ] Los tres contratos desplegados en Arbitrum Sepolia y verificados en Arbiscan
- [ ] Constantes de `antisybil.ts` portadas a `TokenReward.sol`
- [ ] Tests de Solidity cubriendo los 18 casos de `antisybil.test.ts`
- [ ] Decidido SHA-256 vs keccak256 (ADR-003)
- [ ] Decidido mint optimista vs conservador (ADR-014)
- [ ] Decidido formato de `zoneId` (string vs keccak256)
- [ ] `ArbitrumChainAdapter` implementado y `chain/index.ts` actualizado
- [ ] Variables de entorno cargadas en Vercel
- [ ] Costo real por anclaje medido → reemplazar la estimación en `src/lib/chain/redes.ts`
- [ ] Mapa hidratado desde eventos `ReportSubmitted`
