// FACTORY SIEGE - frontend logic
// Correct answers are NEVER stored here — every submission is validated by the server.

const screens = {
  intro: document.getElementById("screen-intro"),
  level: document.getElementById("screen-level"),
  win: document.getElementById("screen-win"),
};

let teamId = localStorage.getItem("fs_teamId");
let teamName = localStorage.getItem("fs_teamName");
let currentLevel = 1;
let pyodideInstance = null;
let meltdownShown = false;
let clockOffset = 0; // serverNow - Date.now()
let endTime = null;

const TOTAL_LEVELS = 5;

// ---------------- LEVEL CONTENT (puzzle text only — no answers) ----------------
const LEVELS = {
  1: {
    tag: "SUBSYSTEM 1 / 5 — ACID FEED VALVE",
    title: "Sensor Override Lockout",
    render: () => `
      <p>The intruder has frozen the acid feed sensor and left an override code
      broadcasting on the diagnostic line, encoded in raw binary.</p>
      <div class="mono-block">01001000 00110010 01010011 01001111 00110100</div>
      <p class="hint">Hint: each 8-bit group is one ASCII character. Decode the full sequence.</p>
    `,
  },
  2: {
    tag: "SUBSYSTEM 2 / 5 — MASS BALANCE CONTROLLER",
    title: "Process Corruption",
    render: () => `
      <p>The evaporator's control script has been corrupted — three bugs are stopping it
      from reporting the correct diagnostic key. Fix the code, run it, then decode the
      binary output it prints.</p>
      <div id="py-console">
        <textarea id="py-editor" spellcheck="false">feed = 500          # kg of feed solution
feed_conc = 10      # % NaOH in feed
final_conc = 50     # % NaOH required in product

naoh = feed * (feed_conc / 100)   # mass of pure NaOH
product = naoh * final_conc       # BUG 1: wrong operation here
evaporated = product - feed       # BUG 2: operands look reversed

if naoh == 400:                   # BUG 3: is this the right variable to check?
    print("01000101 01010110 01000001 01010000")  # binary — decode this to find the key
</textarea>
        <button id="py-run-btn">▶ RUN SCRIPT</button>
        <div id="py-output">Python interpreter loading...</div>
      </div>
      <p class="hint">Hint: fix the formula, fix the operand order, fix the condition. The
      printed binary decodes to the answer.</p>
    `,
    needsPython: true,
  },
  3: {
    tag: "SUBSYSTEM 3 / 5 — NETWORK GATEWAY",
    title: "Firewall Breach",
    render: () => `
      <p>An intercepted command was found in the gateway logs, encrypted with a classic
      Caesar shift cipher.</p>
      <div class="mono-block">FDWDOBVW</div>
      <p class="hint">Hint: shift = 3. Shift each letter backward through the alphabet.</p>
    `,
  },
  4: {
    tag: "SUBSYSTEM 4 / 5 — CORE RELAY",
    title: "Relay Diagnostic Dump",
    render: () => `
      <p>The core relay controller dumped its last known state as a hex-encoded ASCII
      string before the intruder cut its logging.</p>
      <div class="mono-block">52 45 41 43 54 4F 52</div>
      <p class="hint">Hint: each pair of hex digits is one ASCII byte.</p>
    `,
  },
  5: {
    tag: "SUBSYSTEM 5 / 5 — FINAL SHUTDOWN KEY",
    title: "Master Containment Cipher",
    render: () => `
      <p>The final lock combines everything the team has already recovered. It's a
      Vigenère cipher — the key is the <strong>first letter of each of your previous
      four answers, in order</strong>.</p>
      <div class="mono-block">JSPKHMPDLRV</div>
      <p class="hint">Hint: build the key from your answers to subsystems 1–4, then decrypt.</p>
    `,
  },
};

// ---------------- SCREEN MANAGEMENT ----------------
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function updateTeamBadge() {
  document.getElementById("team-badge").textContent = teamName ? `TEAM: ${teamName.toUpperCase()}` : "";
}

// ---------------- REGISTRATION ----------------
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("team-name-input");
  const errorEl = document.getElementById("register-error");
  errorEl.textContent = "";
  const name = input.value.trim();
  if (!name) return;

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName: name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed.");

    teamId = data.teamId;
    teamName = data.name;
    currentLevel = data.level;
    localStorage.setItem("fs_teamId", teamId);
    localStorage.setItem("fs_teamName", teamName);
    updateTeamBadge();
    enterLevel(currentLevel);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------------- LEVEL FLOW ----------------
function enterLevel(level) {
  if (level > TOTAL_LEVELS) {
    showWin();
    return;
  }
  currentLevel = level;
  const lvl = LEVELS[level];
  document.getElementById("level-tag").textContent = lvl.tag;
  document.getElementById("level-title").textContent = lvl.title;
  document.getElementById("level-body").innerHTML = lvl.render();
  document.getElementById("level-icon").innerHTML = ICONS["level" + level] || "";
  document.getElementById("answer-input").value = "";
  document.getElementById("submit-feedback").textContent = "";
  document.getElementById("submit-feedback").className = "feedback-msg";
  document.querySelector("#screen-level .panel").classList.remove("shake", "flash-correct");
  showScreen("level");

  if (lvl.needsPython) {
    setupPythonConsole();
  }
}

function showWin() {
  document.getElementById("win-summary").textContent =
    `${teamName} restored all 5 subsystems before meltdown. Plant integrity: SECURED.`;
  document.getElementById("icon-win").innerHTML = ICONS.win;
  showScreen("win");
  celebrate();
}

function celebrate() {
  if (window.FactoryParticles) {
    window.FactoryParticles.setMode("success");
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    window.FactoryParticles.burst(cx, cy, 140);
    setTimeout(() => window.FactoryParticles.burst(cx * 0.4, cy * 0.6, 80), 300);
    setTimeout(() => window.FactoryParticles.burst(cx * 1.6, cy * 0.6, 80), 550);
    setTimeout(() => window.FactoryParticles.burst(cx, cy, 100), 900);
  }
  const flash = document.getElementById("win-flash");
  flash.classList.remove("fire");
  void flash.offsetWidth; // restart animation
  flash.classList.add("fire");
  document.getElementById("plant-status").textContent = "SECURED";
  document.getElementById("plant-status").style.color = "var(--green)";
}

async function submitAnswer() {
  const answer = document.getElementById("answer-input").value.trim();
  const feedback = document.getElementById("submit-feedback");
  const panel = document.querySelector("#screen-level .panel");
  if (!answer) return;

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, level: currentLevel, answer }),
    });
    const data = await res.json();
    if (data.correct) {
      feedback.textContent = "✔ CODE ACCEPTED — SUBSYSTEM RESTORED";
      feedback.className = "feedback-msg correct";
      panel.classList.remove("shake");
      panel.classList.add("flash-correct");
      if (window.FactoryParticles) {
        const rect = panel.getBoundingClientRect();
        window.FactoryParticles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);
      }
      setTimeout(() => enterLevel(data.nextLevel), 900);
    } else {
      feedback.textContent = "✘ CODE REJECTED — TRY AGAIN";
      feedback.className = "feedback-msg wrong";
      panel.classList.remove("flash-correct");
      panel.classList.remove("shake");
      void panel.offsetWidth;
      panel.classList.add("shake");
    }
  } catch (err) {
    feedback.textContent = "Connection error — try again.";
    feedback.className = "feedback-msg wrong";
  }
}

document.getElementById("submit-btn").addEventListener("click", submitAnswer);
document.getElementById("answer-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitAnswer();
});

// ---------------- PYTHON CONSOLE (Level 2) ----------------
let pyodideLoadPromise = null;

function ensurePyodide() {
  if (pyodideInstance) return Promise.resolve(pyodideInstance);
  if (!pyodideLoadPromise) {
    pyodideLoadPromise = loadPyodide().then((py) => {
      pyodideInstance = py;
      return py;
    });
  }
  return pyodideLoadPromise;
}

function setupPythonConsole() {
  const outputEl = document.getElementById("py-output");
  const runBtn = document.getElementById("py-run-btn");

  if (pyodideInstance) {
    outputEl.textContent = "Python interpreter ready. Fix the bugs and run.";
  } else {
    outputEl.textContent = "Warming up interpreter (usually just a moment — it starts loading as soon as you begin)...";
    runBtn.disabled = true;
    ensurePyodide().then(() => {
      outputEl.textContent = "Python interpreter ready. Fix the bugs and run.";
      runBtn.disabled = false;
    });
  }

  runBtn.onclick = async () => {
    outputEl.textContent = "Running...";
    const code = document.getElementById("py-editor").value;
    try {
      const py = await ensurePyodide();
      let captured = "";
      py.setStdout({ batched: (s) => (captured += s + "\n") });
      py.setStderr({ batched: (s) => (captured += s + "\n") });
      await py.runPythonAsync(code);
      outputEl.textContent = captured.trim() || "(script ran with no output)";
    } catch (err) {
      outputEl.textContent = "Error:\n" + err.message;
    }
  };
}

// ---------------- TIMER ----------------
async function initTimer() {
  try {
    const res = await fetch("/api/timer");
    const data = await res.json();
    clockOffset = data.now - Date.now();
    endTime = data.endTime;
  } catch (e) {
    console.error("timer fetch failed", e);
  }
}

function tickTimer() {
  if (!endTime) return;
  const now = Date.now() + clockOffset;
  const remaining = endTime - now;
  const timerEl = document.getElementById("timer");

  function  if (remaining <= 0) {
      timerEl.textContent = "00:00";
      timerEl.classList.add("critical");
      if (!meltdownShown) {
        meltdownShown = true;
        document.getElementById("meltdown-overlay").classList.add("show");
      }
      return;
    }

  const totalSec = Math.floor(remaining / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  timerEl.textContent = `${mm}:${ss}`;
  if (totalSec < 300) timerEl.classList.add("critical");
}

document.getElementById("meltdown-dismiss").addEventListener("click", () => {
  document.getElementById("meltdown-overlay").classList.remove("show");
});

setInterval(tickTimer, 1000);

// ---------------- LEADERBOARD ----------------
const leaderboardPanel = document.getElementById("leaderboard-panel");
document.getElementById("leaderboard-toggle").addEventListener("click", () => {
  leaderboardPanel.classList.toggle("open");
  if (leaderboardPanel.classList.contains("open")) refreshLeaderboard();
});
document.getElementById("leaderboard-close").addEventListener("click", () => {
  leaderboardPanel.classList.remove("open");
});

async function refreshLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard");
    const rows = await res.json();
    const tbody = document.querySelector("#leaderboard-table tbody");
    tbody.innerHTML = rows
      .map((r, i) => {
        const status = r.finished ? "SECURED" : `${Math.min(r.level, TOTAL_LEVELS)} / ${TOTAL_LEVELS}`;
        return `<tr><td>${i + 1}</td><td>${escapeHtml(r.name)}</td><td>${status}</td></tr>`;
      })
      .join("");
  } catch (e) {
    console.error("leaderboard fetch failed", e);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

setInterval(() => {
  if (leaderboardPanel.classList.contains("open")) refreshLeaderboard();
}, 5000);

// ---------------- INIT ----------------
async function init() {
  document.getElementById("icon-intro").innerHTML = ICONS.intro;
  document.getElementById("hero-intro").innerHTML = ICONS.heroSiege;
  document.getElementById("hero-win").innerHTML = ICONS.heroRestored;
  await initTimer();
  tickTimer();
  updateTeamBadge();
  ensurePyodide(); // start warming up the interpreter in the background right away

  if (teamId) {
    try {
      const res = await fetch(`/api/team/${teamId}`);
      if (res.ok) {
        const team = await res.json();
        currentLevel = team.level;
        enterLevel(currentLevel);
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }
  showScreen("intro");
}

init();
