# Plan de implementación — Spec 001: Mapa de calor

- **Estado**: Propuesta pendiente de aprobación del usuario
- **Fecha**: 11 oct 2026
- **Referencias**: `specs/001-heat-map/spec.md` (la spec manda, Constitución §2),
  `docs/constitution.md`
- **Alcance**: únicamente lo descrito en la spec 001. Todo lo marcado "fuera de
  alcance" en la spec no se toca.

Resumen: la lógica del mapa vive en un archivo nuevo de funciones puras, testeable
con `node --test`; `app.js` solo las pinta; `index.html` y `styles.css` ganan una
sección nueva. Ni datos nuevos en localStorage (RF-8) ni dependencias (Constitución §1).

---

## 1. Archivos que se crean o modifican

### Nuevos (⚠ creación de archivos: requiere aprobación — AGENTS.md)

**`heat-map.js`** — Toda la lógica del mapa de calor, en funciones puras: cálculo del
periodo de 12 semanas a partir de "hoy", suma de minutos por día, asignación de tono y
construcción de la lista de 84 celdas. Sin DOM, sin localStorage, sin Date global
oculto: "hoy" siempre llega como parámetro (Constitución §3, RNF-7). Al final del
archivo, un guard mínimo de CommonJS lo exporta solo si está en Node; en el navegador
las funciones quedan como globales de un `<script>` normal.
Cubre: RF-1, RF-2, RF-3; base lógica de RF-6 CA3 y RF-7 (recalculo puro).

**`tests/heat-map.test.js`** — Pruebas de las funciones anteriores con `node --test`
(Constitución §4). Importa `heat-map.js` con `require` vía el guard de CommonJS.
Cubre: puerta de tests de todos los RF de lógica.

### Modificados

**`index.html`** — Nueva sección tipo tarjeta entre el bloque `.stats` (semana/mes) y
el formulario, tal como fija la spec (dudas abiertas resueltas). Contiene: título de
la sección, la retícula del mapa (contenedor vacío que rellena JS), la zona de detalle
bajo la retícula y la leyenda de tres muestras + texto. La sección nace con `hidden`
(el render la mostrará si hay sesiones). Añade la etiqueta de script de `heat-map.js`
**antes** de `app.js` (el render de app.js llama a su lógica).
Cubre: RF-4 (zona de detalle), RF-5 (leyenda), RF-6 (oculto por defecto).

**`styles.css`** — Tokens de color de los tres tonos en `:root` (derivados del
resaltador `--mark`), estilos de la retícula (grid de 12 columnas × 7 filas, celdas
cuadradas y tocables), clases de tono, estilo de la zona de detalle, de la leyenda y
del foco de teclado. Además, el estilo del botón CTA (azul, ancho completo) se limita
al formulario para que las celdas-botón no lo hereden.
Cubre: RF-3 (clases de tono), RF-5 (leyenda), RNF-1 (tamaño tocable, sin scroll ≥375),
RNF-3 (identidad cuaderno).

**`app.js`** — Referencias a los nuevos elementos, un bloque dentro de `render()` que
muestra/oculta la sección y reconstruye la retícula con `getHeatMapCells(...)`, y los
eventos de detalle (cursor, toque, teclado). No toca rachas, semana, mes ni lista.
Cubre: RF-4 (eventos y texto del detalle), RF-6 (toggle de visibilidad), RF-7
(reutiliza el render existente tras guardar), RF-8 (todo derivado, cero escrituras).

---

## 2. Funciones puras de lógica (Constitución §3)

Todas reciben "hoy" o datos por parámetro; ninguna lee el reloj por su cuenta, ni el
DOM, ni localStorage. "Hoy" es un **objeto Date en hora local** (nunca un texto
"AAAA-MM-DD", ver decisión D2).

| Función | Entrada | Salida | RF que cubre |
|---|---|---|---|
| `getHeatMapPeriod(hoy)` | Date local | objeto `{ start, end }` con dos textos "AAAA-MM-DD" | RF-1 CA1, CA2, CA3 |
| `getDayMinutes(sessions, date)` | lista de sesiones, texto "AAAA-MM-DD" | número ≥ 0 (minutos válidos del día) | RF-2 CA1, CA3 |
| `getTone(total)` | número (minutos del día) | nivel 0, 1, 2 o 3 | RF-3 CA2–CA5, RF-2 CA4 |
| `getHeatMapCells(sessions, hoy)` | lista de sesiones, Date local | lista de 84 celdas `{ date, minutes, tone }`, ordenadas de la semana más antigua a la actual, cada semana de lunes a domingo | RF-1, RF-2, RF-3 completos; base de RF-6 CA3 y RF-7 |

Reglas comunes a las cuatro (las verifica la puerta de tests):

- Pureza: no tocan DOM ni localStorage; no mutan el `hoy` ni el array de sesiones
  recibido (trabajan sobre copias al avanzar días).
- Fecha local siempre: convierten Date → texto con el mismo patrón local que ya usa la
  app (`toLocalDateString`), y avanzan días con `setDate` sobre copias locales (días de
  23 o 25 horas correctos).
- `heat-map.js` define sus propias copias autónomas de esos dos ayudantes internos
  (`toLocalDateString` y el ancla de lunes de la semana); ver decisión D3.
- Los límites de tono (1, 30, 60) viven como constantes dentro de `getTone`, no son
  configurables (fuera de alcance en la spec).

---

## 3. Algoritmo del mapa en pseudocódigo

```text
FUNCIÓN getHeatMapPeriod(hoy):                        # RF-1 CA1, CA2
    desplazamiento = (día de la semana de hoy + 6) % 7   # lunes = 0 ... domingo = 6
    lunesFin = copia de hoy con día = hoy - desplazamiento
    lunesInicio = copia de lunesFin con día = lunesFin - 77   # 11 semanas
    domingoFin = copia de lunesFin con día = lunesFin + 6
    DEVOLVER { start: textoLocal(lunesInicio), end: textoLocal(domingoFin) }

FUNCIÓN getDayMinutes(sesiones, fecha):                # RF-2 CA1, CA3
    total = 0
    PARA CADA sesión EN sesiones:
        SI sesión.date == fecha:
            m = Número(sessión.minutes)
            SI es finito(m) Y m > 0:
                total = total + m
    DEVOLVER total

FUNCIÓN getTone(total):                                # RF-3 CA2-CA5, RF-2 CA4
    r = Redondear(total)                               # .5 o más sube (Math.round)
    SI r < 1  DEVOLVER 0                               # vacía
    SI r <= 29 DEVOLVER 1                              # suave
    SI r <= 59 DEVOLVER 2                              # medio
    EN OTRO CASO DEVOLVER 3                            # intenso

FUNCIÓN getHeatMapCells(sesiones, hoy):                # RF-1, RF-2, RF-3
    { start, end } = getHeatMapPeriod(hoy)
    hoyTexto = textoLocal(hoy)
    celdas = lista vacía
    cursor = Date local construido a partir de start
    MIENTRAS textoLocal(cursor) <= end:
        fecha = textoLocal(cursor)
        minutos = getDayMinutes(sesiones, fecha)
        SI fecha > hoyTexto:                           # día futuro (RF-1 CA2)
            tono = 0
        EN OTRO CASO:
            tono = getTone(minutos)
        añadir { date: fecha, minutes: minutos, tone: tono } a celdas
        cursor = copia de cursor con día = cursor + 1
    DEVOLVER celdas                                    # siempre 84 elementos
```

Comparar fechas se hace como texto ("AAAA-MM-DD" se ordena solo, ya se usa así en la
app); nunca se crea `new Date("AAAA-MM-DD")` (trampa UTC prohibida por AGENTS.md).

Pseudocódigo del pintado en `render()`:

```text
EN render():
    si sesiones vacías → ocultar sección del mapa y terminar      # RF-6 CA1
    mostrar sección                                               # RF-6 CA2, CA3
    celdas = getHeatMapCells(sesiones, new Date())                # "hoy" del render
    vaciar la zona de detalle
    vaciar la retícula
    PARA CADA celda EN celdas:
        SI tone == 0 → añadir div vacío (sin foco, sin detalle)   # RF-4 CA1
        EN OTRO CASO → añadir botón con clase de tono y
                       etiqueta aria "9 oct 2026 — 60 min"        # RF-4, RNF-2
```

---

## 4. Cómo se pinta en la interfaz

**Estructura (index.html)**: la nueva tarjeta lleva un título de sección en español
("Últimas 12 semanas"), el contenedor de la retícula, un párrafo de detalle vacío con
altura reservada (evita saltos de layout) y la leyenda: tres muestras de color de
menor a mayor + texto "menos → más minutos" (RF-5). Sin etiquetas de días ni meses:
ningún RF las pide (fuera de alcance).

**Retícula (styles.css)**: un único grid con flujo por columnas y 7 filas; las 84
celdas se añaden en orden cronológico y caen solas en columnas de semana, lunes arriba
(RF-1 CA1). Celdas cuadradas del ancho de la columna, con hueco pequeño; a 375 px
entran las 12 columnas sin scroll horizontal y con celdas tocables (RNF-1). Tres
clases de tono usando tokens nuevos derivados del resaltador: suave = amarillo muy
claro, medio = el propio `--mark` existente, intenso = amarillo profundo (RNF-3).
Celdas con foco visible azul bolígrafo al navegar con teclado (RNF-2).

**Detalle (RF-4)**: zona fija bajo la retícula dentro de la propia tarjeta; nunca se
superpone a las celdas. El texto se compone reutilizando `formatDate` de app.js (ya
fuerza mes en español con `es-ES`, cumple RNF-6) + minutos totales del día. Vacío por
defecto; sin auto-ocultado por tiempo (RF-4 CA3).

**Eventos (app.js)**:

- Cursor sobre una celda coloreada → muestra detalle; cursor sale de la retícula →
  vacía (RF-4 CA2).
- Toque sobre una celda coloreada → muestra detalle; toque fuera de la tarjeta →
  vacía (RF-4 CA2).
- Foco de teclado sobre una celda coloreada → muestra detalle; el foco sale de la
  retícula → vacía (RF-4 CA1, RNF-2). Además cada celda lleva su texto en `aria-label`
  para lector de pantalla.
- Celdas vacías: `<div>` sin foco ni eventos (RF-4 CA1).

**Actualización en vivo (RF-7)**: no hay que escribir nada nuevo; el formulario ya
llama a `render()` tras guardar, y `render()` reconstruye la retícula completa desde
`getHeatMapCells` (recálculo puro y determinista). Guardar la primera sesión hace
aparecer la sección (oculta con `hidden`, patrón ya usado por la mejor racha).

---

## 5. Decisiones técnicas (y alternativas descartadas)

**D1 — Archivo `heat-map.js` con guard de CommonJS** (`module.exports` solo si existe
`module`).
Permite probar la lógica con `require` en Node y usarla como `<script>` clásico en
`file://`, sin build. Descartado: módulos ES (prohibidos por AGENTS.md y fallan en
`file://`), añadir `package.json` ( introduce npm/configuración, Constitución §1),
meter la lógica en `app.js` y requerirlo en tests (app.js toca DOM/localStorage al
cargar y rompería en Node), o copiar/extraer la lógica con `eval` en los tests (frágil
y no mantiene una sola fuente de verdad).

**D2 — "Hoy" llega como Date local por parámetro.**
Satisface RF-1 CA4 (el periodo depende del momento del render), RNF-7 y permite tests
deterministas con fechas fijas. Descartado: "hoy" como texto "AAAA-MM-DD" (exigiría
parsearlo con `new Date("AAAA-MM-DD")`, trampa UTC expresamente prohibida) o leer
`new Date()` dentro de la lógica (la volvería impura e intratable).

**D3 — Ayudantes de fecha autónomos dentro de `heat-map.js`.**
La lógica necesita dos operaciones locales (Date → texto y lunes de la semana); se
repiten ahí en su propia copia, comentadas. Descartado: crear un `dates.js` compartido
(sin módulos, compartir exigía un puente condicional `require`/global, código "listo"
que un principiante no entiende) o extraerlas de `app.js` hacia el archivo nuevo
(dependencia al revés: un archivo de funcionalidad se vuelve la base de todo y hay que
tocar código que ya funciona; AGENTS.md: no reescribas lo que funciona). La duplicación
es de ~13 líneas, ambas copias cubiertas por sus tests respectivos.

**D4 — Retícula: un solo grid con flujo por columnas.**
Las 84 celdas en orden cronológico rellenan solas columnas de 7 filas. DOM plano, sin
nodos intermedios, fácil de vaciar y reconstruir en cada render. Descartado: 12
contenedores "semana" (más nodos y más código) o filas con orden transpuesto a mano
(más difícil de leer).

**D5 — Celdas coloreadas = `<button>`; vacías = `<div>`.**
El botón da foco, Enter/Espacio y rol de lector de pantalla gratis (RNF-2), y vaciar
las vacías evita 84 focos inútiles (RF-4 CA1). Descartado: `<div tabindex="0">`
(reinventa lo que ya da el botón, con más código y peor accesibilidad).

**D6 — Estilos del botón CTA limitados al formulario.**
El CSS global actual estiliza todo `button` (ancho completo, azul). Se acota a los
botones del formulario y las celdas reciben sus propios estilos. Descartado: sobreescribir
propiedad por propiedad en las celdas (pelea de especificidad con `button:hover`:
errores fáciles y difíciles de ver para un principiante).

**D7 — Detalle en zona fija + `aria-label` en la celda.**
Texto simple con `textContent`, sin superponer nada (RF-4 CA1) y con la misma frase
legible para lectores de pantalla. Descartado: atributo `title` nativo (no funciona al
tocar, no se puede estilizar), tooltip flotante sobre la celda (se superpone; la spec
pide zona fija), `aria-live` en la zona de detalle (doble anuncio con el
`aria-label` al enfocar).

**D8 — Tono medio = token `--mark` existente.**
Garantiza de entrada la identidad de resaltador (RNF-3): suave e intenso son sus
vecinos. Descartado: escala verde-rojo "tipo GitHub" (rompe la identidad cuaderno) o
aplicar opacidad sobre un color (menos control de contraste).

**D9 — Límites de tono como constantes internas de `getTone`.**
La spec fija 1/30/60 y prohíbe configurarlos; no se expone ninguna opción. Descartado:
objeto de configuración (complejidad que ningún RF pide, Constitución §2).

**D10 — Sin optimizar los totales.**
`getHeatMapCells` llama a `getDayMinutes` 84 veces: con cientos de sesiones son ~42k
iteraciones, instantáneas (RNF-4). Descartado: mapa previo fecha→minutos en una sola
pasada (más estructura y código sin beneficio medible; solo si la verificación
mostrara lentitud, que no se espera).

---

## 6. Estrategia de tests con `node --test` (Constitución §4)

- Comando: `node --test` desde la raíz del repo. Si la versión de Node no descubre
  `tests/`, fallback `node --test tests/`.
- Archivo único `tests/heat-map.test.js`, en CommonJS; importa `heat-map.js` con
  `require`. Sin paquetes (Constitución §1).
- Puerta: los tests se escriben y quedan **en verde antes de tocar la interfaz**
  (Constitución §4). Después de cada cambio de lógica, se vuelven a ejecutar.

Pruebas previstas (función → casos → RF):

- `getHeatMapPeriod`: hoy en mitad de la semana → ventana de 84 días, empieza en lunes
  y termina en domingo (RF-1 CA1/CA2); hoy siendo lunes y siendo domingo (bordes) →
  misma ventana alineada; hoy en enero → la ventana cruza año y sale el año anterior;
  hoy justo después de la medianoche local (Date con hora 00:30) → anclado al día local,
  no al UTC (RF-2 CA2).
- `getDayMinutes`: varias sesiones mismo día se suman (RF-2 CA1); minutos no numéricos,
  `NaN`, infinitos o ≤ 0 se ignoran y el resto suma (RF-2 CA3); solo minutos inválidos →
  0 (RF-2 CA4).
- `getTone`: bordes exactos 0 → 0, 1 → 1, 29 → 1, 30 → 2, 59 → 2, 60 → 3, 500 → 3
  (RF-3 CA2–CA4); decimales con redondeo 0,4 → 0, 29,4 → 1, 29,5 → 2, 59,5 → 3
  (RF-3 CA5).
- `getHeatMapCells`: devuelve siempre 84 celdas, primera = start, última = end
  (RF-1 CA1); sesión anterior a start no aparece en ninguna celda y sesión dentro del
  periodo sí con sus minutos totales (RF-1 CA3, RF-2 CA1); sesión futura dentro de la
  ventana → tono 0 (RF-1 CA2, RF-7 CA3); instalación solo con sesiones futuras o
  inválidas → todas las celdas tono 0 (RF-6 CA3); pureza: mismas entradas → misma
  salida y el `hoy` recibido queda sin tocar (Constitución §3).
- Fuera de tests automatizados: todo lo visual y de eventos (RF-4, RF-5, RF-6 visible,
  RF-7 en vivo, RNF-1, RNF-6). Se verifica a mano con Chrome DevTools (AGENTS.md);
  probar un DOM exigiría una dependencia tipo jsdom, prohibida (Constitución §1).

---

## 7. Cobertura RF → plan

| RF | Dónde se cubre |
|---|---|
| RF-1 Periodo y retícula | `getHeatMapPeriod` + `getHeatMapCells` (tests) + grid por columnas (estilos) |
| RF-2 Minutos por día | `getDayMinutes` + `toLocalDateString` local (tests) |
| RF-3 Niveles de color | `getTone` (tests de bordes y redondeo) + clases de tono (CSS) |
| RF-4 Detalle del día | Zona fija + eventos cursor/toque/foco + `aria-label` (app.js); `formatDate` reutilizado; verificación manual |
| RF-5 Leyenda | HTML de la leyenda + estilos; verificación manual |
| RF-6 Estado vacío | Toggle `hidden` en `render()` + test de celdas todas tono 0; verificación manual |
| RF-7 Actualización en vivo | `render()` ya se ejecuta tras guardar; test de determinismo; verificación manual |
| RF-8 Datos existentes | Decisión: cero claves nuevas, todo derivado; verificación manual de localStorage |

---

## 8. Orden de trabajo, verificación y riesgos

1. **Lógica + tests**: crear `heat-map.js` y `tests/heat-map.test.js`; `node --test`
   en verde (puerta Constitución §4).
2. **Estructura y estilos**: `index.html` (sección nueva, orden de scripts) y
   `styles.css` (tokens, grid, tonos, detalle, leyenda, acotar botón CTA).
3. **Integración**: bloque de mapa en `render()` y eventos de detalle en `app.js`.
4. **Verificación manual** con Chrome DevTools: cargar con datos de prueba en un
   contexto aislado (no tocar el localStorage real); probar guardar sesión y ver la
   celda cambiar; borrar la clave `diario-estudio-sesiones` de un contexto de prueba
   para ver el mapa oculto; hover, toque y teclado; consola sin errores propios;
   vista móvil a 375 px con `emulate` (no `resize_page`); inspeccionar que en
   localStorage solo existe la clave conocida y con su formato (RF-8).
5. Actualizar `MEMORY.md`.

**Riesgo/ checkpoint RNF-1**: a 375 px, cada columna queda con ~22 px de ancho. Puede
tocarse, pero es pequeño. Si en la verificación manual resulta incómodo, se para y se
pregunta (Constitución §2): no se puede recurrir a scroll horizontal porque la spec
lo prohíbe por encima de 375 px.

**Nota**: la spec no pide etiquetas de filas (lun–dom) ni de columnas; si en la
verificación parecen necesarias, se para y se preguntan (Constitución §2), no se
añaden por cuenta propia.
