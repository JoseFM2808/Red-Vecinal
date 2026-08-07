# Pitch y demo — Vecino Seguro

Hackathon Ethereum Lima 2026. Objetivo: 5 minutos de pitch + demo, y aguantar preguntas.
La rúbrica da 15% a esta parte, pero el pitch también es donde se cobran los otros 85%.

---

## Estructura de 5 minutos

### 0:00 – 0:45 · El problema, con una cifra que duele

> "En San Juan de Lurigancho hay un agente de serenazgo por cada 5,600 habitantes.
> En San Isidro la proporción es otra. Y el 57% de peruanos desconfía del serenazgo.
> Existen apps municipales —Alerta Surco, Alerta Chorrillos— pero todas dependen del
> mismo serenazgo para reportar, validar y responder. Donde el serenazgo es débil o no
> genera confianza, no hay producto."

No abrir con la tecnología. Abrir con el vacío.

### 0:45 – 1:15 · Qué construimos, en una frase

> "Vecino Seguro es una red vecinal donde reportas en tres toques, tu evidencia queda
> anclada en Arbitrum como prueba con fecha cierta, y nadie sabe quién reportó —salvo
> que tú lo autorices o exista una orden judicial. Y si hace falta, un botón aparte
> escala a serenazgo, policía o ambulancia."

Si preguntan por el login: entrar con Google no es identificarse ante la red. Es lo que
permite que exista una identidad real que revelar bajo orden judicial — sin cuenta, la
revelación selectiva no tendría nada que abrir.

La frase clave, repetirla al cerrar: **complementamos al serenazgo donde no llega, no lo reemplazamos.**

### 1:15 – 3:15 · Demo en vivo

Guion exacto (ensayarlo con cronómetro):

1. **Puerta de acceso** — entrar con Google. Frase clave: "entrar no te identifica ante la red; el alias es lo único que ven los demás y lo único que toca la cadena".
2. **Inicio** — las cifras del problema están dentro del producto, con su fuente.
3. **Reportar** — categoría → foto → ubicación automática → publicar.
   Mientras carga, señalar las etapas reales: valida anti-bots, sube a IPFS, calcula hash, ancla.
4. **Comprobante** — "esto es lo que queda en cadena: un hash. No la foto, no el nombre,
   no la dirección exacta. La coordenada va truncada a 11 metros."
5. **Recompensa** — 15 VSG con multiplicador ×1.5. "No pagamos por tener la app abierta:
   pagamos cuando otro vecino confirma el mismo hecho a menos de 300 metros dentro de 30 minutos.
   Eso es caro de falsificar; tener la app abierta no."
6. **Mapa** — el reporte aparece georreferenciado junto a los demás. Si el panel de sismos
   está activo, señalarlo: "cuando varios vecinos reportan un sismo en la misma media hora,
   la app arma el mapa de quién lo sintió, tipo 'Did You Feel It?' del USGS. Ojo con la
   frase exacta: **cuenta reportes, no mide sismos.** No tenemos acelerómetros y no vamos
   a fingir que sí."
7. **Cuenta → Revelación selectiva** — tocar las firmas y mostrar el umbral 2-de-3.
   "Ni siquiera nosotros podemos abrir el vínculo solos."
8. **Arquitectura** — cerrar aquí. Es el diferenciador: mostrar el estado real de cada módulo,
   los límites declarados y la bitácora de decisiones.

### 3:15 – 4:00 · Por qué Arbitrum

> "Un reporte por vecino por día en L1 cuesta dólares por prueba: el costo supera el valor de la
> recompensa y el producto no existe. En Arbitrum cuesta fracciones de centavo. Arbitrum no es
> un logo en la slide, es la razón por la que el modelo económico cierra."

Mostrar la barra comparativa en la pestaña Arquitectura → Arbitrum.

Segundo argumento: **el índice compartido son los eventos del contrato**. No hay base de datos
propia; el mapa multi-dispositivo se reconstruye leyendo `ReportSubmitted`.

### 4:00 – 4:40 · Los límites, dichos por nosotros

Esto suma, no resta. Un jurado que descubre solo que algo es falso castiga el doble.

- El anti-Sybil del MVP es rate-limit + corroboración. Un adversario con varios dispositivos
  todavía puede farmear. La prueba de presencia criptográfica es roadmap.
- La revelación selectiva es una demostración del mecanismo, no una integración con el Poder Judicial.
- El escalamiento tiene el contrato de integración escrito, pero no hay convenio municipal.

Todo eso está etiquetado dentro del producto, en la pestaña Arquitectura → Entrega.

### 4:40 – 5:00 · Cierre y modelo

> "El vecino nunca paga. Pagan aseguradoras por mapas de riesgo anonimizados, comercios por ser
> punto seguro, juntas vecinales por analítica, gobiernos y ONGs por datos agregados de zona."

Cerrar repitiendo la frase clave.

---

## Preguntas difíciles y cómo responderlas

**"¿Esto no se llena de reportes falsos?"**
> Tres frenos: máximo 3 reportes por hora por cuenta, 15 minutos de espera para repetir zona, y la
> recompensa completa solo llega con corroboración de otra cuenta cerca y a tiempo. Las reglas son
> funciones puras con 18 tests y son la especificación literal del contrato. ¿Es a prueba de todo?
> No: alguien con varios dispositivos puede farmear. Lo decimos en el pitch y está en el roadmap.

**"¿Por qué blockchain y no una base de datos?"**
> Porque el problema es de confianza institucional. Si la evidencia vive en el servidor de una
> institución, esa institución puede editarla o perderla — y el 57% de desconfianza dice que eso
> importa. Además, sin servidor propio no hay una base de datos que alguien pueda pedir o filtrar.

**"¿Por qué Arbitrum y no otra L2?"**
> Costo por anclaje compatible con volumen vecinal diario, ecosistema maduro para grants, y
> Stylus como camino para mover la verificación geoespacial a Rust cuando el volumen crezca.
> Lo de Stylus lo presentamos como evaluado, no como hecho: falta medir el gas.

**"¿No estarían fomentando el vigilantismo?"**
> Por eso la doble ruta. El producto no organiza respuestas: notifica y escala a la autoridad.
> Y por eso la identidad es pseudónima pero revelable bajo orden judicial: un reporte falso o
> malicioso tiene consecuencias, no es una denuncia anónima sin costo.

**"¿Y la privacidad del reportante?"**
> La coordenada se trunca a ~11 metros antes de salir del teléfono. La foto va a IPFS, nunca a un
> servidor nuestro. A la cadena solo llega un hash. El vínculo con la persona está cifrado y
> requiere 2 de 3 firmas para abrirse, con rastro público de quién lo pidió.

**"¿El círculo de cuidado no es una app de vigilancia?"**
> Es la pregunta correcta y no tenemos una respuesta completa; está escrita como pendiente
> en nuestra bitácora. Lo que sí hicimos: compartir la ubicación lo decide quien la comparte,
> no quien la recibe, y se revoca cuando quiera. Es la única parte de la app que exige cuenta,
> precisamente porque maneja teléfonos y ubicaciones de terceros. Pero el consentimiento
> revocable es el mínimo, no la solución: una herramienta que muestra dónde está tu familia
> sirve igual para cuidar que para controlar, y eso se resuelve con diseño de producto, no
> con código. Por eso está marcada como decisión abierta.

**"¿Detectan sismos de verdad?"**
> No, y no lo decimos de otra forma. Agregamos lo que reportan los vecinos: si dos o más
> personas distintas dicen "lo sentí" en media hora, mostramos el mapa por zonas y la
> intensidad más repetida. Es el modelo del "Did You Feel It?" del USGS. Un detector real
> es procesamiento de señal sobre miles de acelerómetros: otro proyecto, y uno que además
> no usaría Arbitrum para nada. Lo interesante es que la categoría reutiliza toda la
> infraestructura que ya construimos sin una línea nueva en la capa de cadena.

**"¿Qué construyeron ustedes y qué es librería?"**
> El dominio completo (hash canónico, geometría de zonas, política anti-Sybil) es propio y tiene
> tests. Los adaptadores de cadena y storage están detrás de interfaces. La pestaña Arquitectura
> muestra el estado real de cada módulo — pueden auditarlo ahí mismo.

---

## Antes de presentar

- [ ] Cuenta → **Reiniciar datos de demostración** (deja la red sembrada y limpia)
- [ ] Probar el flujo completo en el teléfono con el que se va a demostrar
- [ ] Permitir la ubicación en el navegador **antes** de subir al escenario
- [ ] Tener el plan B: si falla el GPS, el botón "Usar ubicación de demo" ya está en el flujo
- [ ] Grabar un video de respaldo de la demo completa
- [ ] Abrir la pestaña Arquitectura una vez para que las secciones queden en caché
