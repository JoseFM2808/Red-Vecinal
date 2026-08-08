#!/usr/bin/env node
/**
 * Preflight de variables de entorno. Corre ANTES de construir, en local y en Vercel.
 *
 * Existe por dos fallos concretos que solo se descubren tarde y caros:
 *
 * 1. Un secreto con prefijo NEXT_PUBLIC_. Next inlinea TODA variable NEXT_PUBLIC_* en el
 *    bundle del navegador. Si alguien crea NEXT_PUBLIC_PINATA_JWT en el panel de Vercel,
 *    el JWT queda publicado en un archivo .js que cualquiera puede abrir. Esto ABORTA el build.
 * 2. NEXT_PUBLIC_SITE_URL mal escrita. src/lib/url-base.ts hace `new URL(...)` con ella en
 *    tiempo de build; una URL invalida revienta el build con un error que no menciona la
 *    variable. Mejor fallar aqui, diciendo cual es.
 *
 * Todo lo demas son AVISOS y no bloquean: la app esta disenada para arrancar sin ninguna
 * variable, y un build caido el dia de la demo es peor que una configuracion a medias.
 *
 * Sin dependencias. Compatible con `npm run build` y con el entorno de build de Vercel.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const errores = [];
const avisos = [];

// --- entorno efectivo --------------------------------------------------------
// En Vercel las variables llegan en process.env. En local viven en .env.local, que
// Next carga por su cuenta pero este script no veria: se leen a mano para que el
// chequeo sirva igual antes de hacer push.

const leerArchivoEnv = (nombre) => {
  const ruta = resolve(raiz, nombre);
  if (!existsSync(ruta)) return {};
  const salida = {};
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const corte = limpia.indexOf("=");
    if (corte === -1) continue;
    const clave = limpia.slice(0, corte).trim();
    const valor = limpia
      .slice(corte + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (clave) salida[clave] = valor;
  }
  return salida;
};

const entorno = {
  ...leerArchivoEnv(".env"),
  ...leerArchivoEnv(".env.local"),
  ...process.env,
};

const definida = (clave) => {
  const v = entorno[clave];
  return typeof v === "string" && v.trim() !== "";
};

// --- 1. secretos expuestos al navegador (ERROR) ------------------------------

/** Variables NEXT_PUBLIC_* legitimas del proyecto (ver .env.example). */
const PUBLICAS_CONOCIDAS = new Set([
  "NEXT_PUBLIC_CHAIN_MODE",
  "NEXT_PUBLIC_CHAIN_ID",
  "NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS",
  "NEXT_PUBLIC_TOKEN_REWARD_ADDRESS",
  "NEXT_PUBLIC_IDENTITY_ESCROW_ADDRESS",
  "NEXT_PUBLIC_REPORT_REGISTRY_DEPLOY_BLOCK",
  "NEXT_PUBLIC_PRIVY_APP_ID",
  "NEXT_PUBLIC_IPFS_GATEWAY",
  "NEXT_PUBLIC_SITE_URL",
  // Vercel expone estas por su cuenta en el build; no son nuestras.
  "NEXT_PUBLIC_VERCEL_URL",
  "NEXT_PUBLIC_VERCEL_ENV",
  "NEXT_PUBLIC_VERCEL_TARGET_ENV",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE",
  "NEXT_PUBLIC_VERCEL_GIT_PROVIDER",
  "NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG",
  "NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER",
  "NEXT_PUBLIC_VERCEL_GIT_REPO_ID",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_LOGIN",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_NAME",
  "NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID",
  "NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID",
  "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_VERCEL_BRANCH_URL",
  "NEXT_PUBLIC_VERCEL_REGION",
]);

/** Nombres que casi siempre designan un secreto. */
const PATRON_SECRETO = /(JWT|SECRET|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|WEBHOOK|_TOKEN|APIKEY|API_KEY|ACCESS_KEY|MNEMONIC|SEED_PHRASE)/i;

for (const clave of Object.keys(entorno)) {
  if (!clave.startsWith("NEXT_PUBLIC_")) continue;
  if (PUBLICAS_CONOCIDAS.has(clave)) continue;

  if (PATRON_SECRETO.test(clave)) {
    errores.push(
      `${clave} lleva el prefijo NEXT_PUBLIC_ y su nombre parece un secreto.\n` +
        `      Next incrusta toda variable NEXT_PUBLIC_* en el JavaScript del navegador:\n` +
        `      su valor quedaria publicado. Quita el prefijo y leela solo desde el servidor\n` +
        `      (por ejemplo dentro de src/app/api/...), como se hace con ESCALATION_WEBHOOK_URL.`,
    );
  } else {
    avisos.push(
      `${clave} no esta en .env.example. Si es intencional, agregala alli y a PUBLICAS_CONOCIDAS ` +
        `en este script. Recuerda que sera visible en el navegador.`,
    );
  }
}

// --- 2. NEXT_PUBLIC_SITE_URL valida (ERROR) ----------------------------------

if (definida("NEXT_PUBLIC_SITE_URL")) {
  const valor = entorno.NEXT_PUBLIC_SITE_URL.trim();
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      avisos.push(`NEXT_PUBLIC_SITE_URL usa ${url.protocol} — en produccion deberia ser https.`);
    }
  } catch {
    errores.push(
      `NEXT_PUBLIC_SITE_URL="${valor}" no es una URL absoluta valida.\n` +
        `      src/lib/url-base.ts hace new URL() con ella en tiempo de build y el build caeria.\n` +
        `      Formato esperado: https://mi-proyecto.vercel.app (sin barra final ni ruta).`,
    );
  }
}

// --- 3. login con Google -----------------------------------------------------

const googleId = definida("AUTH_GOOGLE_ID");
const googleSecret = definida("AUTH_GOOGLE_SECRET");

if (googleId !== googleSecret) {
  avisos.push(
    `Falta ${googleId ? "AUTH_GOOGLE_SECRET" : "AUTH_GOOGLE_ID"}: el login con Google necesita ` +
      `las dos. Sin ambas, el boton no se muestra y todos usan su seudonimo local.`,
  );
}

if (googleId && googleSecret && !definida("AUTH_SECRET")) {
  errores.push(
    "El login con Google esta configurado pero falta AUTH_SECRET.\n" +
      "      Es la clave con la que se firma la cookie de sesion. Sin ella NextAuth no arranca,\n" +
      "      y con un valor conocido cualquiera podria falsificar sesiones.\n" +
      "      Generala con: npx auth secret   (o openssl rand -base64 32)",
  );
}

// --- 4. coherencia de la configuracion de cadena (AVISOS) --------------------

const modo = (entorno.NEXT_PUBLIC_CHAIN_MODE ?? "simulado").trim();

if (modo !== "simulado" && modo !== "arbitrum") {
  avisos.push(
    `NEXT_PUBLIC_CHAIN_MODE="${modo}" no se reconoce. Valores validos: simulado | arbitrum. ` +
      `Se usara el adaptador simulado.`,
  );
}

if (modo === "arbitrum" && !definida("NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS")) {
  avisos.push(
    "NEXT_PUBLIC_CHAIN_MODE=arbitrum pero falta NEXT_PUBLIC_REPORT_REGISTRY_ADDRESS. " +
      "La app seguira con el adaptador simulado.",
  );
}

if (definida("NEXT_PUBLIC_CHAIN_ID")) {
  const id = Number(entorno.NEXT_PUBLIC_CHAIN_ID);
  if (id !== 421614 && id !== 42161) {
    avisos.push(
      `NEXT_PUBLIC_CHAIN_ID=${entorno.NEXT_PUBLIC_CHAIN_ID} no es una red conocida ` +
        `(421614 Arbitrum Sepolia, 42161 Arbitrum One). Se usara Arbitrum Sepolia.`,
    );
  }
}

// --- salida ------------------------------------------------------------------

const mostrarAvisos = avisos.length > 0 && process.env.VS_PREFLIGHT_SILENCIOSO !== "1";

if (mostrarAvisos) {
  console.warn("\n⚠ Avisos de configuracion (no bloquean el build):\n");
  for (const a of avisos) console.warn(`  - ${a}`);
  console.warn("");
}

if (errores.length > 0) {
  console.error(`\n✗ ${errores.length} problema(s) de configuracion que SI bloquean el build:\n`);
  for (const e of errores) console.error(`  - ${e}\n`);
  console.error("Referencia: .env.example y docs/DESPLIEGUE.md\n");
  process.exit(1);
}

console.log(
  `✓ entorno coherente (modo de cadena: ${modo}${avisos.length > 0 ? `, ${avisos.length} aviso(s)` : ""})`,
);
