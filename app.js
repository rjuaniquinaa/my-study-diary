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

// --- Referencias del DOM ---

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const streakNumber = document.getElementById("streak-number");
const streakLabel = document.getElementById("streak-label");
const list = document.getElementById("session-list");
const emptyMessage = document.getElementById("empty-message");

// --- Pintado ---

function render() {
  const sessions = loadSessions();

  // Racha
  const streak = calculateStreak(sessions);
  streakNumber.textContent = streak;
  streakLabel.textContent = streak === 1 ? "día seguido" : "días seguidos";

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
