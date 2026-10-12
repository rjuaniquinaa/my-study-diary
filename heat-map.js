// Mapa de calor — lógica pura (spec 001).
// Este archivo NO toca el DOM ni localStorage: todo llega por parámetros
// y "hoy" siempre es un objeto Date en hora local (Constitución §3).
// Se carga como <script> en el navegador y con require() en los tests.

// --- Ayudantes de fecha locales ---
// Son copias autónomas de los de app.js (decisión D3 del plan): así
// heat-map.js se prueba solo y no hay que tocar el código que ya funciona.

// Convierte un objeto Date en texto "AAAA-MM-DD" usando la fecha LOCAL
// del usuario (nunca la UTC).
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convierte "AAAA-MM-DD" en un Date a medianoche LOCAL, separando el
// texto a mano: nunca se usa new Date("AAAA-MM-DD") (eso va a UTC).
function dateFromLocalString(text) {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Devuelve el lunes de la semana a la que pertenece "date" (fecha local).
// Se usa setDate() sobre una fecha local: correcto aunque el día dure
// 23 o 25 horas (cambio de horario) y sin tocar UTC.
function getMonday(date) {
  const day = date.getDay(); // 0 = domingo ... 6 = sábado
  const offset = (day + 6) % 7; // lunes => 0, domingo => 6
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - offset);
  return monday;
}

// Devuelve una copia de "date" (a medianoche local) retrasada o
// avanzada "days" días. Nunca muta la fecha recibida.
function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

// --- Periodo del mapa ---

// El mapa cubre 12 semanas (spec 001, RF-1).
const HEAT_MAP_WEEKS = 12;

// Periodo del mapa para un "hoy" dado: empieza en el lunes de la
// semana en curso menos 11 semanas y termina en su domingo, de forma
// que la última columna es la semana en curso (RF-1 CA1 y CA2).
function getHeatMapPeriod(hoy) {
  const monday = getMonday(hoy);
  return {
    start: toLocalDateString(addDays(monday, -(HEAT_MAP_WEEKS - 1) * 7)),
    end: toLocalDateString(addDays(monday, 6)),
  };
}

// --- Minutos por día ---

// Total de minutos VÁLIDOS de un día. Los minutos no numéricos,
// infinitos o menores o iguales que 0 se ignoran sin romper la suma
// (RF-2 CA1 y CA3).
function getDayMinutes(sessions, date) {
  let total = 0;
  for (const session of sessions) {
    if (session.date === date) {
      const minutes = Number(session.minutes);
      if (Number.isFinite(minutes) && minutes > 0) {
        total += minutes;
      }
    }
  }
  return total;
}

// --- Tono de la celda ---

// Nivel de color de un día según sus minutos, redondeados al entero
// más cercano (0,5 o más sube): 0 vacía, 1 suave (1-29), 2 medio
// (30-59), 3 intenso (60+). Un día con total 0 queda vacío (RF-3 CA2-CA5,
// RF-2 CA4).
function getTone(total) {
  const rounded = Math.round(total);
  if (rounded < 1) return 0;
  if (rounded <= 29) return 1;
  if (rounded <= 59) return 2;
  return 3;
}

// --- Celdas del mapa ---

// Las 84 celdas del periodo, en orden cronológico: cada 7 celdas
// empieza una semana, de lunes a domingo. Un día futuro queda con tono
// 0 aunque tenga sesiones registradas por error (RF-1 CA2, RF-7 CA3).
// Las celdas se derivan siempre de las sesiones: nada se guarda aparte
// (RF-8).
function getHeatMapCells(sessions, hoy) {
  const period = getHeatMapPeriod(hoy);
  const today = toLocalDateString(hoy);
  const cells = [];

  let cursor = dateFromLocalString(period.start);
  for (let i = 0; i < HEAT_MAP_WEEKS * 7; i++) {
    const date = toLocalDateString(cursor);
    const minutes = getDayMinutes(sessions, date);
    const tone = date > today ? 0 : getTone(minutes);
    cells.push({ date, minutes, tone });
    cursor = addDays(cursor, 1);
  }
  return cells;
}

// Export para los tests de node. En el navegador "module" no existe y
// este bloque se salta: las funciones quedan como globales del script.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    toLocalDateString,
    dateFromLocalString,
    getMonday,
    addDays,
    getHeatMapPeriod,
    getDayMinutes,
    getTone,
    getHeatMapCells,
  };
}
