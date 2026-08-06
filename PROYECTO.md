# Vecino Seguro — Resumen y Ruta de Implementación
### Hackathon Ethereum Lima 2026 (deadline: 12 ago, 4pm)

---

## 1. El problema (con evidencia)

- **Cobertura desigual de serenazgo**: San Juan de Lurigancho tiene 5,600 hab/agente; Villa El Salvador, Comas, San Juan de Miraflores, Chorrillos, El Agustino, Carabayllo y San Martín de Porres superan 2,000 hab/agente. En distritos como San Isidro o Miraflores la proporción es mucho menor. En zonas de estos conos, el serenazgo simplemente no llega a tiempo o no existe.
- **Desconfianza institucional**: 57% de peruanos desconfía del serenazgo (IEP, 2025). Casos recientes de corrupción dentro del propio servicio (ej. agentes de San Román acusados de robo agravado, prisión preventiva).
- **Ya existen apps municipales** (Alerta Surco, Alerta Chorrillos, Alerta Pueblo Libre, etc.) pero dependen 100% del serenazgo para todo: reportar, validar y responder. No resuelven el vacío donde el serenazgo es débil o no confiable.
- **No existe un producto real** (en Perú ni afuera) que combine: geolocalización + blockchain + validación sin depender de una sola institución. Los proyectos más cercanos (ResPública Seguridad en Argentina, AnonReport en GitHub, Hivemapper/DePIN) resuelven partes del problema pero ninguno junta todas las piezas.

---

## 2. Decisión de diseño (ya acordada con el equipo)

**No se puede anonimizar todo.** Se cede parte del cifrado a cambio de que el proyecto sea legalmente útil y no se convierta en "solo una alerta sin consecuencias". El diseño final es híbrido:

| Elemento | Cómo funciona |
|---|---|
| **Identidad** | Pseudónima por defecto (wallet, no nombre). Nadie ve quién reportó. |
| **Revelación selectiva** | El vínculo wallet↔identidad real se guarda cifrado. Solo se desbloquea con consentimiento del propio usuario o una solicitud judicial verificable (esquema de firma múltiple: usuario + plataforma + autoridad). No es anonimato total ni identificación total — es revelación bajo condición. |
| **Doble ruta de respuesta** | El reporte notifica a la red vecinal Y, con un botón aparte, puede escalar directamente a serenazgo/policía/ambulancia. No se elimina la autoridad, se añade una capa paralela. |
| **Token / recompensa** | Deja de ser "2 tokens por hora" sin condición. Se acerca a un modelo de **prueba de presencia** (proof-of-presence, como Hivemapper con HONEY o DIMO): el token se otorga por actividad verificable (movimiento real de GPS, coincidencia con otros reportes cercanos, límite de frecuencia por wallet), no por tiempo de app abierta. Esto reduce (no elimina del todo) el riesgo de bots farmeando tokens. |
| **Evidencia en blockchain** | Lo que se graba on-chain es el hash del reporte (foto/video vía IPFS + geolocalización + timestamp), no la identidad. Esto da inmutabilidad como prueba, y la identidad se añade solo si se desbloquea el vínculo. |

---

## 3. Arquitectura técnica (MVP)

**Smart contracts (Arbitrum Sepolia testnet para el hackathon, con miras a Arbitrum One):**
- `ReportRegistry.sol` — recibe hash IPFS + coordenadas + categoría + timestamp, emite evento.
- `TokenReward.sol` (ERC-20) — mintea tokens al wallet que reporta, con validación básica anti-Sybil (rate limit por wallet/zona/tiempo).
- `IdentityEscrow.sol` — guarda el hash del vínculo cifrado wallet↔identidad; solo libera con firma múltiple (usuario + guardián autorizado). Para el MVP del hackathon, esto se puede simular con un esquema simplificado (2-de-3 multisig) sin necesidad de circuitos ZK completos.

**Frontend:**
- Web app mobile-first (React/Next.js).
- Wallet abstraction (Privy o Web3Auth) para que el vecino no maneje seed phrases — clave para el puntaje de UX (20%).
- Mapa en tiempo real (Mapbox/Leaflet) con reportes por categoría.
- Flujo de reporte: categoría → foto/video → geolocalización automática → confirmar → recompensa.
- Botón de escalamiento a autoridad (puede ser un webhook/SMS/WhatsApp simulado para la demo).
- Pantalla conceptual de "revelación bajo orden judicial" (demo, no requiere integración legal real).

**Storage:** IPFS/Pinata para evidencia multimedia (igual que AnonReport).

---

## 4. Modelo de monetización

El vecino nunca paga. El dinero entra por el lado institucional/comercial:

- **Aseguradoras** pagan por acceso a mapas de riesgo agregados y anonimizados por zona.
- **Comercios locales** pagan comisión por aparecer como "punto seguro" o por participar en canje de tokens.
- **Juntas vecinales / condominios** pagan suscripción premium (analítica, soporte, contactos ilimitados).
- **Gobiernos regionales / ONGs** compran reportes agregados de zonas de riesgo (sin exponer identidades).
- **Grants** de Arbitrum Foundation / fondos de impacto Web3 para sostener el desarrollo inicial.

---

## 5. Ruta de implementación (6 días, hasta 12 ago 4pm)

**Día 1 (hoy):** Cerrar alcance del MVP a 2 categorías de reporte máximo (ej. actividad sospechosa + infraestructura/luminaria). Diseñar los 3 contratos. Definir wireframes del flujo de reporte y del mapa.

**Día 2-3:** Desarrollar y testear contratos en Arbitrum Sepolia. Integrar IPFS. Implementar rate-limit anti-Sybil básico. Levantar wallet abstraction.

**Día 3-4:** Frontend: mapa, flujo de reporte, botón de escalamiento, pantalla de revelación selectiva (demo). Conectar frontend-contratos.

**Día 5:** Pruebas end-to-end, poblar con datos de demo, desplegar versión final, preparar pitch deck (15% de la nota).

**Día 6 (12 ago, antes 4pm):** Buffer, grabar demo de respaldo por si falla en vivo, ensayar pitch, anticipar preguntas del jurado sobre los límites del anti-Sybil y el esquema de revelación.

Prioridad si el tiempo aprieta: que el flujo completo (reporte → token → mapa → escalamiento) funcione end-to-end con **una sola categoría**, antes que tener muchas categorías a medio funcionar.

---

## 6. ¿Se puede añadir lo de los sismos?

**Evaluación honesta: no como funcionalidad núcleo, sí como categoría de reporte simple y opcional si sobra tiempo.**

- La app **Sismo Detector** (Futura Innovation SRL) funciona detectando sismos en tiempo real correlacionando el movimiento simultáneo de miles de acelerómetros de teléfonos — es un problema de procesamiento de señales e infraestructura de sensores en tiempo real, no un problema de blockchain. Construir eso desde cero en 6 días es un proyecto aparte, y además no usa el ecosistema Arbitrum de forma significativa (criterio que vale 20% de la nota), por lo que dedicarle tiempo puede diluir el puntaje en "Implementación Técnica" y "Uso del Ecosistema Arbitrum".
- **Alternativa liviana y sí viable**: agregar "sismo sentido" como una categoría más de reporte (igual que "robo" o "infraestructura"): el vecino reporta "sentí un sismo" con geolocalización + timestamp, y el agregado de reportes en la misma zona/minuto genera un mapa comunitario tipo "lo sentiste" (similar al "Did You Feel It?" del USGS). Esto reutiliza toda la infraestructura que ya vas a construir (contratos, tokens, mapa) sin escribir un motor de detección nuevo.
- **Recomendación**: no lo metas al alcance del MVP. Menciónalo en la última slide del pitch como "roadmap futuro" — demuestra visión de escalabilidad sin arriesgar el tiempo que necesitas para que el core funcione bien el día de la demo.

---

## 7. Riesgos que hay que poder explicarle al jurado

- El anti-Sybil del MVP es básico (rate-limit), no una prueba de presencia completa — hay que decirlo con transparencia y presentarlo como roadmap, no esconderlo.
- La revelación selectiva en el MVP es una demo conceptual del mecanismo, no una integración legal real con el Poder Judicial — igual, hay que ser claro sobre qué es hackathon-MVP y qué sería producto real.
- El proyecto no reemplaza al serenazgo/policía, los complementa donde no llegan o no generan confianza — este es el mensaje clave del pitch.
