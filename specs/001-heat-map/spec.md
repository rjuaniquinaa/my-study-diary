# Spec 001 — Mapa de calor de días estudiados

- **Estado**: Borrador revisado (QA del 11 oct 2026: resueltas las 21 observaciones)
- **Fecha**: 11 oct 2026
- **Relacionada**: `docs/constitution.md`

## Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha, los minutos de la
semana y los días del mes, pero ninguno de esos números refleja la constancia a lo
largo del tiempo: dos personas con la misma racha pueden tener historiales muy
distintos. El objetivo es ofrecer una visión histórica de un vistazo, tipo "mapa de
calor": las últimas 12 semanas día a día, donde los días con más minutos estudiados se
ven con un color más intenso. El porqué: ver el patrón (días habituales, huecos,
semanas flojas) motiva más que un número suelto.

## Usuarios

Único usuario: la persona dueña del diario, estudiante principiante, que lo usa en su
móvil y su ordenador personal. No hay cuentas ni usuarios invitados.

## Historias de usuario

- **HU-1**: Como estudiante, quiero ver mis últimas 12 semanas de estudio en una
  cuadrícula, para reconocer de un vistazo mis semanas constantes y mis huecos.
- **HU-2**: Como estudiante, quiero saber cuántos minutos estudié un día concreto al
  pasar el cursor, tocar la celda o llegar a ella con el teclado, para comparar días
  sin buscar en la lista.
- **HU-3**: Como principiante, quiero una leyenda breve que explique los colores, para
  no tener que adivinar qué significa cada tono.

## Requisitos funcionales

### RF-1 — Periodo y retícula
- CA1: DADA la app abierta, CUANDO se muestra el mapa, ENTONCES consta de 12 columnas
  de semana (de izquierda a derecha, la más antigua primero) y 7 filas de lunes a
  domingo; la columna más reciente es la semana en curso.
- CA2: DADA la fecha de hoy en el momento de mostrar la página, CUANDO se calcula el
  periodo, ENTONCES empieza en el lunes de la semana en curso menos 11 semanas y
  termina en el domingo de la semana en curso; los días posteriores a hoy quedan sin
  color.
- CA3: DADA una sesión con fecha anterior al lunes de inicio del periodo, CUANDO se
  muestra el mapa, ENTONCES esa sesión no aparece en ninguna celda; DADA una sesión con
  fecha en o posterior a ese lunes y no futura, ENTONCES aparece en su celda.
- CA4: DADA la página abierta mientras cambia el día (medianoche), CUANDO nadie vuelve
  a mostrar la página, ENTONCES el mapa conserva el periodo del momento en que se
  mostró.

### RF-2 — Minutos por día
- CA1: DADA una fecha con una o varias sesiones, CUANDO se calcula el total del día,
  ENTONCES se suman los minutos de todas las sesiones válidas de ese día.
- CA2: DADA una sesión registrada, CUANDO se determina el día al que pertenece,
  ENTONCES se usa la fecha local del usuario y nunca la fecha UTC.
- CA3: DADA una sesión con minutos no numéricos, infinitos o menores o iguales que 0,
  CUANDO se calcula el total del día, ENTONCES esa sesión se ignora sin impedir el
  resto del cálculo.
- CA4: DADA un día con sesiones registradas pero cuyo total de minutos válidos es 0,
  CUANDO se clasifica el día para el mapa, ENTONCES se trata como un día sin sesión.

### RF-3 — Niveles de color
- CA1: DADA una fecha sin sesiones válidas (sin sesión registrada, o cuyo total válido
  sea 0) o anterior a la primera sesión, CUANDO se muestra su celda, ENTONCES queda
  vacía, sin color.
- CA2: DADA un día cuyo total, redondeado al entero más cercano, está entre 1 y 29,
  CUANDO se muestra su celda, ENTONCES se pinta con el tono suave.
- CA3: DADA un día cuyo total, redondeado al entero más cercano, está entre 30 y 59,
  CUANDO se muestra su celda, ENTONCES se pinta con el tono medio.
- CA4: DADA un día cuyo total, redondeado al entero más cercano, es 60 o más, CUANDO se
  muestra su celda, ENTONCES se pinta con el tono intenso.
- CA5: DADA un total con decimales (solo posible en datos antiguos o manipulados, ya
  que el formulario pide enteros), CUANDO se asigna el tono, ENTONCES se redondea al
  entero más cercano (las décimas de 0,5 o más suben; por debajo bajan).

### RF-4 — Detalle del día
- CA1: DADA una celda coloreada, CUANDO el usuario pasa el cursor por ella, la toca o
  la enfoca con el teclado, ENTONCES se muestra su fecha (con mes en español y año, por
  ejemplo "9 oct 2026") y sus minutos totales del día ("9 oct 2026 — 60 min") en una
  zona fija de la propia sección del mapa, bajo la retícula y sin superponerse a las
  celdas; para celdas vacías no se muestra nada.
- CA2: DADA un detalle visible, CUANDO el usuario pasa a otra celda coloreada, ENTONCES
  el detalle la describe; CUANDO el cursor sale del mapa, el usuario toca fuera del
  mapa o el foco del teclado sale de él, ENTONCES el detalle desaparece.
- CA3: DADA una celda con detalle visible, CUANDO el usuario deja de interactuar,
  ENTONCES el detalle permanece hasta la siguiente interacción (no se oculta por
  pasar el tiempo).

### RF-5 — Leyenda
- CA1: DADA la sección del mapa visible, CUANDO se muestra, ENTONCES incluye una
  leyenda con las tres muestras de tono, de menor a mayor, acompañadas del texto
  "menos → más minutos"; las celdas sin sesión no tienen muestra en la leyenda.

### RF-6 — Estado vacío
- CA1: DADA la app sin ninguna sesión registrada, CUANDO se carga la página, ENTONCES el
  mapa y su leyenda no se muestran.
- CA2: DADA al menos una sesión registrada, CUANDO se muestra la página, ENTONCES el
  mapa se muestra con las 12 columnas del periodo (la última puede estar incompleta).
- CA3: DADA una instalación cuyas sesiones son todas futuras o todas inválidas, CUANDO
  se carga la página, ENTONCES el mapa se muestra con todas sus celdas vacías
  (comportamiento aceptado en esta versión).

### RF-7 — Actualización en vivo
- CA1: DADA la página abierta, CUANDO el usuario guarda una sesión, ENTONCES la página
  refleja el cambio sin recargar; si la fecha de la sesión está dentro del periodo,
  ENTONCES su celda se actualiza con los minutos totales de ese día.
- CA2: DADA el mapa oculto por no haber sesiones, CUANDO el usuario guarda la primera
  sesión, ENTONCES el mapa aparece con esa celda ya coloreada.
- CA3: DADA una sesión guardada con fecha fuera del periodo (anterior al lunes de
  inicio o futura), CUANDO se actualiza la página, ENTONCES el mapa no cambia y el
  resto de la app se comporta como hasta ahora.

### RF-8 — Respeto a los datos existentes
- CA1: DADA una instalación con sesiones ya guardadas, CUANDO se muestra el mapa,
  ENTONCES no se guarda ningún dato nuevo ni cambia el formato de lo ya guardado: el
  mapa se deriva de las sesiones existentes.

## Requisitos no funcionales

- **RNF-1**: En pantallas de 375 px o más, el mapa es usable sin scroll horizontal y
  las celdas tienen tamaño suficiente para tocarlas con el dedo; por debajo de 375 px
  se admite scroll horizontal sin perder la legibilidad de las celdas.
- **RNF-2**: El detalle de un día no depende solo del hover: también funciona con toque
  y con teclado, y no es imprescindible para entender el mapa.
- **RNF-3**: Los tres tonos deben distinguirse entre sí y respetar la identidad visual
  del cuaderno (tonos del resaltador).
- **RNF-4**: El cálculo y el pintado son instantáneos aunque haya cientos de sesiones
  guardadas.
- **RNF-5**: Fechas siempre en hora local (Constitución §5); sin dependencias ni paso
  de build (Constitución §1).
- **RNF-6**: Todos los textos de la sección, incluido el formato del detalle (mes en
  español), están en español pase lo que pase con el idioma del navegador
  (Constitución §6).
- **RNF-7**: La lógica sin interfaz comprende tres cosas: el cálculo del periodo a
  partir de "hoy", los totales por día y la asignación de tono. Las tres se comportan
  como funciones puras que reciben "hoy" como parámetro (Constitución §3), de modo que
  la puerta de tests (Constitución §4) puede cubrirlas sin interfaz.

## Casos límite

- Semana en curso incompleta: los días posteriores a hoy quedan en blanco (RF-1 CA2).
- Frontera del periodo: una sesión del domingo anterior al lunes de inicio no aparece
  en el mapa; a partir del lunes de inicio, aparece (RF-1 CA3).
- Día con sesiones cuyo total válido es 0: se trata como día sin sesión, celda vacía
  (RF-2 CA4).
- Minutos con decimales (datos manipulados o antiguos): se redondean al entero más
  cercano antes de asignar tono (RF-3 CA5).
- Instalación solo con sesiones futuras o inválidas: el mapa se muestra vacío
  (RF-6 CA3).
- Sesión de hace más de 12 semanas: no se ve en el mapa, pero sigue contando para
  rachas y totales (no cambia nada de lo existente).
- Página abierta al cruzar la medianoche: el mapa no se recalcula solo (RF-1 CA4).
- Cambio de zona horaria del usuario: las fechas guardadas son texto local y no se
  reinterpretan; "hoy" se toma en el siguiente momento en que se vuelve a mostrar la
  página.
- Día de 23 o 25 horas (cambio de horario): un día local es una celda; el cálculo usa
  fechas locales, no horas.
- Sesión registrada con fecha futura por error: no colorea ninguna celda (RF-7 CA3).

## Fuera de alcance (v1)

- Recalcular el mapa al cruzar la medianoche con la página abierta.
- Etiquetas de meses o semanas en la retícula.
- Estadísticas nuevas (día más productivo, medias, comparativas con periodos).
- Clic en una celda que filtre la lista de sesiones o permita editar o borrar.
- Configurar umbrales, número de semanas o paleta de color.
- Animaciones, exportación o impresión del mapa.
- Persistir cualquier dato derivado del mapa.

## Criterios de finalización

- Todos los RF y sus criterios EARS verificados uno a uno.
- Los tests de la lógica descrita en RNF-7 están en verde antes de tocar la interfaz
  (Constitución §4).
- Verificación manual en navegador: funcionalidad completa, consola sin errores propios
  y comprobación de la vista móvil de 375 px.
- Compatible con las sesiones ya guardadas; no se pierde ningún dato (Constitución §5).
- Nada implementado que no esté descrito aquí (Constitución §2).

## Dudas abiertas

Ninguna. Las dos que quedaban se resolvieron en la revisión QA del 11 oct 2026:

- **Ubicación**: debajo de las tarjetas de resumen (esta semana / este mes) y encima
  del formulario.
- **Cierre del detalle en móvil**: al tocar otra celda o fuera del mapa; sin
  auto-ocultado por tiempo, para no añadir temporizadores que compliquen el uso.
