# BREAKING CODE — Containment Protocol

A 6-level competition site: a chemical plant's control network has been seized by a rogue AI
called **ASHCODE**, and it's heading for meltdown. Teams register a callsign, then race through
6 sequential subsystem challenges before a shared 60-minute countdown timer hits zero — though
the countdown reaching zero doesn't lock anyone out; teams can keep submitting and still finish
saving the plant afterward (there's a "containment failed" moment, then play continues).
Includes a live leaderboard and an in-browser Python interpreter for the debugging level.

## What's inside

```
factory-siege/
├── server/           Node/Express backend (team registration, answer validation, leaderboard, timer)
│   ├── server.js
│   └── package.json
└── public/           Frontend (served statically by the backend)
    ├── index.html
    ├── style.css
    └── app.js
```

**All correct answers live only in `server/server.js` (the `ANSWERS` object).** The frontend
never receives them — every submission is checked server-side, so answers can't be found by
reading page source or network responses.

## The 6 levels (as built)

| # | Subsystem | Mechanic | Answer |
|---|-----------|----------|--------|
| 1 | Acid feed valve | Binary → ASCII decode | `Sulphuric Acid` (or `Sulfuric Acid`) |
| 2 | Quench dosing controller | Fix 3 Python bugs, run in-browser, decode binary output | `QUENCH` |
| 3 | Coolant flow line | Rearrange 7 scrambled code blocks into working Python (Parson's-style puzzle), run it live, then solve a bonus Reynolds-number calculation | `TURBULENT` |
| 4 | Neutralization relay | **Drag** floating elements from a tank into a reaction chamber to combine them into the countermeasure compound (order-independent; wrong combos can be reset and retried) | `Sodium Hydroxide` (or `NaOH`) |
| 5 | Safety interlock relay | **Drag** logic gates into a 4-slot, 2-layer circuit. The *same* gate arrangement must satisfy **two different test-input scenarios simultaneously** (harder than a single test — ~24% of combinations work instead of ~50%). Success reveals the word `GROUND` — teams must then **reverse-encode** it into 8-bit binary themselves and submit the binary string | `010001110101001001001111010101010100111001000100` |
| 6 | Master decode | No cipher math — take the first letter of each of the previous 5 answers (`S`,`Q`,`T`,`S`,`G`, shown in the sidebar), then shift every letter forward by one position in the alphabet (A→B, B→C...) | `TRUTH` |

Level 3 is two-staged: teams reorder the code blocks (client-side, unlimited tries, runs live via
the same in-browser interpreter) until it prints `Laminar`. That reveals a bonus scenario with new
numbers — solving it and submitting the resulting flow regime (`TURBULENT`) is what actually
advances to Level 4.

Level 4's answer (Sodium Hydroxide) and Level 2's answer (Quench) both tie back to the same
in-story mechanism: NaOH is used to quench/neutralize the acid surge — Level 2's script literally
computes the `naoh` variable while dosing the quench.

**Level 6's answer (`TRUTH`) only works because of a deliberate, carefully-checked coincidence**:
the first letters of answers 1–5 (`S`,`Q`,`T`,`S`,`G`) each shift forward by exactly one letter into
`T`,`R`,`U`,`T`,`H`. If you change *any* of levels 1–5's answers, this breaks — I verified against a
~10,000-word English dictionary that this is the *only* 5-letter real word reachable by changing at
most 2 of the original answers (out of all possible pairs), so treat these five answers as locked
unless you're prepared to redo that search.

Answer checking is case-insensitive and ignores spaces/hyphens/underscores.

## The answers sidebar

Unlike earlier versions of this build, the sidebar isn't final-level-only — it now appears
**progressively from Level 2 onward**, showing every subsystem the team has already solved as
"KEY 1", "KEY 2", etc., with the first letter of each answer highlighted. This lets teams track
their own key letters as they go instead of needing to remember all five right at the end. It only
ever shows a team's *own* history (pulled from `team.answers` in `server.js`), never other teams'.

## Running it locally

Requires Node.js 18+ (no external database needed — progress is stored in `server/data.json`,
created automatically on first run).

```bash
cd server
npm install
npm start
```

Then open **http://localhost:3000** in a browser. The countdown timer starts the moment the
server starts (default: 60 minutes, shared by every team) — restart the server to reset it.
When the timer reaches zero, a "containment failed" overlay appears, but it doesn't lock
anything — teams can dismiss it and keep submitting answers to finish the run.

To fully reset the competition (clear all teams/progress), stop the server and delete
`server/data.json`, then start it again.

## Changing settings

Open `server/server.js`:

- `DURATION_MINUTES` — length of the countdown (default 60)
- `ANSWERS` — correct answer(s) per level; each level can accept multiple valid strings
- `TOTAL_LEVELS` — currently 6; if you add more levels you'll also need to add matching
  entries to the `LEVELS` object in `public/app.js`

## Deploying for the actual event

Any host that runs a persistent Node process works (this app keeps state in memory + a JSON
file, so it needs one long-running process — not a serverless/edge function).

**Simplest options:**
- **Render / Railway / Fly.io**: connect the repo, set the start command to
  `npm start` inside `server/`, and expose port from `process.env.PORT` (already handled).
- **A VPS you control**: install Node, copy the `factory-siege` folder over, run
  `npm install && npm start` inside `server/` (use `pm2` or `systemd` to keep it alive), and
  put it behind Nginx/Caddy for HTTPS.

**Important for a live competition:**
- Start the server at the exact moment you want the countdown to begin — the timer starts on
  server boot.
- Back up `server/data.json` periodically during the event if you want a safety net against
  a crash/restart wiping progress (a restart also resets the countdown, so avoid unnecessary
  restarts once the event has started).
- If running on a shared/public network, consider fronting it with HTTPS (e.g. via Caddy or
  a platform's built-in TLS) so team answers aren't sent in plaintext over the LAN/Wi-Fi.

## Notes on the Python level (Level 2)

The in-browser interpreter is [Pyodide](https://pyodide.org/), loaded from a CDN
(`cdn.jsdelivr.net`) — no server-side code execution, so it's safe to let participants run
arbitrary Python. First load takes a few seconds while Pyodide initializes; this happens
automatically when a team reaches Level 2.

## Customizing the story/theme

- Briefing text: `public/index.html`, inside `#screen-intro`
- Visual theme (colors, fonts, glitch effects): `public/style.css` (`:root` variables at the
  top control the palette)
- Level puzzle text: `LEVELS` object in `public/app.js`
