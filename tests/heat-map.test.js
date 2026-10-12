// Pruebas del mapa de calor (spec 001). Se ejecutan con `node --test`.
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  toLocalDateString,
  getMonday,
  getHeatMapPeriod,
  getDayMinutes,
  getTone,
  getHeatMapCells,
} = require("../heat-map.js");

// Ayudante local para construir fechas fijas sin signos invertidos.
function daysAfter(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

// --- T1: ayudantes de fecha locales ---

test("toLocalDateString devuelve el texto local con ceros delante", () => {
  assert.equal(toLocalDateString(new Date(2026, 9, 9)), "2026-10-09");
  assert.equal(toLocalDateString(new Date(2026, 0, 5)), "2026-01-05");
});

test("toLocalDateString usa la fecha local, no la UTC (tras la medianoche)", () => {
  // En husos UTC+ el día UTC aún es el anterior: debe ganar el día LOCAL.
  assert.equal(toLocalDateString(new Date(2026, 9, 12, 0, 30)), "2026-10-12");
});

test("toLocalDateString usa la fecha local, no la UTC (última hora del día)", () => {
  // En husos UTC- el día UTC ya es el siguiente: debe ganar el día LOCAL.
  assert.equal(toLocalDateString(new Date(2026, 9, 12, 23, 30)), "2026-10-12");
});

test("getMonday devuelve el lunes de la propia semana", () => {
  // 12 oct 2026 es lunes; el miércoles 14 y el domingo 18 van a esa semana.
  assert.equal(toLocalDateString(getMonday(new Date(2026, 9, 12))), "2026-10-12");
  assert.equal(toLocalDateString(getMonday(new Date(2026, 9, 14))), "2026-10-12");
  assert.equal(toLocalDateString(getMonday(new Date(2026, 9, 18))), "2026-10-12");
});

test("getMonday cruza meses y años", () => {
  // 3 ene 2027 es domingo: su lunes es 28 dic 2026.
  assert.equal(toLocalDateString(getMonday(new Date(2027, 0, 3))), "2026-12-28");
});

test("getMonday atraviesa un cambio de horario (día de 23 o 25 horas)", () => {
  // 25 oct 2026 es domingo (fin del horario de verano en Europa):
  // el lunes debe seguir siendo 19 oct, pase lo que pase con las horas.
  assert.equal(toLocalDateString(getMonday(new Date(2026, 9, 25))), "2026-10-19");
});

test("getMonday no muta la fecha recibida y devuelve una copia", () => {
  const fecha = new Date(2026, 9, 14, 15, 45);
  const lunes = getMonday(fecha);
  assert.equal(toLocalDateString(fecha), "2026-10-14");
  // Mutar el resultado no puede tocar la fecha original (pureza, §3).
  lunes.setDate(lunes.getDate() + 7);
  assert.equal(toLocalDateString(fecha), "2026-10-14");
});

// --- T2: periodo de 12 semanas ---

test("getHeatMapPeriod devuelve 12 semanas alineadas de lunes a domingo", () => {
  // 14 oct 2026 es miércoles: su semana va del 12 (lunes) al 18 (domingo)
  // y la ventana empieza 11 semanas antes, el 27 jul 2026.
  const period = getHeatMapPeriod(new Date(2026, 9, 14));
  assert.deepEqual(period, { start: "2026-07-27", end: "2026-10-18" });
});

test("getHeatMapPeriod es el mismo con hoy lunes o domingo", () => {
  const lunes = getHeatMapPeriod(new Date(2026, 9, 12));
  const domingo = getHeatMapPeriod(new Date(2026, 9, 18));
  assert.deepEqual(lunes, { start: "2026-07-27", end: "2026-10-18" });
  assert.deepEqual(domingo, { start: "2026-07-27", end: "2026-10-18" });
});

test("getHeatMapPeriod cruza el cambio de año", () => {
  // 4 ene 2027 es lunes: la ventana empieza el 19 oct 2026.
  const period = getHeatMapPeriod(new Date(2027, 0, 4));
  assert.deepEqual(period, { start: "2026-10-19", end: "2027-01-10" });
});

test("getHeatMapPeriod usa el 'hoy' local aunque tenga hora (00:30 y 23:30)", () => {
  const temprano = getHeatMapPeriod(new Date(2026, 9, 14, 0, 30));
  const tardio = getHeatMapPeriod(new Date(2026, 9, 14, 23, 30));
  assert.deepEqual(temprano, { start: "2026-07-27", end: "2026-10-18" });
  assert.deepEqual(tardio, { start: "2026-07-27", end: "2026-10-18" });
});

// --- T3: minutos por día ---

test("getDayMinutes suma varias sesiones del mismo día", () => {
  const sessions = [
    { date: "2026-10-13", minutes: 20 },
    { date: "2026-10-13", minutes: 40 },
    { date: "2026-10-12", minutes: 99 }, // otro día: no cuenta
  ];
  assert.equal(getDayMinutes(sessions, "2026-10-13"), 60);
});

test("getDayMinutes ignora los minutos inválidos y suma el resto", () => {
  const sessions = [
    { date: "2026-10-13", minutes: 30 },
    { date: "2026-10-13", minutes: "abc" },
    { date: "2026-10-13", minutes: Infinity },
    { date: "2026-10-13", minutes: -5 },
    { date: "2026-10-13", minutes: 0 },
  ];
  assert.equal(getDayMinutes(sessions, "2026-10-13"), 30);
});

test("getDayMinutes devuelve 0 si solo hay minutos inválidos (día vacío)", () => {
  const sessions = [
    { date: "2026-10-13", minutes: "x" },
    { date: "2026-10-13", minutes: -10 },
  ];
  assert.equal(getDayMinutes(sessions, "2026-10-13"), 0);
});

// --- T4: tonos ---

test("getTone clasifica los bordes exactos", () => {
  assert.equal(getTone(0), 0);
  assert.equal(getTone(1), 1);
  assert.equal(getTone(29), 1);
  assert.equal(getTone(30), 2);
  assert.equal(getTone(59), 2);
  assert.equal(getTone(60), 3);
  assert.equal(getTone(500), 3);
});

test("getTone redondea los decimales al entero más cercano", () => {
  assert.equal(getTone(0.4), 0); // redondea a 0: celda vacía
  assert.equal(getTone(29.4), 1);
  assert.equal(getTone(29.5), 2); // 0,5 o más sube
  assert.equal(getTone(59.5), 3);
});

// --- T5: celdas del mapa ---

test("getHeatMapCells devuelve 84 celdas: de start a end", () => {
  const cells = getHeatMapCells([], new Date(2026, 9, 14));
  assert.equal(cells.length, 84);
  assert.equal(cells[0].date, "2026-07-27");
  assert.equal(cells[83].date, "2026-10-18");
});

test("las celdas siguen el orden cronológico, de lunes a domingo", () => {
  const start = new Date(2026, 6, 27); // lunes 27 jul 2026
  const cells = getHeatMapCells([], new Date(2026, 9, 14));
  for (let i = 0; i < 84; i++) {
    assert.equal(cells[i].date, toLocalDateString(daysAfter(start, i)));
  }
});

test("una sesión anterior a la ventana no aparece; la del primer lunes, sí", () => {
  const sessions = [
    { date: "2026-07-26", minutes: 45 }, // domingo anterior: fuera
    { date: "2026-07-27", minutes: 15 }, // lunes de inicio: dentro
  ];
  const cells = getHeatMapCells(sessions, new Date(2026, 9, 14));
  assert.equal(
    cells.some((cell) => cell.date === "2026-07-26"),
    false
  );
  assert.deepEqual({ ...cells[0] }, { date: "2026-07-27", minutes: 15, tone: 1 });
});

test("una sesión futura dentro de la ventana no colorea (tono 0)", () => {
  const cells = getHeatMapCells(
    [{ date: "2026-10-15", minutes: 90 }],
    new Date(2026, 9, 14)
  );
  const viernes = cells.find((cell) => cell.date === "2026-10-15");
  assert.equal(viernes.tone, 0);
});

test("con solo sesiones futuras o inválidas todas las celdas quedan en 0", () => {
  const sessions = [
    { date: "2026-10-16", minutes: 60 }, // futura
    { date: "2026-09-01", minutes: "mala" }, // inválida
  ];
  const cells = getHeatMapCells(sessions, new Date(2026, 9, 14));
  assert.equal(
    cells.every((cell) => cell.tone === 0),
    true
  );
});

test("el mapa suma el día completo antes de decidir el tono", () => {
  const sessions = [
    { date: "2026-10-13", minutes: 35 },
    { date: "2026-10-13", minutes: 40 },
  ];
  const cells = getHeatMapCells(sessions, new Date(2026, 9, 14));
  const martes = cells.find((cell) => cell.date === "2026-10-13");
  assert.deepEqual({ ...martes }, { date: "2026-10-13", minutes: 75, tone: 3 });
});

test("getHeatMapCells no muta el 'hoy' recibido (pureza)", () => {
  const hoy = new Date(2026, 9, 14, 12, 34);
  getHeatMapCells([], hoy);
  assert.equal(toLocalDateString(hoy), "2026-10-14");
  assert.equal(hoy.getHours(), 12);
});
