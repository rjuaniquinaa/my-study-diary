# Tareas — Spec 001: Mapa de calor

Derivadas de `specs/001-heat-map/spec.md` y `plan.md`. Tareas pequeñas (máx. ~30 min),
en orden de dependencia.

Reglas:

- Constitución §4: la fase A debe estar en verde (`node --test`) **antes** de empezar
  la fase B. Nada fuera de lo que dice la spec (§2).
- Los archivos nuevos (`heat-map.js`, `tests/heat-map.test.js`) requieren la
  aprobación del usuario (AGENTS.md): se considera aprobada al aprobar este plan.

## Fase A — Lógica pura y tests (puerta)

- [x] **T1 — Esqueleto de `heat-map.js`**: ayudantes locales de fecha (Date → texto
  "AAAA-MM-DD" local y ancla de lunes) + guard de CommonJS al final del archivo.
  RF-2 CA2 (base). — Hecha el 12 oct 2026: 7 tests en verde con `node --test`.
  **Hecho cuando:** `node -e 'require("./heat-map.js")'` no falla sin DOM y, para una
  fecha local fija, los ayudantes devuelven el texto y el lunes correctos.

- [x] **T2 — `getHeatMapPeriod(hoy)` + tests**: ventana de 12 semanas alineada
  (lunes → domingo). RF-1 CA1, CA2. — Hecha el 12 oct 2026.
  **Hecho cuando:** los tests de hoy en mitad de semana, siendo lunes, siendo domingo,
  en enero (cruza año) y a las 00:30 locales pasan con `node --test`.

- [x] **T3 — `getDayMinutes(sessions, date)` + tests**: suma de minutos válidos del
  día. RF-2 CA1, CA3, CA4. — Hecha el 12 oct 2026.
  **Hecho cuando:** los tests de varias sesiones del mismo día (se suman), minutos no
  numéricos/infinitos/≤0 (se ignoran) y solo inválidos (→ 0) pasan.

- [x] **T4 — `getTone(total)` + tests**: redondeo y niveles 0–3. RF-3 CA2–CA5.
  — Hecha el 12 oct 2026.
  **Hecho cuando:** los tests de bordes exactos (0→0, 1→1, 29→1, 30→2, 59→2, 60→3,
  500→3) y de redondeo (0,4→0; 29,4→1; 29,5→2; 59,5→3) pasan.

- [x] **T5 — `getHeatMapCells(sessions, hoy)` + tests**: 84 celdas `{date, minutes,
  tone}` en orden cronológico, día futuro con tono 0. RF-1 CA3, RF-2, RF-3; base de
  RF-6 CA3 y RF-7. — Hecha el 12 oct 2026.
  **Hecho cuando:** los tests de 84 celdas (primera = start, última = end), sesión
  anterior a start ausente, sesión dentro coloreada con su total, futura con tono 0,
  solo futuras/inválidas → todas tono 0, y pureza (el `hoy` recibido queda intacto)
  pasan.

- [x] **T6 — Puerta de tests**: ejecutar la suite completa desde la raíz.
  **Hecho cuando:** `node --test` sale en verde sin ningún paquete instalado
  (Constitución §4) y solo entonces se empieza la fase B. — 23/23 en verde, 12 oct.

## Fase B — Estructura y estilos (sin lógica)

- [x] **T7 — `index.html`: sección del mapa** entre las tarjetas de resumen y el
  formulario: título, contenedor de la retícula, zona de detalle y leyenda; nace con
  `hidden`; `heat-map.js` se carga antes que `app.js`. RF-4, RF-5, RF-6 CA1 (base).
  — Hecha el 12 oct 2026 (consola sin errores propios, sección oculta sin datos).
  **Hecho cuando:** abierto con doble clic, la sección "Últimas 12 semanas" existe con
  su leyenda de tres muestras + "menos → más minutos", está oculta y la consola no
  tiene errores propios. (Sin etiquetas de filas/columnas: ningún RF las pide; si se
  echan en falta, parar y preguntar — §2.)

- [x] **T8 — `styles.css`: retícula y tonos**: grid de 12 columnas × 7 filas con flujo
  por columnas, celdas cuadradas y tocables, tokens de los tres tonos derivados del
  resaltador. RF-3 (clases), RNF-1, RNF-3. — Hecha el 12 oct 2026: a 375 px sin scroll
  horizontal; celdas medidas en 22,3 px (a la espera de la opinión del usuario sobre
  si resultan cómodas de tocar).
  **Hecho cuando:** con 84 celdas de prueba en el HTML, la vista móvil a 375 px
  (emulate de DevTools) no tiene scroll horizontal, las celdas se pueden tocar y los
  tres tonos se distinguen. Checkpoint: si a 375 px resulta incómodo tocar, parar y
  preguntar (la spec prohíbe el scroll ≥375).

- [x] **T9 — `styles.css`: detalle, leyenda, foco y CTA acotado**: estilo de la zona
  de detalle (con altura reservada), de la leyenda y del foco de teclado; el estilo
  del botón azul pasa a limitarse a los botones del formulario. RF-5, RNF-2 (base).
  — Hecho el 12 oct 2026 (captura: botón CTA intacto, leyenda correcta).
  **Hecho cuando:** el botón "Guardar sesión" se ve idéntico al de antes, las
  celdas-botón no heredan su estilo, el foco de teclado es visible y la zona de
  detalle no mueve el layout al escribirse.

## Fase C — Integración (app.js)

- [x] **T10 — Pintado del mapa en `render()`**: referencias del DOM y bloque que
  muestra/oculta la sección y reconstruye la retícula desde `getHeatMapCells` (día sin
  tono → `div` sin foco; con tono → `botón` con clase de tono y `aria-label`).
  RF-6 CA1–CA3, RF-1 (pintado). — Hecha el 12 oct 2026 (84 celdas, 3 botones y 81
  divs con los datos de prueba).
  **Hecho cuando:** con sesiones de prueba la retícula tiene 84 celdas por columnas y
  de lunes a domingo; sin sesiones la sección está oculta; las celdas vacías y futuras
  no son enfocables.

- [x] **T11 — Eventos del detalle**: cursor, foco de teclado y toque sobre celdas
  coloreadas; limpieza al salir del mapa, al tocar fuera y al salir el foco.
  RF-4 CA1–CA3, RNF-2, RNF-6. — Hecha el 12 oct 2026: hover/foco/toque muestran
  "2 oct 2026 — 60 min"; salir, blur y clic fuera limpian; celda vacía, nada.
  **Hecho cuando:** hover, Tab y toque muestran "9 oct 2026 — 60 min" (mes en español)
  en la zona de detalle, salir/tocar fuera lo limpia, las celdas vacías no muestran
  nada y no hay auto-ocultado por tiempo.

- [x] **T12 — Actualización en vivo (RF-7)**.
  RF-7 CA1, CA2, CA3. — Hecha el 12 oct 2026: guardados +45 min con el formulario
  real, la celda de hoy pasó de tono 1 a tono 3 sin recargar; con 0 sesiones, oculto.
  **Hecho cuando:** guardando una sesión del periodo su celda cambia sin recargar,
  guardando la primera sesión la sección aparece ya coloreada y una sesión futura no
  colorea ninguna celda.

## Fase D — Verificación y cierre

- [x] **T13 — Verificación manual con Chrome DevTools** en contexto aislado (datos de
  prueba, sin tocar el localStorage real). RF-8, RNF-1, RNF-4.
  — Hecha el 12 oct 2026: 375 px sin scroll; 600 sesiones → render en 32 ms; consola
  sin errores propios (solo el artefacto `file://` conocido); localStorage solo con
  `diario-estudio-sesiones` y su formato.
  **Hecho cuando:** se verifican a mano todos los RF visuales, la consola no tiene
  errores propios, la vista de 375 px (emulate) va sin scroll, el mapa responde
  igual con cientos de sesiones y en localStorage solo existe
  `diario-estudio-sesiones` con su formato original.

- [x] **T14 — Actualizar `MEMORY.md`**: estado del proyecto y decisiones del mapa.
  RF: —. **Hecho cuando:** la memoria refleja el mapa implementado, con sus
  aprendizajes y dentro del límite de ~50 líneas. — Hecha el 12 oct 2026 (47 líneas).
