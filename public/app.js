// BREAKING CODE - frontend logic
// Correct answers are NEVER stored here — every submission is validated by the server.

const screens = {
    intro: document.getElementById("screen-intro"),
    level: document.getElementById("screen-level"),
    cutscene: document.getElementById("screen-cutscene"),
    delete: document.getElementById("screen-delete"),
    win: document.getElementById("screen-win"),
};

let teamId = localStorage.getItem("fs_teamId");
let teamName = localStorage.getItem("fs_teamName");
let currentLevel = 1;
let teamAnswers = {};
let pyodideInstance = null;
let meltdownShown = false;
let clockOffset = 0; // serverNow - Date.now()
let endTime = null;
let cutsceneIndex = 0;

const TOTAL_LEVELS = 7;

const ASHCODE_TAUNTS = [
  "Haha... you actually think you can stop me?",
  "Look at your precious countdown. It won't save Sector-7. Nothing will.",
];

const ASHCODE_DEFEAT_LINES = [
  "Noo... this can't be.",
  "I will return. Your days are counted.",
];

// ---------------- LEVEL CONTENT (puzzle text only — no answers) ----------------
const LEVELS = {
  1: {
    tag: "SUBSYSTEM 1 / 7 — ACID FEED VALVE",
    title: "Sensor Override Lockout",
    render: () => `
      <p>ASHCODE has frozen the acid feed sensor and left a taunting override code
      broadcasting on the diagnostic line, encoded in raw binary. [ASCII A=65, 0=48]</p>
      <div class="mono-block">01001000 00110010 01010011 01001111 00110100</div>
      <p class="hint">Got the compound? but what is this?</p>
    `,
  },
  2: {
    tag: "SUBSYSTEM 2 / 7 — QUENCH DOSING CONTROLLER",
    title: "Process Corruption",
    render: () => `
      <p>The hot acid stream from Subsystem 1 needs a caustic quench to cool and neutralize
      it — but ASHCODE corrupted the dosing script. Three bugs are stopping it from
      confirming the correct dose. Fix the code, run it, then decode the binary output
      it prints.</p>
      <div id="py-console">
        <textarea id="py-editor" spellcheck="false">feed = 500          # kg/hr of hot acid stream needing quench
feed_conc = 10      # % contamination marker
final_conc = 50     # % target after dosing

naoh = feed * (feed_conc / 100)   # mass of NaOH quench reagent required
product = naoh * final_conc       # BUG 1
quench_dose = product - feed      # BUG 2

if naoh == 400:                   # BUG 3 
    print("01010001 01010101 01000101 01001110 01000011 01001000")  # the interpreter should print this
</textarea>
        <button id="py-run-btn">▶ RUN SCRIPT</button>
        <div id="py-output">Python interpreter loading...</div>
      </div>
      <p class="hint">The printed binary decodes to the answer.</p>
    `,
    needsPython: true,
  },
  3: {
    tag: "SUBSYSTEM 3 / 7 — COOLANT FLOW LINE",
    title: "Flow Regime Diagnostic",
    render: () => `
      <p>The coolant line's flow-classifier script got shredded and scattered by the intrusion.
      Put the lines back in the correct order to determine the flow regime.</p>
      <ol id="reorder-list" class="reorder-list"></ol>
      <button id="run-arrangement-btn">▶ RUN ARRANGEMENT</button>
      <div id="arrangement-output">Arrange the blocks, then run.</div>
      <p class="hint">Variables come before use.</p>

      <div id="bonus-section" class="hidden">
        <div class="bonus-divider">BONUS — FLOW REGIME CHECK</div>
        <p>Same formula, new coolant line: <strong>ρ = 1000 kg/m³, V = 0.1 m/s, D = 0.08 m,
        μ = 0.001 Pa·s.</strong> Submit the flow regime.</p>
      </div>
    `,
    needsArrangement: true,
  },
  4: {
    tag: "SUBSYSTEM 4 / 7 — NEUTRALIZATION RELAY",
    title: "Compound Synthesis Lockout",
    render: () => `
      <p>The acid surge from Subsystem 1 is still eating through the containment tank.
      The neutralization relay can dose a countermeasure automatically — but ASHCODE has
      scrambled its element registry. Loose readings are drifting in the tank below.</p>
      <div id="floating-elements" class="floating-elements-tank"></div>
      <p><strong>Drag</strong> the three elements that bond together into the reaction
      chamber to synthesize the neutralizing agent.</p>
      <div id="reaction-chamber" class="reaction-chamber">
        <div class="reaction-slot" data-slot="0"></div>
        <div class="reaction-slot" data-slot="1"></div>
        <div class="reaction-slot" data-slot="2"></div>
      </div>
      <div class="reaction-row">
        <p id="reaction-status" class="reaction-status">Chamber empty. Drag elements in.</p>
        <button id="reaction-reset-btn" type="button">RESET CHAMBER</button>
      </div>
      <p class="hint">Reactive metal, life-giving gas, lightest element in the universe.</p>
    `,
    needsElements: true,
  },
  5: {
    tag: "SUBSYSTEM 5 / 7 — SAFETY INTERLOCK RELAY",
    title: "Logic Gate Lockout",
    render: () => `
      <p>The relay's inputs come from thermocouple comparisons across the plant — work out
      each bit yourself from boiling points. Same gate arrangement, both tests, must both
      output 1. The palette has more gates than slots — not all of them belong. No OR gates exist.</p>

      <div class="circuit-diagram">
        <div class="circuit-test-label">TEST 1</div>
        <div class="circuit-stage">
          <div class="circuit-inputs">A: Chloroform &gt; Water ?<br>B: Hexane &gt; Benzene ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="0" data-label="GATE 1"></div>
          <div class="circuit-arrow">→ X</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">C: H₂SO₄ &gt; Glycerol ?<br>D: Ammonia &gt; Methanol ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="1" data-label="GATE 2"></div>
          <div class="circuit-arrow">→ Y</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">X , Y</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="2" data-label="GATE 3"></div>
          <div class="circuit-arrow">→ Z</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">Z , E: Formic Acid &gt; Water ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="3" data-label="GATE 4"></div>
          <div class="circuit-arrow">→ W</div>
        </div>
        <div class="circuit-stage circuit-final">
          <div class="circuit-inputs">W , F: Toluene &gt; Ethanol ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="4" data-label="GATE 5"></div>
          <div class="circuit-arrow">→ OUT</div>
          <div id="circuit-output-0" class="circuit-output">?</div>
        </div>

        <div class="circuit-test-label" style="margin-top:14px;">TEST 2 — same gates, different comparisons</div>
        <div class="circuit-stage">
          <div class="circuit-inputs">A: Glycerol &gt; Benzene ?<br>B: H₂SO₄ &gt; Toluene ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="0">GATE 1</div>
          <div class="circuit-arrow">→ X</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">C: Methanol &gt; Formic Acid ?<br>D: Ammonia &gt; Water ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="1">GATE 2</div>
          <div class="circuit-arrow">→ Y</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">X , Y</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="2">GATE 3</div>
          <div class="circuit-arrow">→ Z</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">Z , E: Water &gt; Chloroform ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="3">GATE 4</div>
          <div class="circuit-arrow">→ W</div>
        </div>
        <div class="circuit-stage circuit-final">
          <div class="circuit-inputs">W , F: Chloroform &gt; Toluene ?</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="4">GATE 5</div>
          <div class="circuit-arrow">→ OUT</div>
          <div id="circuit-output-1" class="circuit-output">?</div>
        </div>
      </div>

      <div id="gate-palette" class="gate-palette"></div>

      <div class="reaction-row">
        <p id="circuit-status" class="reaction-status neutral">Place all 5 gates, then evaluate.</p>
        <button id="circuit-evaluate-btn" type="button">EVALUATE CIRCUIT</button>
        <button id="circuit-reset-btn" type="button">RESET</button>
      </div>

      <div id="circuit-reveal" class="hidden">
        <div class="bonus-divider">RELAY RE-ARMED</div>
        <p>The relay confirms with one word before going quiet:</p>
        <div class="mono-block circuit-reveal-word">GROUND</div>
        <p class="hint">Reverse it — submit its 8-bit binary ASCII form.</p>
      </div>
    `,
    needsGates: true,
  },
  6: {
    tag: "SUBSYSTEM 6 / 7 — CORE INSULATION MONITOR",
    title: "Leak Detection Protocol",
    render: () => `
      <p>ASHCODE corrupted the reactor diagnostics. He started controlling the reactors on by one. The plant has 50 reactors. Under normal operation, 
      every reactor should have a temperature of 80°C, a pressure of 5 bar, and a flow rate of 120 kg/h. One reactor is malfunctioning and is in the control of ASHCODE.
      Identify its Reactor ID</p>
      <div id="py-console">
        <textarea id="py-editor" spellcheck="false">
ID   Temperature(°C)   Pressure(bar)   Flow Rate(kg/h)
1    80                5               120
2    80                5               120
3    80                5               120
4    80                5               120
5    80                5               120
6    80                5               120
7    80                5               120
8    80                5               120
9    80                5               120
10   80                5               120
11   80                5               120
12   80                5               120
13   80                5               120
14   80                5               120
15   80                5               120
16   80                5               120
17   80                5               120
18   80                5               120
19   80                5               120
20   80                5               120
21   80                5               120
22   80                5               120
23   80                5               120
24   80                5               120
25   80                5               120
26   80                5               120
27   80                5               120
28   80                5               120
29   80                5               120
30   80                5               120
31   80                5               120
32   80                5               120
33   80                5               120
34   80                5               120
35   80                5               120
36   80                5               120
37   80                5               120
38   80                5               120
39   80                5               120
40   80                5               120
41   80                5               120
42   80                5               120
43   80                5               120
44   80                5               120
45   80                5               120
46   80                5               120
47   80                5               120
48   80                5               102
49   80                5               120
50   80                5               120
</textarea>
        
        <div id="">look closely..its hidden in plain sight.</div>
      </div>
      <div id="cooldown-banner" class="hidden"></div>
      <p class="pss..look here">Divide the ID by 3. Then add by 3. The result points to an element in the periodic table —
      submit its name. One wrong submission locks this subsystem for 3 minutes.</p>
    `,
    needsPython: false,
    hasCooldown: true,
  },
  7: {
    tag: "SUBSYSTEM 7 / 7 — FINAL SHUTDOWN KEY",
    title: "Master Decode",
    render: () => `
      <p>The final lock uses your six recovered answers — but this time, any letter from
      each word works, not just the first. Pick the letter from each answer, shift it
      forward by one position in the alphabet (A→B, B→C...), and arrange the six results in
      order.</p>
      <p class="hint">Something ASHCODE never wanted you to have.</p>
    `,
  },
};

// Elements shown floating in the Level 4 tank — 3 correct (form the target compound) + distractors
const ELEMENT_POOL = ["Na", "O", "H", "Cl", "Fe", "Ca", "C", "S"];

// Gate types available in the Level 5 palette, and their truth-table functions
const GATE_FUNCTIONS = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  XOR: (a, b) => a ^ b,
  NAND: (a, b) => 1 - (a & b),
  NOR: (a, b) => 1 - (a | b),
  XNOR: (a, b) => 1 - (a ^ b),
};
const GATE_TYPES = Object.keys(GATE_FUNCTIONS);
// Deliberately confusing: 8 gate tokens supplied for only 5 slots (surplus decoys included),
// and never an exact match to what's needed. No OR gates at all — that was the trivial escape
// hatch before. An XNOR decoy type is included too, even though it's never part of any solution.
const GATE_SUPPLY_TEMPLATE = { AND: 5, NAND: 2, XNOR: 1 };
const CIRCUIT_TEST_CASES = [
  { A: 0, B: 0, C: 1, D: 0, E: 1, F: 1 },
  { A: 1, B: 1, C: 0, D: 0, E: 1, F: 0 },
];

// Code blocks for the Level 3 arrangement puzzle. Shuffled on purpose —
// correct order is: variable definitions (any order among D,E,F,G) -> B -> C -> A
const FLOW_BLOCKS = [
  { id: "C", code: "if Re < 2300:" },
  { id: "F", code: "mu = 0.001" },
  { id: "A", code: 'print("Laminar")' },
  { id: "D", code: "rho = 1000" },
  { id: "B", code: "Re = rho*V*D/mu" },
  { id: "G", code: "D = 0.05" },
  { id: "E", code: "V = 0.04" },
];

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
  if (lvl.needsArrangement) {
    setupArrangementPuzzle();
  }
  if (lvl.needsElements) {
    setupFloatingElements();
  }
  if (lvl.needsGates) {
    setupGatePuzzle();
  }
  if (lvl.hasCooldown) {
    checkExistingCooldown(level);
  }
  renderAnswersSidebar(level);
}

// ---------------- ASHCODE CUTSCENES (mid-game taunt + pre-win defeat) ----------------
let cutsceneLines = [];
let cutsceneOnFinish = null;
let cutsceneShowTimerOn = -1; // dialogue index (0-based) that shows the giant timer, -1 = never

function showCutscene(lines, onFinish, timerOnIndex = -1) {
  cutsceneLines = lines;
  cutsceneOnFinish = onFinish;
  cutsceneShowTimerOn = timerOnIndex;
  cutsceneIndex = 0;
  if (window.stopAshcodeEyes) window.stopAshcodeEyes();
  showScreen("cutscene");
  if (window.FactoryParticles) window.FactoryParticles.startRain();
  renderCutsceneLine();

  document.getElementById("cutscene-next-btn").onclick = () => {
    if (cutsceneIndex < cutsceneLines.length - 1) {
      cutsceneIndex += 1;
      renderCutsceneLine();
    } else {
      finishCutscene();
    }
  };
}

function renderCutsceneLine() {
  document.getElementById("cutscene-text").textContent = cutsceneLines[cutsceneIndex];
  document.getElementById("cutscene-timer-bg").classList.toggle("hidden", cutsceneIndex !== cutsceneShowTimerOn);
  document.getElementById("cutscene-next-btn").textContent =
    cutsceneIndex < cutsceneLines.length - 1 ? "NEXT ▸" : "CONTINUE ▸";
}

function finishCutscene() {
  if (window.FactoryParticles) window.FactoryParticles.stopRain();
  if (cutsceneOnFinish) cutsceneOnFinish();
  if (!document.getElementById("screen-win").classList.contains("active")) {
    if (window.startAshcodeEyes) window.startAshcodeEyes();
  }
}
async function playDeleteAnimation(){

    showScreen("delete");

    const out=document.getElementById("delete-output");
    const bar=document.getElementById("delete-bar");

    const lines=[
        "> TARGET : ASHCODE",
        "",
        "> TERMINATING PROCESS........OK",
        "> DELETING CORE FILES........OK",
        "> PURGING MEMORY.............OK",
        "> REMOVING ROOT ACCESS.......OK",
        "> VERIFYING SYSTEM...........OK",
        "",
        "> THREAT LEVEL...............ZERO",
        "",
        "ASHCODE DELETED"
    ];

    out.innerHTML="";

    for(const line of lines){

        out.innerHTML+=line+"<br>";

        if(line.includes("OK"))
            bar.style.width=(parseInt(bar.style.width)||0)+20+"%";

        await new Promise(r=>setTimeout(r,700));
    }

    await new Promise(r=>setTimeout(r,1500));

    showWin();
}

// ---------------- COOLDOWN (Level 6 anti-spam) ----------------
let cooldownIntervalId = null;

async function checkExistingCooldown(level) {
  try {
    const res = await fetch(`/api/team/${teamId}`);
    if (!res.ok) return;
    const team = await res.json();
    const until = team.cooldowns && team.cooldowns[level];
    if (until && until > Date.now() + clockOffset) {
      startCooldownUI(until);
    }
  } catch (e) {
    console.error("cooldown check failed", e);
  }
}

function startCooldownUI(untilTimestamp) {
  const banner = document.getElementById("cooldown-banner");
  const submitBtn = document.getElementById("submit-btn");
  const answerInput = document.getElementById("answer-input");
  if (!banner) return;

  banner.classList.remove("hidden");
  if (submitBtn) submitBtn.disabled = true;
  if (answerInput) answerInput.disabled = true;

  if (cooldownIntervalId) clearInterval(cooldownIntervalId);

  function tick() {
    const remaining = untilTimestamp - (Date.now() + clockOffset);
    if (remaining <= 0) {
      clearInterval(cooldownIntervalId);
      cooldownIntervalId = null;
      banner.classList.add("hidden");
      if (submitBtn) submitBtn.disabled = false;
      if (answerInput) answerInput.disabled = false;
      return;
    }
    const totalSec = Math.ceil(remaining / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    banner.textContent = `⏳ SUBSYSTEM LOCKED — try again in ${mm}:${ss}`;
  }
  tick();
  cooldownIntervalId = setInterval(tick, 1000);
}

function showWin() {
  document.getElementById("win-summary").textContent =
    `${teamName} restored all 7 subsystems and locked ASHCODE out of Sector-7. Plant integrity: SECURED.`;
  document.getElementById("icon-win").innerHTML = ICONS.win;
  if (window.stopAshcodeEyes) window.stopAshcodeEyes();
  showScreen("win");
  const ticker = document.querySelector(".bg-ticker-track");

  if (ticker) {
    ticker.innerHTML = `
      <span style="color:#00ff88;">MISSION SUCCESS</span>
      <span class="dim">·</span>
      <span>PLANT SECURED</span>
      <span class="dim">·</span>
      <span>ALL 7 SUBSYSTEMS RESTORED</span>
      <span class="dim">·</span>
      <span>ASHCODE ELIMINATED</span>
      <span class="dim">·</span>
      <span style="color:#00ff88;">MISSION SUCCESS</span>
      <span class="dim">·</span>
      <span>PLANT SECURED</span>
      <span class="dim">·</span>
      <span>ALL 7 SUBSYSTEMS RESTORED</span>
      <span class="dim">·</span>
      <span>ASHCODE ELIMINATED</span>
      <span class="dim">·</span>
    `;
  }
  const eyes = document.getElementById("ashcode-eyes");
  if (eyes) {
      eyes.classList.remove("visible");
  }
  
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
      if (data.displayAnswer) teamAnswers[currentLevel] = data.displayAnswer;
      feedback.textContent = "✔ CODE ACCEPTED — SUBSYSTEM RESTORED";
      feedback.className = "feedback-msg correct";
      panel.classList.remove("shake");
      panel.classList.add("flash-correct");
      if (window.FactoryParticles) {
        const rect = panel.getBoundingClientRect();
        window.FactoryParticles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);
      }
      setTimeout(() => {
        if (currentLevel === 3) {
          showCutscene(ASHCODE_TAUNTS, () => enterLevel(data.nextLevel), 1);
        } else if (data.finished) {
          showCutscene(
              ASHCODE_DEFEAT_LINES,
              () => playDeleteAnimation()
          );
        } else {
          enterLevel(data.nextLevel);
        }
      }, 900);
    } else {
      feedback.textContent = "✘ CODE REJECTED — TRY AGAIN";
      feedback.className = "feedback-msg wrong";
      panel.classList.remove("flash-correct");
      panel.classList.remove("shake");
      void panel.offsetWidth;
      panel.classList.add("shake");
      if (data.cooldown && data.cooldownUntil) {
        startCooldownUI(data.cooldownUntil);
      }
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

// ---------------- ANSWERS SIDEBAR (cumulative, shown from level 2 onward) ----------------
function renderAnswersSidebar(currentLvl) {
  const sidebar = document.getElementById("answers-sidebar");
  const solvedLevels = Object.keys(teamAnswers)
    .map(Number)
    .filter((lvl) => lvl < currentLvl)
    .sort((a, b) => a - b);

  if (solvedLevels.length === 0) {
    sidebar.classList.add("hidden");
    return;
  }
  sidebar.classList.remove("hidden");

  const decodeIndex = {
    1: 1, // U in SULPHURIC ACID
    2: 5, // H in QUENCH
    3: 2, // R in TURBULENT
    4: 8, // H in SODIUM HYDROXIDE
    5: 4, // N in GROUND
    6: 8  // M in POTASSIUM
  };

  const list = document.getElementById("answers-sidebar-list");

  list.innerHTML = solvedLevels
    .map((lvl) => {
      const answer = teamAnswers[lvl];
      const idx = decodeIndex[lvl];

      let display = escapeHtml(answer);

      if (idx !== undefined && idx < answer.length) {
        display =
          escapeHtml(answer.substring(0, idx)) +
          `<span class="sidebar-highlight">` +
          escapeHtml(answer[idx]) +
          `</span>` +
          escapeHtml(answer.substring(idx + 1));
      }

      return `
        <li>
          <span class="sidebar-level-num">KEY ${lvl}</span>
          <span class="sidebar-answer-text">${display}</span>
        </li>`;
    })
    .join("");
}

// ---------------- LOGIC GATE PUZZLE (Level 5) ----------------
let gateSlots = [null, null, null, null, null];
let gateSupply = {};

function setupGatePuzzle() {
  gateSlots = [null, null, null, null, null];
  gateSupply = { ...GATE_SUPPLY_TEMPLATE };
  renderGateSlots();
  renderGatePalette();
  document.getElementById("circuit-reveal").classList.add("hidden");
  updateCircuitStatus("Place all 5 gates, then evaluate.", "neutral");
  ["circuit-output-0", "circuit-output-1"].forEach((id) => {
    const el = document.getElementById(id);
    el.textContent = "?";
    el.classList.remove("on");
  });

  document.getElementById("circuit-evaluate-btn").onclick = evaluateCircuit;
  document.getElementById("circuit-reset-btn").onclick = () => setupGatePuzzle();
}

function renderGatePalette() {
  const palette = document.getElementById("gate-palette");
  let html = "";
  for (const [type, count] of Object.entries(gateSupply)) {
    for (let i = 0; i < count; i++) {
      html += `<span class="gate-chip" data-gate="${type}">${type}</span>`;
    }
  }
  palette.innerHTML = html || `<span class="gate-palette-empty">All gates placed.</span>`;
  palette.querySelectorAll(".gate-chip").forEach((chip) => {
    chip.addEventListener("pointerdown", onGateChipPointerDown);
  });
}

function onGateChipPointerDown(e) {
  e.preventDefault();
  const gateType = e.currentTarget.dataset.gate;
  if (!gateSupply[gateType] || gateSupply[gateType] < 1) return;

  const ghost = e.currentTarget.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.position = "fixed";
  ghost.style.pointerEvents = "none";
  ghost.style.left = e.clientX - 26 + "px";
  ghost.style.top = e.clientY - 16 + "px";
  document.body.appendChild(ghost);

  function onMove(ev) {
    ghost.style.left = ev.clientX - 26 + "px";
    ghost.style.top = ev.clientY - 16 + "px";
  }

  function onUp(ev) {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    ghost.remove();

    const slots = document.querySelectorAll(".gate-slot");
    for (const slotEl of slots) {
      const rect = slotEl.getBoundingClientRect();
      if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
        const idx = Number(slotEl.dataset.slot);
        const previous = gateSlots[idx];
        if (previous) {
          gateSupply[previous] = (gateSupply[previous] || 0) + 1; // return the evicted gate
        }
        gateSlots[idx] = gateType;
        gateSupply[gateType] -= 1;
        renderGateSlots();
        renderGatePalette();
        updateCircuitStatus("Slots updated. Evaluate when ready.", "neutral");
        break;
      }
    }
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function renderGateSlots() {
  document.querySelectorAll(".gate-slot").forEach((slotEl) => {
    const idx = Number(slotEl.dataset.slot);
    const val = gateSlots[idx];
    slotEl.textContent = val || slotEl.dataset.label;
    slotEl.classList.toggle("filled", !!val);
    slotEl.onclick = val
      ? () => {
          gateSupply[val] = (gateSupply[val] || 0) + 1;
          gateSlots[idx] = null;
          renderGateSlots();
          renderGatePalette();
          updateCircuitStatus("Gate returned to palette.", "neutral");
        }
      : null;
  });
  // Test 2's slots are read-only mirrors of Test 1's assignments
  document.querySelectorAll(".gate-slot-mirror").forEach((mirrorEl) => {
    const idx = Number(mirrorEl.dataset.mirror);
    const val = gateSlots[idx];
    mirrorEl.textContent = val || `GATE ${idx + 1}`;
    mirrorEl.classList.toggle("filled", !!val);
  });
}

function runCircuit(gates, inputs) {
  const { A, B, C, D, E, F } = inputs;
  const x = GATE_FUNCTIONS[gates[0]](A, B);
  const y = GATE_FUNCTIONS[gates[1]](C, D);
  const z = GATE_FUNCTIONS[gates[2]](x, y);
  const w = GATE_FUNCTIONS[gates[3]](z, E);
  return GATE_FUNCTIONS[gates[4]](w, F);
}

function evaluateCircuit() {
  if (gateSlots.some((s) => s === null)) {
    updateCircuitStatus("Fill all 5 slots before evaluating.", "error");
    return;
  }

  const out0 = runCircuit(gateSlots, CIRCUIT_TEST_CASES[0]);
  const out1 = runCircuit(gateSlots, CIRCUIT_TEST_CASES[1]);

  [out0, out1].forEach((out, i) => {
    const el = document.getElementById(`circuit-output-${i}`);
    el.textContent = out;
    el.classList.toggle("on", out === 1);
  });

  if (out0 === 1 && out1 === 1) {
    updateCircuitStatus("✔ BOTH TESTS PASS — relay re-armed.", "success");
    document.getElementById("circuit-reveal").classList.remove("hidden");
  } else {
    updateCircuitStatus(
      `✘ Test 1 = ${out0}, Test 2 = ${out1} — both must read 1. Adjust gates and try again.`,
      "error"
    );
  }
}

function updateCircuitStatus(text, state) {
  const el = document.getElementById("circuit-status");
  el.textContent = text;
  el.className = "reaction-status " + state;
}

// ---------------- ANSWERS SIDEBAR helper (escapeHtml is defined later, function-hoisted) ----------------

// ---------------- FLOATING ELEMENTS DRAG PUZZLE (Level 4) ----------------
const TARGET_COMPOUND_ELEMENTS = ["Na", "O", "H"];
let reactionSlots = [null, null, null];

function setupFloatingElements() {
  reactionSlots = [null, null, null];
  renderReactionChamber();
  updateReactionStatus("Chamber empty. Drag elements in.", "neutral");

  const container = document.getElementById("floating-elements");
  const items = shuffle(ELEMENT_POOL);
  container.innerHTML = items
    .map((el) => {
      const left = 6 + Math.random() * 82;
      const top = 8 + Math.random() * 68;
      const duration = (5 + Math.random() * 4).toFixed(2);
      const delay = (Math.random() * 4).toFixed(2);
      const drift = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 14);
      return `<span class="float-elem" data-symbol="${el}" style="left:${left}%; top:${top}%; --drift:${drift}px; animation-duration:${duration}s; animation-delay:-${delay}s;">${el}</span>`;
    })
    .join("");

  container.querySelectorAll(".float-elem").forEach((chip) => {
    chip.addEventListener("pointerdown", onChipPointerDown);
  });

  document.getElementById("reaction-reset-btn").onclick = () => setupFloatingElements();
}

function onChipPointerDown(e) {
  e.preventDefault();
  const chip = e.currentTarget;
  const symbol = chip.dataset.symbol;

  const ghost = chip.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.position = "fixed";
  ghost.style.pointerEvents = "none";
  ghost.style.animation = "none";
  ghost.style.left = e.clientX - 22 + "px";
  ghost.style.top = e.clientY - 22 + "px";
  document.body.appendChild(ghost);
  chip.style.visibility = "hidden";

  function onMove(ev) {
    ghost.style.left = ev.clientX - 22 + "px";
    ghost.style.top = ev.clientY - 22 + "px";
  }

  function onUp(ev) {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    ghost.remove();

    const chamber = document.getElementById("reaction-chamber");
    const rect = chamber.getBoundingClientRect();
    const overChamber =
      ev.clientX >= rect.left && ev.clientX <= rect.right &&
      ev.clientY >= rect.top && ev.clientY <= rect.bottom;

    if (overChamber && placeInSlot(symbol)) {
      chip.remove();
    } else {
      chip.style.visibility = "visible";
    }
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function placeInSlot(symbol) {
  const emptyIndex = reactionSlots.findIndex((s) => s === null);
  if (emptyIndex === -1) return false;
  reactionSlots[emptyIndex] = symbol;
  renderReactionChamber();

  if (reactionSlots.every((s) => s !== null)) {
    evaluateReaction();
  } else {
    updateReactionStatus(`${reactionSlots.filter(Boolean).length} / 3 elements loaded...`, "neutral");
  }
  return true;
}

function evaluateReaction() {
  const sortedSlots = [...reactionSlots].sort().join(",");
  const sortedTarget = [...TARGET_COMPOUND_ELEMENTS].sort().join(",");
  if (sortedSlots === sortedTarget) {
    updateReactionStatus("✔ REACTION STABLE — countermeasure synthesized. Submit its full name below.", "success");
  } else {
    updateReactionStatus("✘ Unstable reaction — wrong combination. Reset and try again.", "error");
  }
}

function renderReactionChamber() {
  document.querySelectorAll(".reaction-slot").forEach((slotEl, i) => {
    const val = reactionSlots[i];
    slotEl.textContent = val || "";
    slotEl.classList.toggle("filled", !!val);
  });
}

function updateReactionStatus(text, state) {
  const el = document.getElementById("reaction-status");
  if (!el) return;
  el.textContent = text;
  el.className = "reaction-status " + state;
}

// ---------------- CODE ARRANGEMENT PUZZLE (Level 3) ----------------
let arrangementOrder = [];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setupArrangementPuzzle() {
  arrangementOrder = shuffle(FLOW_BLOCKS.map((b) => b.id));
  renderArrangementList();

  const runBtn = document.getElementById("run-arrangement-btn");
  const outputEl = document.getElementById("arrangement-output");
  outputEl.textContent = "Arrange the blocks, then run.";
  document.getElementById("bonus-section").classList.add("hidden");

  runBtn.onclick = async () => {
    outputEl.textContent = "Running...";
    const lines = arrangementOrder.map((id) => FLOW_BLOCKS.find((b) => b.id === id).code);
    // auto-indent any line immediately following a line ending in ':'
    const assembled = lines
      .map((line, i) => (i > 0 && lines[i - 1].trim().endsWith(":") ? "    " + line : line))
      .join("\n");

    try {
      const py = await ensurePyodide();
      let captured = "";
      py.setStdout({ batched: (s) => (captured += s + "\n") });
      py.setStderr({ batched: (s) => (captured += s + "\n") });
      await py.runPythonAsync(assembled);
      const result = captured.trim();
      outputEl.textContent = result || "(no output — the if-condition likely wasn't met)";
      if (result === "Laminar") {
        outputEl.classList.add("success-output");
        document.getElementById("bonus-section").classList.remove("hidden");
      } else {
        outputEl.classList.remove("success-output");
      }
    } catch (err) {
      outputEl.classList.remove("success-output");
      outputEl.textContent = "Error:\n" + err.message;
    }
  };
}

function renderArrangementList() {
  const list = document.getElementById("reorder-list");
  list.innerHTML = arrangementOrder
    .map((id, i) => {
      const block = FLOW_BLOCKS.find((b) => b.id === id);
      return `
        <li class="reorder-item" data-id="${id}">
          <span class="reorder-code">${escapeHtml(block.code)}</span>
          <span class="reorder-controls">
            <button class="reorder-btn" data-dir="up" data-index="${i}" ${i === 0 ? "disabled" : ""}>▲</button>
            <button class="reorder-btn" data-dir="down" data-index="${i}" ${i === arrangementOrder.length - 1 ? "disabled" : ""}>▼</button>
          </span>
        </li>`;
    })
    .join("");

  list.querySelectorAll(".reorder-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      const dir = btn.dataset.dir;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= arrangementOrder.length) return;
      [arrangementOrder[i], arrangementOrder[j]] = [arrangementOrder[j], arrangementOrder[i]];
      renderArrangementList();
    });
  });
}

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
  const cutsceneTimerEl = document.getElementById("cutscene-timer-bg");

  if (remaining <= 0) {
    timerEl.textContent = "00:00";
    timerEl.classList.add("critical");
    if (cutsceneTimerEl) cutsceneTimerEl.textContent = "00:00";
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
  if (cutsceneTimerEl) cutsceneTimerEl.textContent = `${mm}:${ss}`;
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
        teamAnswers = team.answers || {};
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
