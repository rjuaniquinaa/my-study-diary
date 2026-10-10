// Diario de Estudio - lógica principal
// Los datos se guardan en localStorage y la fecha siempre se calcula
// con la hora local del usuario (nunca con UTC).

const STORAGE_KEY = "diario-estudio-sesiones";

// --- Fechas ---

// Convierte un objeto Date en texto "YYYY-MM-DD" usando la fecha LOCAL.
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayString() {
  return toLocalDateString(new Date());
}

// Convierte "YYYY-MM-DD" en texto legible en español.
// Se divide el texto a mano para no caer en el modo UTC de JavaScript.
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// --- Almacenamiento ---

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// --- Racha ---

// Un día cuenta si tiene al menos una sesión.
// La racha son días consecutivos que terminan hoy o, si hoy aún no hay
// sesión, en ayer (la racha no se rompe hasta que termine el día).
function calculateStreak(sessions) {
  const daysWithSession = new Set(sessions.map((session) => session.date));

  const cursor = new Date();

  if (!daysWithSession.has(toLocalDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!daysWithSession.has(toLocalDateString(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (daysWithSession.has(toLocalDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Devuelve true si "b" es el día siguiente exacto a "a".
// Se avanza el día con setDate() sobre una fecha local: así el cálculo
// es correcto aunque el día tenga 23 o 25 horas (cambio de horario).
function isNextDay(a, b) {
  const [aYear, aMonth, aDay] = a.split("-").map(Number);
  const next = new Date(aYear, aMonth - 1, aDay);
  next.setDate(next.getDate() + 1);
  return toLocalDateString(next) === b;
}

// La mejor racha es la tanda más larga de días consecutivos con sesión
// en todo el historial. Se calcula siempre a partir de los datos
// guardados (nada se guarda aparte) y las fechas futuras no cuentan,
// igual que en la racha actual.
function calculateBestStreak(sessions) {
  const today = todayString();

  const days = [...new Set(sessions.map((session) => session.date))]
    .filter((date) => date <= today)
    .sort();

  let best = 0;
  let current = 0;
  let previous = null;

  for (const day of days) {
    current = previous !== null && isNextDay(previous, day) ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day;
  }

  return best;
}

// --- Minutos de la semana ---

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

// Total de minutos estudiados de lunes a hoy. Las fechas futuras no
// cuentan, igual que en las rachas.
function calculateWeeklyMinutes(sessions) {
  const monday = toLocalDateString(getMonday(new Date()));
  const today = todayString();

  let total = 0;
  for (const session of sessions) {
    if (session.date >= monday && session.date <= today) {
      const minutes = Number(session.minutes);
      if (Number.isFinite(minutes) && minutes > 0) {
        total += minutes;
      }
    }
  }
  return total;
}

// --- Referencias del DOM ---

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const streakNumber = document.getElementById("streak-number");
const streakLabel = document.getElementById("streak-label");
const streakBest = document.getElementById("streak-best");
const streakBestNumber = document.getElementById("streak-best-number");
const streakBestLabel = document.getElementById("streak-best-label");
const weekMinutes = document.getElementById("week-minutes");
const weekUnit = document.getElementById("week-unit");
const list = document.getElementById("session-list");
const emptyMessage = document.getElementById("empty-message");

// --- Pintado ---

function render() {
  const sessions = loadSessions();

  // Racha
  const streak = calculateStreak(sessions);
  streakNumber.textContent = streak;
  streakLabel.textContent = streak === 1 ? "día" : "días";

  // Mejor racha: se oculta si todavía no hay sesiones
  const best = calculateBestStreak(sessions);
  streakBest.hidden = best === 0;
  streakBestNumber.textContent = best;
  streakBestLabel.textContent = best === 1 ? "día" : "días";

  // Minutos de la semana (lunes a hoy)
  const weeklyMinutes = calculateWeeklyMinutes(sessions);
  weekMinutes.textContent = weeklyMinutes;
  weekUnit.textContent = weeklyMinutes === 1 ? "min estudiado" : "min estudiados";

  // Lista: de la sesión más reciente a la más antigua
  const sorted = [...sessions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });

  list.innerHTML = "";
  emptyMessage.hidden = sorted.length > 0;

  for (const session of sorted) {
    const item = document.createElement("li");
    item.className = "session-item";

    const info = document.createElement("div");
    info.className = "session-info";

    const topic = document.createElement("div");
    topic.className = "session-topic";
    topic.textContent = session.topic;

    const date = document.createElement("div");
    date.className = "session-date";
    date.textContent = formatDate(session.date);

    info.appendChild(topic);
    info.appendChild(date);

    const minutes = document.createElement("span");
    minutes.className = "session-minutes";
    minutes.textContent = `${session.minutes} min`;

    item.appendChild(info);
    item.appendChild(minutes);
    list.appendChild(item);
  }
}

// --- Eventos ---

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const date = dateInput.value;
  const topic = topicInput.value.trim();
  const minutes = Number(minutesInput.value);

  if (!date || !topic || !Number.isFinite(minutes) || minutes <= 0) {
    return;
  }

  const sessions = loadSessions();
  sessions.push({
    date,
    topic,
    minutes,
    createdAt: Date.now(),
  });
  saveSessions(sessions);

  form.reset();
  dateInput.value = todayString();
  render();
});

// --- Arranque ---

dateInput.value = todayString();
render();
