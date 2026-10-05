# AGENTS.md

## Project

"Diario de Estudio" — dependency-free static site that logs study sessions and shows a streak. Not a git repo: no package manager, no build, no tests. Exactly three files: `index.html` (markup), `styles.css` (styling), `app.js` (all logic).

## Hard constraints (from the project spec — do not violate)

- **Exactly 3 files.** No frameworks, libraries, npm, bundlers or dev servers. Don't add a 4th file (README, package.json, config…) unless asked.
- Must run by double-clicking `index.html` (`file://`); localStorage works there, so no server is ever needed.
- All UI text and code comments in Spanish.
- Ship only what was explicitly requested; no extra features (e.g. no delete/edit) unless asked.

## Verify changes

No lint/test tooling exists. Use:

1. `node --check app.js` — syntax check.
2. `open index.html` — manual check: submit the form, confirm the streak, reload to confirm persistence.

## Dates & streak (the tricky core)

- **Local time only, never UTC.** Dates are stored as local `YYYY-MM-DD` via `toLocalDateString()`. Never parse with `new Date("YYYY-MM-DD")` (that parses as UTC); `formatDate()` splits the string manually for this reason.
- Streak (`calculateStreak`): a day counts if it has ≥1 session; the streak ends today, or yesterday if today has no session yet — it stays alive until the day ends.

## Data (localStorage)

- Key: `diario-estudio-sesiones`. Changing it or the session shape `{ date, topic, minutes, createdAt }` silently discards existing user data.
- `createdAt` exists only to break ties when sorting same-day sessions newest-first.

## Gotchas

- After `form.reset()`, re-set `dateInput.value = todayString()` — reset restores the HTML default, not "today".
- Minutes are integers only (`min="1" step="1"`), validated both by HTML attributes and the JS submit guard; keep both in sync.
