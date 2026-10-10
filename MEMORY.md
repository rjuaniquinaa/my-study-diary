# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual, mejor racha,
  total de minutos de la semana y lista de sesiones (de más reciente a más antigua).
- Datos en localStorage (clave `diario-estudio-sesiones`), sin backend ni dependencias.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Mejor racha calculada en cada render, nunca guardada: evita cambiar el formato de los
  datos y se corrige sola si se añaden sesiones con fechas pasadas.
- La mejor racha excluye fechas futuras (misma regla que la racha actual) y su tarjeta
  se oculta si no hay sesiones.
- Total semanal = lunes a domingo en fecha local, excluye futuras y se calcula en cada
  render: mismas reglas que las rachas y ningún dato nuevo en localStorage.

## Aprendizajes y errores a evitar
- Al probar la lógica en node, usar helpers explícitos de fecha (hace N días / dentro
  de N días): con un signo invertido la prueba simula fallos que no existen.

## Próximos pasos
- (vacío por ahora)
