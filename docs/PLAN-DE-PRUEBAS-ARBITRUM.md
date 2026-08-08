# Plan de pruebas — integración con Arbitrum

Cubre dos cosas, ambas verificadas en esta sesión con resultados reales (no solo descritos):

1. Que el modo simulado (el que corre la demo por defecto) **no se rompió** con todo lo agregado.
2. Que el adaptador real, los contratos y la activación por variables de entorno **funcionan de
   verdad**, no solo compilan.

No se desplegó nada en Arbitrum Sepolia real (necesita una wallet fondeada, ver Bloque 5). Todo
lo demás — incluida una transacción firmada y confirmada de verdad — sí se ejecutó.

---

## Bloque 1 — Regresión del modo simulado

| Prueba | Cómo se corrió | Resultado |
| --- | --- | --- |
| Suite completa del frontend | `npm run check` (preflight, validate, docs:check, typecheck, lint, test) | ✅ Verde. 107 tests, 10 archivos |
| Arranque sin ninguna variable de entorno | `npm run dev`, `curl` a la app | ✅ `200`, compila 3160 módulos sin errores en consola |
| `obtenerAdaptadorDeCadena()` sin config | Test automatizado (`src/lib/chain/index.test.ts`) | ✅ Devuelve `id: "simulado"`, `simulado: true` |

**Cómo repetirlo:** `npm run check`. Si alguna vez falla, no se está "listo" (regla del
proyecto, `docs/REGLAS-IA.md`).

---

## Bloque 2 — Contratos, aislados del frontend

| Prueba | Cómo se corrió | Resultado |
| --- | --- | --- |
| Compilación | `npm run contracts:compile` | ✅ 3 contratos, sin warnings |
| Tests de Solidity (`forge-std`) | `npm run contracts:test` | ✅ 26/26 — cubren los casos de `antisybil.test.ts` con análogo on-chain |
| Test de integración TypeScript (viem) | Incluido en `npm run contracts:test` | ✅ 1/1 — flujo reportar → corroborar → reclamar |
| `npm run check` de la raíz no se contamina | Ídem Bloque 1 | ✅ `contracts/` está fuera de `tsconfig.json` y `eslint.config.mjs` de la raíz |

---

## Bloque 3 — Matriz de activación por variables de entorno

Esto es lo que responde directamente "¿se activan y funcionan con la config de env vars?".
Cada fila es un test automatizado real en `src/lib/chain/index.test.ts` (5 casos) y
`src/lib/chain/arbitrum-adapter.test.ts` (9 casos) — no una descripción, código que corre en
`npm run check`.

| `NEXT_PUBLIC_CHAIN_MODE` | Direcciones | Resultado esperado | Verificado |
| --- | --- | --- | --- |
| (vacío / no definido) | — | Adaptador simulado, sin tocar `window` ni la red | ✅ |
| `arbitrum` | Sin `REPORT_REGISTRY_ADDRESS` | Simulado, **sin** aviso en consola (`integracionCadenaLista()` exige ambas cosas) | ✅ |
| `arbitrum` | Dirección mal formada (`0xNoEsUnaDireccionValida`) | Simulado, **con** aviso en consola (`console.warn`) | ✅ |
| `arbitrum` | `CHAIN_ID` sin red de viem asociada (ej. `999999`) | Simulado, con aviso en consola | ✅ |
| `arbitrum` | Dirección válida (formato `0x` + 40 hex) | Adaptador real: `id: "arbitrum"`, `simulado: false`, sin avisos | ✅ |
| `arbitrum` + dirección válida | Sin wallet inyectada en el navegador (`window.ethereum` ausente) | `anclarReporte` lanza error en español pidiendo instalar una wallet, sin crashear la app | ✅ |
| `arbitrum` + wallet inyectada mockeada | La wallet no devuelve cuenta | Error claro: "la wallet no devolvió ninguna cuenta" | ✅ |
| `arbitrum` + wallet inyectada mockeada | La wallet rechaza firmar | Error envuelto en español: "la wallet rechazó o no pudo enviar la transacción" | ✅ |
| Cualquier modo | `TokenReward` no configurado | `saldoRecompensas()` devuelve `0` sin llamar a la red | ✅ |

**Cómo repetirlo:** `npx vitest run src/lib/chain`.

---

## Bloque 4 — Validación end-to-end real (sin gastar ETH de testnet)

Esta es la prueba más fuerte que se puede hacer sin una wallet fondeada en Arbitrum Sepolia:
desplegar los contratos de verdad y firmar una transacción de verdad contra un nodo local que
**imita el chainId de Arbitrum Sepolia** (`421614`), usando el código de producción tal cual
(`arbitrum-adapter.ts`, `eventos.ts`), sin ningún mock del contrato ni de la cadena.

### Cómo se hizo

```bash
# Terminal 1 — nodo local que se identifica como Arbitrum Sepolia
cd contracts
npx hardhat node --chain-id 421614

# Terminal 2 — desplegar los tres contratos ahi
npx hardhat ignition deploy ignition/modules/VecinoSeguro.ts --network arbitrumLocal
```

`arbitrumLocal` ya está en `contracts/hardhat.config.ts`, apuntando a `127.0.0.1:8545` con la
cuenta #0 pública y conocida de Hardhat (nunca usar esa clave en una red real — solo funciona
contra este nodo local).

Con las direcciones desplegadas, se corrió un test temporal (`vitest`, entorno Node, sin
navegador) que:

1. Simula `window.ethereum` con un proveedor mínimo que reenvía cada llamada al nodo local —
   el mismo contrato (`request({ method, params })`) que expone MetaMask de verdad.
2. Llama a `crearAdaptadorArbitrum()` (el archivo real, sin tocar) con las direcciones
   desplegadas.
3. Llama a `anclarReporte()` — esto firma y envía una transacción real.
4. Llama a `leerReportesDesdeCadena()` — esto lee el evento real con `getLogs`.

### Resultado real obtenido

```
Recibo real del nodo local: {
  txHash: '0x64af99b682769cf04938ed12372ea536fb3eb97c365af1af5798434da7a6a9a7',
  bloque: 5,
  chainId: 421614,
  urlExplorador: 'https://sepolia.arbiscan.io/tx/0x64af99b6...',
  costoGasUsd: 0.68,
  simulado: false
}

Reporte reconstruido desde el evento real: {
  reportId: 2n,
  autorDireccion: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  categoria: 'actividad_sospechosa',
  cid: 'bafyPruebaE2E',
  recompensaMonto: 10,
  recompensaOtorgada: false
}
```

El `costoGasUsd` (~$0.68) es más alto que la estimación del pitch (fracciones de centavo)
porque el precio de gas de un nodo local recién arrancado no es el de Arbitrum real — no es un
hallazgo preocupante, solo confirma que ese número sigue siendo una estimación hasta medirlo en
Sepolia de verdad (ya anotado como pendiente en `docs/SIGUIENTES-PASOS-ARBITRUM.md`).

**Qué prueba esto exactamente:** que `submitReport` (con el parámetro `cid` agregado en
ADR-031), la validación de `zoneId` como `keccak256` (ADR-030), la construcción del recibo, y la
reconstrucción del evento por `eventos.ts` (ADR-032) — todo el código escrito en las últimas dos
sesiones — funciona de punta a punta contra un contrato real, no solo contra mocks.

**Qué NO prueba:** el flujo de `corroborate()`/`claim()` no se ejercitó aquí porque
`AdaptadorCadena` (la interfaz que usa el frontend) todavía no expone esos métodos — es un hueco
ya conocido y anotado en `arquitectura.json` → "Sincronizar corroboraciones". Sí están cubiertos,
aparte, por los 26 tests de Solidity del Bloque 2.

**Nota:** el test temporal que hizo esto (`manual-e2e.test.ts`) se borró después de correrlo —
no es parte de la suite permanente porque necesita el nodo local corriendo. Repetirlo es correr
los tres comandos de arriba y escribir un test así de nuevo si hace falta.

---

## Bloque 5 — Lo único que queda: una wallet real en Arbitrum Sepolia

Nada de esto lo puede correr la IA (necesita fondos y una wallet real). Pasos para quien lo haga:

```bash
cd contracts
cp .env.example .env          # completar DEPLOYER_PRIVATE_KEY
npm run deploy:sepolia        # despliega los 3 contratos de verdad
npm run verify:sepolia        # los verifica en Arbiscan
```

Después, en Vercel, cargar las 3 direcciones impresas + `NEXT_PUBLIC_CHAIN_MODE=arbitrum` (ver
`docs/SIGUIENTES-PASOS-ARBITRUM.md` §5) y redesplegar. Con MetaMask instalado y conectado a
Arbitrum Sepolia:

- [ ] Reportar desde la app y confirmar la transacción en MetaMask
- [ ] Verificar el `txHash` mostrado abre de verdad en `sepolia.arbiscan.io`
- [ ] Abrir la app desde un segundo teléfono/navegador y confirmar que el reporte del primero
      aparece en el mapa (índice compartido, ADR-032)
- [ ] Medir el costo real en USD del `submitReport` y reemplazar la estimación de
      `src/lib/chain/redes.ts`

---

## Resumen

| Bloque | Estado |
| --- | --- |
| 1. Regresión del modo simulado | ✅ Verificado, automatizado, corre en cada `npm run check` |
| 2. Contratos aislados | ✅ Verificado, automatizado, corre en cada `npm run contracts:test` |
| 3. Matriz de activación por env vars | ✅ Verificado, automatizado (14 tests nuevos) |
| 4. E2E real contra un nodo que imita Arbitrum Sepolia | ✅ Verificado una vez, manualmente, con resultados reales documentados arriba |
| 5. Sepolia real con fondos | ⬜ Pendiente — necesita una wallet humana |
