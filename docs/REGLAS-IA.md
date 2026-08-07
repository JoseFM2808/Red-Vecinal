# Reglas del sistema — trabajo con IA en Vecino Seguro

Este documento es el contrato de trabajo entre el equipo y cualquier asistente de IA
(Claude Code, Cursor, Copilot u otro) que toque este repositorio.

Existe por una razón concreta: el proyecto se construye en seis días con asistencia de IA.
A esa velocidad, el problema no es escribir código — es que nadie recuerde por qué el código
es así, y que el equipo revierta decisiones buenas o repita las malas la noche antes del pitch.

---

## 1. Jerarquía de autoridad

Cuando dos fuentes se contradicen, gana la de arriba:

1. Lo que el equipo dice explícitamente en la conversación.
2. `CLAUDE.md` — alcance y decisiones de diseño ya cerradas.
3. `docs/PROYECTO.md` — contexto, problema, monetización, riesgos.
4. `src/data/decisiones.json` — bitácora de decisiones vigentes.
5. `src/data/arquitectura.json` — cómo está construido el sistema hoy.
6. El código.

Si la IA cree que una fuente superior está equivocada, lo dice y espera. No la sobrescribe sola.

---

## 2. La regla que no se negocia: toda decisión se registra

**Antes o al momento** de escribir código que implique una decisión no trivial, se agrega
una entrada a `src/data/decisiones.json`.

Una decisión es no trivial si cumple alguna de estas:

- Elige una librería, un servicio o un formato de datos.
- Cambia una interfaz que otro equipo va a implementar.
- Fija un límite, una constante económica o una regla de negocio.
- Sacrifica algo (privacidad, tiempo, exactitud) a cambio de otra cosa.
- Alguien podría razonablemente haber elegido lo contrario.

No es una decisión no trivial: renombrar una variable, corregir un typo, ajustar un padding.

### Formato obligatorio

```json
{
  "id": "ADR-015",
  "titulo": "Frase corta en indicativo",
  "fecha": "2026-08-07",
  "autor": "IA | Humano | IA+Humano",
  "estado": "propuesta | aceptada | reemplazada | revertida",
  "contexto": "Qué situación obligó a decidir.",
  "opciones": [{ "nombre": "Alternativa", "descartada_porque": "Razón concreta." }],
  "decision": "Qué se hace.",
  "consecuencias": ["Lo bueno y lo malo que trae, ambos."],
  "reversibilidad": "alta | media | baja",
  "costo_de_revertir": "Qué costaría deshacerlo.",
  "criterios_rubrica": ["problema", "ux", "tecnica", "arbitrum", "pitch"],
  "evidencia": ["ruta/al/archivo.ts"],
  "requiere_validacion_humana": false,
  "nota_para_humano": "Obligatorio si lo anterior es true: qué exactamente hay que aprobar."
}
```

`npm run validate` rechaza entradas incompletas. Una decisión sin alternativa descartada no
es una decisión, es una preferencia sin examinar.

### Qué marcar como `requiere_validacion_humana: true`

- Cualquier cosa que el equipo de contratos tenga que implementar igual del otro lado.
- Constantes económicas (cuánto token, cada cuánto, por qué esa cifra).
- Cualquier decisión sobre privacidad o identidad.
- Cualquier cosa que la IA haría distinto si tuviera más contexto del negocio.

Estas aparecen destacadas en `docs/DECISIONES.md` y en la pestaña Arquitectura de la app,
así que no se pierden entre commits.

---

## 3. Fuentes de verdad generadas

`docs/ARQUITECTURA.md` y `docs/DECISIONES.md` **se generan**. Editarlos a mano es trabajo
que se pierde en el siguiente `npm run docs`.

| Quieres cambiar… | Edita | Después corre |
| --- | --- | --- |
| La arquitectura o el estado de un módulo | `src/data/arquitectura.json` | `npm run docs` |
| Una decisión | `src/data/decisiones.json` | `npm run docs` |
| El contexto del proyecto | `docs/PROYECTO.md` (a mano) | — |

`npm run docs:check` falla si los `.md` quedaron desincronizados. Está dentro de `npm run check`.

---

## 4. Reglas de código

**Todo lo que otro equipo va a reemplazar vive detrás de una interfaz.**
Cadena, storage e identidad son adaptadores. La beta corre la versión simulada; el equipo de
contratos escribe la real contra la misma interfaz. Ninguna pantalla importa un adaptador
concreto: importan `obtenerAdaptadorDeCadena()`.

**Las reglas de negocio son funciones puras con tests.**
Anti-Sybil, hash canónico y geometría no tocan React, ni `window`, ni fechas implícitas.
Reciben `ahora` como parámetro. Si una regla también va a vivir en Solidity, sus constantes
son la especificación que el equipo de contratos porta.

**TypeScript estricto, sin `any`.**
`noUncheckedIndexedAccess` está activo: indexar un arreglo devuelve `T | undefined` y hay que
manejarlo. Es molesto y evita el crash en la demo.

**Nada de dependencias nuevas sin ADR.**
Cada paquete es una cosa más que puede romper el build de Vercel el 12 de agosto a las 3 p.m.

**Español en la interfaz y en los nombres de dominio.**
`Reporte`, `categoria`, `zonaId`. Los términos técnicos establecidos se quedan en inglés
(`hash`, `adapter`, `chainId`): traducirlos confunde más de lo que aclara.

**Etiquetar lo simulado.**
Si algo no hace de verdad lo que aparenta, lleva el componente `EtiquetaSimulado` y aparece
en `limites` dentro de `arquitectura.json`. Un jurado que descubre solo que algo era falso
castiga más que uno al que se lo advirtieron.

---

## 5. Antes de decir "listo"

```bash
npm run check
```

Corre en orden: validación de datos → docs sincronizados → tipos → lint → tests.
Si falla, no está listo. No se reporta "hecho" con el check en rojo.

Para cambios de interfaz, además: abrir en 360 px de ancho y confirmar que no hay
scroll horizontal ni botones de menos de 44 px.

---

## 6. Límites de alcance

Cerrado hasta el 12 de agosto, salvo que el equipo diga lo contrario en la conversación:

- **Dos categorías de reporte.** No tres.
- **Sismos no.** Es roadmap del pitch, no funcionalidad.
- **Sin base de datos.** La cadena es la fuente de verdad compartida.
- **Sin más pestañas.** Inicio, Mapa, Reportar, Cuenta, Arquitectura.

Si el tiempo aprieta, la prioridad es que **una** categoría funcione de punta a punta
(reporte → hash → recompensa → mapa → escalamiento) antes que dos a medias.

---

## 7. Cómo se comunica la IA en este proyecto

- Por etapas, diciendo al empezar qué etapas son.
- Viñetas cortas. Si hay un dato, con su fuente.
- Cuando hay duda real, se pregunta en vez de adivinar; cuando hay una asunción razonable,
  se declara y se sigue.
- Los problemas encontrados se reportan tal cual: si un test falla, se dice que falla.
