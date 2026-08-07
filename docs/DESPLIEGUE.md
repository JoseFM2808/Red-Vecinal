# Despliegue en Vercel

Todo lo que hay que saber para publicar Vecino Seguro y para no romperlo el día de la demo.

**Regla de oro del 11 y 12 de agosto:** ningún cambio de configuración que no se haya probado
en un deploy de preview. Un build que falla a las 3 p.m. cuesta más que cualquier mejora.

---

## 1. Qué está configurado en el repositorio

| Archivo | Qué hace |
| --- | --- |
| `vercel.json` | Deliberadamente mínimo: solo `$schema` y `framework`. Vercel detecta Next.js solo — fijar `buildCommand`, `installCommand` u `outputDirectory` a mano solo añade formas de romper el deploy (ADR-018). |
| `next.config.ts` | Cabeceras de seguridad y CSP. Van aquí y no en `vercel.json` para que apliquen también en `next start` y se puedan probar antes de desplegar (ADR-016). |
| `scripts/preflight-env.mjs` | Corre antes de cada build. **Aborta** si hay un secreto con prefijo `NEXT_PUBLIC_` o una `NEXT_PUBLIC_SITE_URL` malformada. Todo lo demás son avisos. |
| `.vercelignore` | Recorta lo que se sube al build: `node_modules`, `.next`, `.git`, tests, `.env*`. |
| `.github/workflows/ci.yml` | Corre `npm run check` y `npm run build` en cada push y PR. **No bloquea el despliegue** a propósito. |
| `.gitattributes` | Normaliza finales de línea entre Windows (equipo) y Linux (Vercel/CI). |

El build que corre Vercel es `npm run build`, que equivale a:

```bash
npm run preflight && npm run docs && next build
```

---

## 2. Ajustes del panel de Vercel

Se hacen una sola vez, en **Project Settings**.

### General
- **Node.js Version**: `22.x`. Debe coincidir con `engines.node` del `package.json` y con el
  Node del workflow de CI.
- **Build & Development Settings**: dejar **todos los Override apagados**. Ni Build Command,
  ni Output Directory, ni Install Command. Vercel ya sabe qué hacer con Next.js.

### Git
- **Production Branch**: `main`.
- **Preview Deployments**: activados. Cada rama y cada PR obtiene su propia URL.
- **Ignored Build Step**: `Automatic`. Nunca un comando propio — si devuelve 0, Vercel
  cancela el build y parece que el deploy "no hizo nada".

### Functions (opcional)
- **Function Region**: por defecto es Washington (`iad1`). Para menor latencia desde Lima se
  puede poner **São Paulo (`gru1`)**. Solo afecta a `/api/escalamiento`; las páginas se sirven
  desde el CDN igual. Es un toggle del panel, sin riesgo para el build — por eso **no** está en
  `vercel.json`, donde un valor no soportado tumbaría el deploy.

### Deployment Protection — **revisar antes de compartir nada**
Si está activada la protección, cualquiera que abra el enlace ve primero un login de Vercel.
Descubrirlo con el jurado delante es el peor momento.

1. Anotar el estado en **Settings > Deployment Protection**.
2. Compartir **solo el dominio corto de producción** (`https://<proyecto>.vercel.app`).
   Nunca una URL con hash de deployment ni de rama: con la protección estándar esas quedan
   cerradas aunque el dominio corto esté abierto.
3. Probar el enlace final **en un celular con datos móviles y ventana de incógnito**. Una
   ventana de incógnito en la laptop no basta si hay sesión de Vercel en el navegador.

---

## 3. Variables de entorno

**La app funciona sin ninguna.** Se cargan en **Settings > Environment Variables**.

> Las variables `NEXT_PUBLIC_*` se incrustan en el JavaScript durante el **build**.
> Cambiarlas en el panel **no** afecta a un deploy ya publicado: hay que hacer
> **Deployments > Redeploy**. Lo mismo vale para `ESCALATION_WEBHOOK_URL`, porque Vercel
> congela el entorno al crear el deployment.

| Variable | Ámbito | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_CHAIN_MODE` | Production, Preview | `simulado` por defecto. `arbitrum` requiere además que exista `ArbitrumChainAdapter`. |
| `NEXT_PUBLIC_CHAIN_ID` | Production, Preview | `421614` Sepolia, `42161` One. |
| `NEXT_PUBLIC_*_ADDRESS` | Production, Preview | Las publica el equipo de contratos. |
| `NEXT_PUBLIC_SITE_URL` | Production | Solo si se estrena dominio propio. URL absoluta con `https`, sin barra final. |
| `PINATA_JWT` | Production, Preview · **Sensitive** | **Secreto.** Nunca con prefijo `NEXT_PUBLIC_`. |
| `ESCALATION_WEBHOOK_URL` | **Solo Production** | **Secreto.** Así una rama de preview no puede avisar a un serenazgo real por accidente. |
| `CSP_MODO` | Production | Vacío = CSP activa. `report-only` degrada la política sin bloquear nada. |

Todo esto está también en [`.env.example`](../.env.example), con las advertencias al lado
de cada variable.

---

## 3.b Login con Google

El login es **opcional** y está construido, pero necesita credenciales que solo puede crear
alguien con acceso a la cuenta de Google del equipo. Sin ellas la app funciona igual: el botón
no aparece y todos usan su seudónimo local.

> Qué hace y qué no: entrar **no** te identifica ante la red vecinal. Tu alias público sigue
> siendo `vecino-1234` y es lo único que ven los demás y lo único que toca la cadena. Google
> sirve para recuperar el mismo alias desde otro teléfono (ADR-021).

### Crear el cliente OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → crear o elegir un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo **Externo**, nombre de la
   app "Vecino Seguro", correo de soporte. Los scopes por defecto (`email`, `profile`) bastan.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo
   **Aplicación web**.
4. **Orígenes autorizados de JavaScript**:
   - `https://<tu-proyecto>.vercel.app`
   - `http://localhost:3000` (para desarrollo)
5. **URIs de redirección autorizados** — la ruta exacta importa:
   - `https://<tu-proyecto>.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
6. Copiar el **ID de cliente** y el **Secreto de cliente**.

### Cargar en Vercel

```bash
npx auth secret   # genera AUTH_SECRET
```

En **Settings > Environment Variables**:

| Variable | Ámbito | Notas |
| --- | --- | --- |
| `AUTH_SECRET` | Production, Preview · **Sensitive** | Firma la cookie de sesión. **Obligatoria** si defines las dos de abajo: el preflight aborta el build si falta. |
| `AUTH_GOOGLE_ID` | Production, Preview | El ID de cliente. |
| `AUTH_GOOGLE_SECRET` | Production, Preview · **Sensitive** | El secreto de cliente. |

Después: **Redeploy**. El botón aparece solo — la app consulta `/api/auth/providers` en runtime,
así que no depende de que el build supiera de las credenciales.

> Si usas un dominio propio o una URL de preview, hay que añadir **esa** URL a los orígenes y
> redirecciones autorizados en Google, o el login devuelve `redirect_uri_mismatch`.

### Comprobar que quedó bien

```bash
curl -s https://<tu-proyecto>.vercel.app/api/auth/providers
```

Debe responder con un objeto que contenga `"google"`. Si responde `{}`, faltan las credenciales
o no se hizo Redeploy.

---

## 4. Publicar un cambio

Vercel despliega automáticamente en cada push a `main`.

```bash
npm run check
npm run build
git add -A
git commit -m "descripcion del cambio"
git push origin main
```

Si `npm run check` falla, no se hace push: es exactamente el fallo que Vercel iba a encontrar.

Para probar antes sin tocar producción: push a una rama y abrir su URL de preview.

---

## 5. Cabeceras y CSP

La política está en `next.config.ts` y **solo se emite en producción** (en desarrollo estorbaría
al HMR). Verificada contra el build real: teselas de OpenStreetMap cargando, los marcadores del
mapa conservando color, geolocalización y cámara permitidas, cero violaciones en consola.

Lo que hay que saber para no romperla:

- `script-src` y `style-src` llevan `'unsafe-inline'` porque Next serializa el payload RSC en
  scripts inline y los marcadores del mapa se pintan con atributo `style`. Sin eso, la app no
  hidrata y el mapa no aparece.
- `img-src` incluye `data:` y `blob:` por las miniaturas de canvas y la vista previa de la foto.
- Los orígenes de Arbitrum y Pinata **ya están permitidos**, para que la integración del equipo
  de contratos no falle en silencio.
- **Si conectas algo nuevo** (Privy, Web3Auth, otro RPC) y deja de cargar: mira la consola del
  navegador. La CSP dice exactamente qué origen bloqueó. Se agrega a la lista de `next.config.ts`.
- **Válvula de emergencia**: `CSP_MODO=report-only` en Vercel + Redeploy. La política pasa a solo
  reportar y no bloquea nada.

Cabeceras que **no** se envían, a propósito: `X-Frame-Options` y `frame-ancestors` (las
plataformas de hackathon suelen incrustar la demo en un iframe), `Cross-Origin-Embedder-Policy`
(rompería las teselas) y `Strict-Transport-Security` manual (`vercel.app` ya lo trae).

---

## 6. Checklist antes de la demo

Hacerlo con **días** de anticipación, no la mañana del 12.

- [ ] `npm run check` y `npm run build` en verde en local
- [ ] Último commit pusheado y su deploy en Vercel marcado **Ready**
- [ ] Abrir el **dominio corto de producción** en un celular con datos móviles e incógnito
- [ ] Aceptar el permiso de ubicación y confirmar que detecta **tu distrito real**
- [ ] Publicar un reporte de prueba de punta a punta y ver el comprobante
- [ ] Probar el botón de escalamiento y ver el folio
- [ ] Abrir la pestaña **Arquitectura** una vez, para que quede en caché
- [ ] Cuenta > **Reiniciar datos de demostración** (deja la red sembrada y el panel de sismos activo)
- [ ] Grabar un video de respaldo de la demo completa
- [ ] Congelar `main`: nada de merges el 11 y el 12
- [ ] Tener ubicado **Deployments > ⋯ > Instant Rollback** por si acaso

> El panel comunitario de sismos se apaga solo cuando los reportes sembrados superan los
> 30 minutos. Si quieres mostrarlo, reinicia los datos de demo justo antes de presentar.

---

## 7. Si algo se rompe

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| El build falla con "problema(s) de configuración" | Un secreto con prefijo `NEXT_PUBLIC_`, o `NEXT_PUBLIC_SITE_URL` mal escrita | El propio mensaje dice cuál. Corregir la variable en el panel y redesplegar. |
| El mapa carga gris, sin teselas | CSP bloqueando un origen nuevo | Consola del navegador → agregar el origen a `next.config.ts`, o `CSP_MODO=report-only` como parche. |
| La app pide login al abrir el enlace | Deployment Protection, o se compartió una URL con hash | Usar el dominio corto de producción, o desactivar la protección. |
| Cambié una variable y no pasa nada | Las `NEXT_PUBLIC_*` se congelan en el build | **Deployments > Redeploy**. |
| El último deploy salió mal | — | **Deployments > ⋯ > Instant Rollback** al anterior. |
| El deploy no incluye mis cambios | El push no llegó a `main`, o el Ignored Build Step lo canceló | `git log origin/main` y revisar el estado del deployment. |
