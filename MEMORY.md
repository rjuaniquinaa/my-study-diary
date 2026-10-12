# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
  minutos de la semana, días del mes y lista de sesiones (de más reciente a más antigua).
- Diseño con identidad "cuaderno de estudio": fondo de papel cuadriculado, bloque de
  resaltador amarillo para la racha, botón azul bolígrafo, serifa display + sans UI.
- Datos en localStorage (clave `diario-estudio-sesiones`), sin backend ni dependencias.
- Mapa de calor (spec 001) implementado y verificado: lógica pura en `heat-map.js`,
  sección nueva en la página y 23 tests con `node --test` en verde.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha calculada en cada render, nunca guardada: evita cambiar el formato de los
  datos y se corrige sola si se añaden sesiones con fechas pasadas.
- La mejor racha excluye fechas futuras (misma regla que la racha actual) y su tarjeta
  se oculta si no hay sesiones.
- Total semanal = lunes a domingo en fecha local, excluye futuras y se calcula en cada
  render: mismas reglas que las rachas y ningún dato nuevo en localStorage.
- Días del mes = días únicos con sesión con el prefijo "AAAA-MM" del mes actual;
  comparar texto local evita por completo Date/UTC y excluye futuras.
- Mapa de calor: celdas derivadas en cada render (nada nuevo en localStorage);
  coloreadas como `<button>` (teclado y foco gratis), vacías como `<div>` sin foco.
- Ayudantes de fecha duplicados en `heat-map.js` (decisión D3 del plan): la lógica se
  prueba en solitario sin tocar app.js; copias idénticas, ambas con tests.

## Aprendizajes y errores a evitar
- Al probar la lógica en node, usar helpers explícitos de fecha (hace N días / dentro
  de N días): con un signo invertido la prueba simula fallos que no existen.
- `[hidden]` no oculta un elemento si una clase le da `display:flex` (las reglas del
  autor ganan a las del navegador): hay una regla global `[hidden]{display:none}`.
- Chrome headless en macOS clamp la ventana a 500px mínimo: para ver 390px de verdad,
  cargar la página dentro de un `<iframe>` de ese ancho y capturar este.
- Chrome DevTools (MCP): `resize_page` también clamp la ventana (el 375px salió a ~550px);
  usar `emulate` con `viewport: "375x812x2,mobile,touch"` para móvil real.
- Al abrir `file://` con Chrome DevTools aparece un error de consola "Unsafe attempt to
  load URL ... unique security origins": es artefacto de la automatización, no del
  proyecto (no rompe nada; con `open` normal no aparece).
- Los estilos globales de `button` se comen las celdas del mapa: hay que acotarlos al
  formulario (`#session-form button`); ojo, el `button:hover` global ganaría por
  especificidad a una clase simple de celda.

## Próximos pasos
- Spec 001 completa (T1–T14, tasks.md). Punto abierto para el usuario: confirmar si
  las celdas de 22,3 px a 375 px resultan cómodas de tocar (la spec prohíbe scroll
  por encima de 375 px; si no comodan, toca decidir un cambio en la spec).
