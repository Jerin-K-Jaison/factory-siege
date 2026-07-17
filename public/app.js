// BREAKING CODE - frontend logic
// Correct answers are NEVER stored here — every submission is validated by the server.

const screens = {
  intro: document.getElementById("screen-intro"),
  level: document.getElementById("screen-level"),
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

const TOTAL_LEVELS = 6;

// ---------------- LEVEL CONTENT (puzzle text only — no answers) ----------------
const LEVELS = {
  1: {
    tag: "SUBSYSTEM 1 / 6 — ACID FEED VALVE",
    title: "Sensor Override Lockout",
    render: () => `
      <p>ASHCODE has frozen the acid feed sensor and left a taunting override code
      broadcasting on the diagnostic line, encoded in raw binary.</p>
      <div class="mono-block">01001000 00110010 01010011 01001111 00110100</div>
      <p class="hint">Hint: each 8-bit group is one ASCII character. Decode the full sequence —
      then submit the <strong>full chemical name</strong> of what that formula stands for,
      not the formula itself.</p>
    `,
  },
  2: {
    tag: "SUBSYSTEM 2 / 6 — QUENCH DOSING CONTROLLER",
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
product = naoh * final_conc       # BUG 1: wrong operation here
quench_dose = product - feed      # BUG 2: operands look reversed

if naoh == 400:                   # BUG 3: is this the right variable to check?
    print("01010001 01010101 01000101 01001110 01000011 01001000")  # binary — decode this to find the key
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
    tag: "SUBSYSTEM 3 / 6 — COOLANT FLOW LINE",
    title: "Flow Regime Diagnostic",
    render: () => `
      <p>The coolant line's flow-classifier script got shredded and scattered by the intrusion.
      Put the lines back in the correct order to determine the flow regime.</p>
      <ol id="reorder-list" class="reorder-list"></ol>
      <button id="run-arrangement-btn">▶ RUN ARRANGEMENT</button>
      <div id="arrangement-output">Arrange the blocks, then run.</div>
      <p class="hint">Hint: define your variables before you use them, and don't forget what
      needs to happen <em>inside</em> the if-statement.</p>

      <div id="bonus-section" class="hidden">
        <div class="bonus-divider">BONUS — FLOW REGIME CHECK</div>
        <p>Same formula, new coolant line: <strong>ρ = 1000 kg/m³, V = 0.1 m/s, D = 0.08 m,
        μ = 0.001 Pa·s.</strong></p>
        <p class="hint">Calculate Re. Is this flow Laminar or Turbulent? Submit the regime name
        below to unlock the next subsystem.</p>
      </div>
    `,
    needsArrangement: true,
  },
  4: {
    tag: "SUBSYSTEM 4 / 6 — NEUTRALIZATION RELAY",
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
      <p class="hint">Hint: one part reactive metal, one part life-giving gas, one part the
      lightest element in the universe. Once the reaction is stable, submit the compound's
      full chemical name below. (You've already met it — Subsystem 2's control script was
      balancing it.)</p>
    `,
    needsElements: true,
  },
  5: {
    tag: "SUBSYSTEM 5 / 6 — SAFETY INTERLOCK RELAY",
    title: "Logic Gate Lockout",
    render: () => `
      <p>ASHCODE ripped four gate types out of the interlock relay's decision circuit.
      This relay is stubborn — the <strong>same</strong> gate arrangement has to correctly
      re-arm it under <strong>both</strong> diagnostic sequences below before it'll trust you.</p>

      <div class="circuit-diagram">
        <div class="circuit-test-label">TEST 1</div>
        <div class="circuit-stage">
          <div class="circuit-inputs">A = 1<br>B = 1</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="0" data-label="GATE 1"></div>
          <div class="circuit-arrow">→ X</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">C = 0<br>D = 1</div>
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
        <div class="circuit-stage circuit-final">
          <div class="circuit-inputs">Z , E = 0</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot" data-slot="3" data-label="GATE 4"></div>
          <div class="circuit-arrow">→ OUT</div>
          <div id="circuit-output-0" class="circuit-output">?</div>
        </div>

        <div class="circuit-test-label" style="margin-top:14px;">TEST 2 (same gates, different inputs)</div>
        <div class="circuit-stage">
          <div class="circuit-inputs">A = 0<br>B = 1</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="0">GATE 1</div>
          <div class="circuit-arrow">→ X</div>
        </div>
        <div class="circuit-stage">
          <div class="circuit-inputs">C = 1<br>D = 0</div>
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
        <div class="circuit-stage circuit-final">
          <div class="circuit-inputs">Z , E = 1</div>
          <div class="circuit-arrow">→</div>
          <div class="gate-slot-mirror" data-mirror="3">GATE 4</div>
          <div class="circuit-arrow">→ OUT</div>
          <div id="circuit-output-1" class="circuit-output">?</div>
        </div>
      </div>

      <p class="hint">Gate palette (drag any into any of the 4 slots in Test 1 — reuse is allowed):</p>
      <div id="gate-palette" class="gate-palette"></div>

      <div class="reaction-row">
        <p id="circuit-status" class="reaction-status neutral">Fill all 4 slots, then evaluate.</p>
        <button id="circuit-evaluate-btn" type="button">EVALUATE CIRCUIT</button>
        <button id="circuit-reset-btn" type="button">RESET</button>
      </div>

      <div id="circuit-reveal" class="hidden">
        <div class="bonus-divider">RELAY RE-ARMED</div>
        <p>The relay confirms with one word before going quiet:</p>
        <div class="mono-block circuit-reveal-word">GROUND</div>
        <p class="hint">This time, do it in reverse — convert that word to its 8-bit binary
        ASCII form (one 8-bit group per letter) and submit the binary string as your answer.</p>
      </div>
    `,
    needsGates: true,
  },
  6: {
    tag: "SUBSYSTEM 6 / 6 — FINAL SHUTDOWN KEY",
    title: "Master Decode",
    render: () => `
      <p>The final lock doesn't need a separate cipher — it needs <strong>you</strong>.
      Take the first letter of each of your previous five recovered answers (check the
      sidebar) to spell a 5-letter fragment.</p>
      <p>Then shift <strong>every</strong> letter forward by one position in the alphabet
      (A→B, B→C, ... Z→A) to reveal the true shutdown code.</p>
      <p class="hint">Example: if a fragment letter shows as A, the corresponding answer
      letter is B.</p>
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
const CIRCUIT_TEST_CASES = [
  { A: 1, B: 1, C: 0, D: 1, E: 0 },
  { A: 0, B: 1, C: 1, D: 0, E: 1 },
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
  renderAnswersSidebar(level);
}

function showWin() {
  document.getElementById("win-summary").textContent =
    `${teamName} restored all 6 subsystems and locked ASHCODE out of Sector-7. Plant integrity: SECURED.`;
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
      if (data.displayAnswer) teamAnswers[currentLevel] = data.displayAnswer;
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

  const list = document.getElementById("answers-sidebar-list");
  list.innerHTML = solvedLevels
    .map((lvl) => {
      const answer = teamAnswers[lvl];
      const first = answer[0];
      const rest = answer.slice(1);
      return `<li><span class="sidebar-level-num">KEY ${lvl}</span>
        <span class="sidebar-answer-text"><span class="sidebar-first-letter">${first}</span>${escapeHtml(rest)}</span></li>`;
    })
    .join("");
}

// ---------------- LOGIC GATE PUZZLE (Level 5) ----------------
let gateSlots = [null, null, null, null];

function setupGatePuzzle() {
  gateSlots = [null, null, null, null];
  renderGateSlots();
  document.getElementById("circuit-reveal").classList.add("hidden");
  updateCircuitStatus("Fill all 4 slots, then evaluate.", "neutral");
  ["circuit-output-0", "circuit-output-1"].forEach((id) => {
    const el = document.getElementById(id);
    el.textContent = "?";
    el.classList.remove("on");
  });

  const palette = document.getElementById("gate-palette");
  palette.innerHTML = GATE_TYPES.map((g) => `<span class="gate-chip" data-gate="${g}">${g}</span>`).join("");
  palette.querySelectorAll(".gate-chip").forEach((chip) => {
    chip.addEventListener("pointerdown", onGateChipPointerDown);
  });

  document.getElementById("circuit-evaluate-btn").onclick = evaluateCircuit;
  document.getElementById("circuit-reset-btn").onclick = () => setupGatePuzzle();
}

function onGateChipPointerDown(e) {
  e.preventDefault();
  const gateType = e.currentTarget.dataset.gate;

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
        gateSlots[idx] = gateType;
        renderGateSlots();
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
  const { A, B, C, D, E } = inputs;
  const x = GATE_FUNCTIONS[gates[0]](A, B);
  const y = GATE_FUNCTIONS[gates[1]](C, D);
  const z = GATE_FUNCTIONS[gates[2]](x, y);
  return GATE_FUNCTIONS[gates[3]](z, E);
}

function evaluateCircuit() {
  if (gateSlots.some((s) => s === null)) {
    updateCircuitStatus("Fill all 4 slots before evaluating.", "error");
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

  if (remaining <= 0) {
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
