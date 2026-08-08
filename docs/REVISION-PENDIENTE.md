# Revisión pendiente — hallazgos que piden una decisión

> Producto del barrido del 9 de agosto (auditoría adversarial del círculo + revisión de
> la app). Lo que era un bug claro **ya está reparado** (ver el commit correspondiente);
> esto es lo que **no se arregla sin decidir algo primero**. Cada punto trae el arreglo
> propuesto para que la decisión sea rápida.
>
> Contexto: los hallazgos salieron de una auditoría con 4 atacantes cuya fase de
> verificación murió contra el límite de gasto mensual de la organización — la
> verificación la terminó a mano el asistente leyendo el código. Si un punto parece
> exagerado, esa es la razón para revisarlo, no para descartarlo.

## Del círculo de cuidado (ADR-046)

### 1. El buzón no exige prueba de propiedad para escribir o borrar
Cualquiera con sesión (o cualquiera, en un despliegue sin login) que **conozca el
`vinculoId`** puede sobreescribir el sobre o borrarlo. El id es inadivinable (128 bits
aleatorios), así que el atacante tiene que haberlo capturado (logs de un proxy corporativo,
historial del navegador compartido). No puede *leer* posiciones (van cifradas), pero puede
vandalizar: borrar sobres o publicar basura que el observador descarta.
**Propuesta:** token de escritura derivado de la clave del vínculo (HMAC) que el servidor
verifica sin poder descifrar nada. ~40 líneas. **Decidir:** ¿vale el cambio antes del 12,
o se acepta el riesgo para la demo?

### 2. La invitación no caduca nunca
Quien fotografía un QR puede aceptarlo semanas después y empezar a compartirle su ubicación
al emisor — que quizá ya ni recuerda haberlo generado. Hoy el QR muestra "esperando
aceptación" para siempre.
**Propuesta:** caducidad de 24 h dentro del payload de la invitación (campo `exp`,
validado en `decodificarInvitacion`) y expirar el contacto "esperando" en la UI.
**Decidir:** ¿24 h es el plazo correcto? ¿La invitación debe ser de un solo uso?

### 3. Claves del vínculo en `localStorage`
Un XSS exitoso se lleva las claves y los `vinculoId` (= puede leer posiciones futuras).
Mitigado por la CSP estricta del sitio y porque no hay dependencias de terceros en el
cliente del círculo.
**Propuesta futura:** `CryptoKey` no extraíble en IndexedDB (cambio mediano, post-demo).
**Decidir:** aceptar el riesgo para la beta (recomendado) y anotarlo en los límites.

### 4. Revocación durable solo 15 minutos
La tumba cifrada vive el TTL máximo del canal (900 s). Un observador que estuvo sin
conexión más de 15 min ve "sin señal desde hace rato" en vez de "dejó de compartir".
La posición NO se muestra (eso sí es correcto); solo el motivo queda ambiguo.
**Decidir:** ¿basta así para la beta, o el estado "dejó de compartir" merece persistencia
en el canal sin TTL (un flag mínimo sin datos)?

### 5. "Inmediata" vs. latido de 20 segundos
La revocación corta la publicación al instante, pero el observador se entera en su
siguiente consulta (≤20 s). El copy dice "de inmediato".
**Decidir:** ajustar el copy ("en segundos") o dejarlo — defendible como está.

### 6. Sin AAD que ate el sobre a su vínculo
Cada vínculo tiene clave propia, así que un sobre no puede cruzarse entre vínculos de
pares distintos. El caso teórico restante exige reutilizar la misma clave en dos vínculos,
cosa que el código nunca hace.
**Propuesta:** pasar `vinculoId` como AAD de AES-GCM la próxima vez que se toque el
formato del sobre. No urgente.

## Del canal y la plataforma

### 7. Rate-limit del buzón es por instancia
En Vercel cada lambda lleva su propio contador: el límite real es 12/min × instancias.
**Propuesta:** mover el contador al KV cuando se provisione. Mientras el canal sea de
demo, el riesgo es bajo.

### 8. Válvula sin login: el canal queda abierto
En despliegues sin credenciales de Google, el buzón no exige sesión (coherente con la
válvula de toda la app, ADR-035/045). En el despliegue real de la prueba SÍ hay login,
así que no aplica — pero que quede dicho: **no desplegar el canal a producción sin
credenciales configuradas.**

## Cerrados en este barrido (referencia rápida)

- Cámara del lector QR no abría: el `<video>` se montaba después de leerse su ref — reparado.
- Bucle de consultas del observador (el latido de 20 s degeneraba en consulta continua) — reparado con refs e intervalos estables.
- Tormenta de publicaciones con cada tick del GPS (quemaba el límite 12/min) — reparado igual.
- Carrera al revocar con closure viejo (publicación en vuelo revivía el compartir) — reparado: vigencia re-verificada desde ref + guard monotónico de timestamps en el observador (un sobre viejo ya no puede resucitar nada ni retroceder posiciones).
- Fallos de publicación silenciosos — ahora hay `estadoCanal` y avisos visibles ("fallando" / "efímero").
- Invitación perdida si el enlace se abría sin sesión (la puerta redirigía y el fragmento moría) — se guarda y el consentimiento reaparece tras entrar.
- Tumba de revocación: TTL subido de 5 a 15 minutos.
