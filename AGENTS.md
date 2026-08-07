# Instrucciones para agentes de IA

Este repositorio se desarrolla con asistencia de IA bajo reglas explícitas.

**Lee, en este orden, antes de escribir código:**

1. [`CLAUDE.md`](CLAUDE.md) — qué es el proyecto, qué está decidido, qué no se toca.
2. [`docs/REGLAS-IA.md`](docs/REGLAS-IA.md) — reglas de trabajo obligatorias.
3. [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — cómo está construido (generado desde `src/data/arquitectura.json`).
4. [`docs/DECISIONES.md`](docs/DECISIONES.md) — por qué está así (generado desde `src/data/decisiones.json`).

**Las tres reglas que más se rompen:**

- Toda decisión no trivial va a `src/data/decisiones.json` **antes** de implementarla.
- `docs/ARQUITECTURA.md` y `docs/DECISIONES.md` son generados: edita el JSON y corre `npm run docs`.
- No se reporta "listo" sin que `npm run check` pase en verde.
