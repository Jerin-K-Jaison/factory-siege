# FACTORY SIEGE — Containment Protocol

A 5-level competition site: a chemical plant is under cyberattack and heading for meltdown.
Teams register a callsign, then race through 5 sequential subsystem challenges before a
shared countdown timer hits zero. Includes a live leaderboard and an in-browser Python
interpreter for the debugging level.

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

## The 5 levels (as built)

| # | Subsystem | Mechanic | Answer |
|---|-----------|----------|--------|
| 1 | Acid feed valve | Binary → ASCII decode | `H2SO4` |
| 2 | Mass balance controller | Fix 3 Python bugs, run in-browser, decode binary output | `EVAP` |
| 3 | Network gateway | Caesar cipher (shift 3) | `CATALYST` |
| 4 | Core relay | Hex → ASCII decode | `REACTOR` |
| 5 | Master containment key | Vigenère cipher, key = first letters of answers 1–4 (`H`,`E`,`C`,`R`) | `CONTAINMENT` |

Answer checking is case-insensitive and ignores spaces/hyphens/underscores, so `h2so4`,
`H2 SO4`, etc. all work.

## Running it locally

Requires Node.js 18+ (no external database needed — progress is stored in `server/data.json`,
created automatically on first run).

```bash
cd server
npm install
npm start
```

Then open **http://localhost:3000** in a browser. The countdown timer starts the moment the
server starts (default: 45 minutes, shared by every team) — restart the server to reset it.

To fully reset the competition (clear all teams/progress), stop the server and delete
`server/data.json`, then start it again.

## Changing settings

Open `server/server.js`:

- `DURATION_MINUTES` — length of the countdown (default 45)
- `ANSWERS` — correct answer(s) per level; each level can accept multiple valid strings
- `TOTAL_LEVELS` — currently 5; if you add more levels you'll also need to add matching
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
