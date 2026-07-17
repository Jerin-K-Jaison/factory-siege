// FACTORY SIEGE - backend
// Handles team registration, server-side answer validation (answers never sent to client),
// leaderboard, and a shared plant-wide countdown timer.

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// ---- Config ----
const DURATION_MINUTES = 60; // plant meltdown countdown length
const TOTAL_LEVELS = 6;

// Correct answers live ONLY on the server. Normalized: uppercase, no spaces.
const ANSWERS = {
  1: ["SULPHURICACID", "SULFURICACID"],
  2: ["QUENCH"],
  3: ["TURBULENT"],
  4: ["SODIUMHYDROXIDE", "NAOH"],
  5: ["010001110101001001001111010101010100111001000100"], // binary ASCII for GROUND
  6: ["TRUTH"], // final shutdown code
};

// Clean, human-readable versions shown back to the team (e.g. in the recovered-keys sidebar)
const DISPLAY_ANSWERS = {
  1: "Sulphuric Acid",
  2: "Quench",
  3: "Turbulent",
  4: "Sodium Hydroxide",
  5: "Ground",
  6: "Truth",
};

function normalize(s) {
  return String(s || "").toUpperCase().replace(/[\s_-]/g, "");
}

// ---- Persistence (simple JSON file store) ----
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { startTime: Date.now(), teams: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let db = loadData();

// ---- Middleware ----
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ---- Routes ----

// Register a new team (or return existing id if name already used)
app.post("/api/register", (req, res) => {
  const { teamName } = req.body;
  if (!teamName || !teamName.trim()) {
    return res.status(400).json({ error: "Team name required." });
  }
  const cleanName = teamName.trim().slice(0, 40);

  // reuse existing team if same name already registered (case-insensitive)
  const existing = Object.values(db.teams).find(
    (t) => t.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existing) {
    return res.json({ teamId: existing.id, name: existing.name, level: existing.level });
  }

  const id = crypto.randomBytes(6).toString("hex");
  db.teams[id] = {
    id,
    name: cleanName,
    level: 1,
    solved: [],
    answers: {},
    registeredAt: Date.now(),
    lastSolvedAt: null,
    finishedAt: null,
  };
  saveData(db);
  res.json({ teamId: id, name: cleanName, level: 1 });
});

// Get current team state
app.get("/api/team/:id", (req, res) => {
  const team = db.teams[req.params.id];
  if (!team) return res.status(404).json({ error: "Team not found." });
  res.json(team);
});

// Submit an answer for a level
app.post("/api/submit", (req, res) => {
  const { teamId, level, answer } = req.body;
  const team = db.teams[teamId];
  if (!team) return res.status(404).json({ error: "Team not found." });

  const lvl = Number(level);
  if (lvl !== team.level) {
    return res.status(400).json({ error: "This is not your current active level." });
  }

  const correctList = (ANSWERS[lvl] || []).map(normalize);
  const isCorrect = correctList.includes(normalize(answer));

  if (isCorrect) {
    team.solved.push({ level: lvl, at: Date.now() });
    team.answers[lvl] = DISPLAY_ANSWERS[lvl] || answer;
    team.lastSolvedAt = Date.now();
    team.level = lvl + 1;
    if (lvl === TOTAL_LEVELS) {
      team.finishedAt = Date.now();
    }
    saveData(db);
    return res.json({
      correct: true,
      nextLevel: team.level,
      finished: lvl === TOTAL_LEVELS,
      displayAnswer: team.answers[lvl],
    });
  }

  res.json({ correct: false });
});

// Leaderboard: sorted by level desc, then last solved time asc (earlier = better)
app.get("/api/leaderboard", (req, res) => {
  const rows = Object.values(db.teams)
    .map((t) => ({
      name: t.name,
      level: t.level,
      finished: !!t.finishedAt,
      finishedAt: t.finishedAt,
      lastSolvedAt: t.lastSolvedAt,
    }))
    .sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      const aTime = a.lastSolvedAt || Infinity;
      const bTime = b.lastSolvedAt || Infinity;
      return aTime - bTime;
    });
  res.json(rows);
});

// Shared plant-wide countdown
app.get("/api/timer", (req, res) => {
  const durationMs = DURATION_MINUTES * 60 * 1000;
  const endTime = db.startTime + durationMs;
  res.json({ startTime: db.startTime, endTime, durationMs, now: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Factory Siege server running on http://localhost:${PORT}`);
  console.log(`Meltdown countdown: ${DURATION_MINUTES} minutes from server start.`);
});
