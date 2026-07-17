// BREAKING CODE - inline SVG icon library
// All icons use currentColor so they inherit theme color via CSS.

const ICONS = {
  // Intro: factory silhouette with chimneys + warning glow
  intro: `
  <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round">
      <path d="M20 130 L20 70 L55 90 L55 55 L90 78 L90 40 L125 62 L125 40 L160 40 L160 130 Z"/>
      <rect x="35" y="15" width="10" height="30"/>
      <rect x="70" y="5" width="10" height="40"/>
      <rect x="105" y="20" width="10" height="25"/>
      <line x1="20" y1="130" x2="180" y2="130"/>
    </g>
    <g class="icon-smoke">
      <circle cx="40" cy="8" r="5" fill="currentColor" opacity="0.5"/>
      <circle cx="75" cy="0" r="6" fill="currentColor" opacity="0.4"/>
      <circle cx="110" cy="12" r="4" fill="currentColor" opacity="0.5"/>
    </g>
    <g class="icon-warn" stroke="var(--red)" stroke-width="3" fill="none">
      <path d="M100 95 L112 118 L88 118 Z"/>
      <line x1="100" y1="103" x2="100" y2="111" stroke="var(--red)" stroke-width="2"/>
      <circle cx="100" cy="115" r="0.8" fill="var(--red)"/>
    </g>
  </svg>`,

  // Level 1: pressure gauge with needle in red zone
  level1: `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M 22 78 A 46 46 0 0 1 98 78" fill="none" stroke="var(--red)" stroke-width="4" opacity="0.7"/>
    <line x1="60" y1="60" x2="88" y2="38" stroke="var(--amber)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="6" fill="currentColor"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 6" opacity="0.5"/>
  </svg>`,

  // Level 2: code brackets with a bug
  level2: `
  <svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M45 15 L15 50 L45 85"/>
      <path d="M95 15 L125 50 L95 85"/>
    </g>
    <g stroke="var(--red)" stroke-width="2.5" fill="none">
      <ellipse cx="70" cy="50" rx="10" ry="14"/>
      <line x1="70" y1="36" x2="70" y2="28"/>
      <line x1="60" y1="42" x2="50" y2="34"/>
      <line x1="80" y1="42" x2="90" y2="34"/>
      <line x1="60" y1="58" x2="50" y2="66"/>
      <line x1="80" y1="58" x2="90" y2="66"/>
      <line x1="60" y1="50" x2="50" y2="50"/>
      <line x1="80" y1="50" x2="90" y2="50"/>
    </g>
  </svg>`,

  // Level 3: pipe flow — laminar (straight) vs turbulent (wavy) streamlines
  level3: `
  <svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="120" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="3"/>
    <g stroke="var(--teal)" stroke-width="2.5" fill="none" stroke-linecap="round">
      <line x1="22" y1="38" x2="65" y2="38"/>
      <line x1="22" y1="50" x2="65" y2="50"/>
      <line x1="22" y1="62" x2="65" y2="62"/>
    </g>
    <g stroke="var(--red)" stroke-width="2.5" fill="none" stroke-linecap="round">
      <path d="M70 38 Q80 30 90 38 T110 38 T118 38"/>
      <path d="M70 50 Q80 58 90 50 T110 50 T118 50"/>
      <path d="M70 62 Q80 54 90 62 T110 62 T118 62"/>
    </g>
  </svg>`,

  // Level 4: linear Na-O-H molecule
  level4: `
  <svg viewBox="0 0 160 90" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2.5">
      <line x1="35" y1="45" x2="80" y2="45"/>
      <line x1="80" y1="45" x2="120" y2="45"/>
    </g>
    <circle cx="35" cy="45" r="16" fill="var(--amber)" opacity="0.9"/>
    <circle cx="80" cy="45" r="13" fill="none" stroke="var(--teal)" stroke-width="2.5"/>
    <circle cx="120" cy="45" r="9" fill="none" stroke="var(--teal)" stroke-width="2.5"/>
    <text x="35" y="49" font-size="11" text-anchor="middle" fill="#14100a" font-family="Share Tech Mono, monospace">Na</text>
    <text x="80" y="49" font-size="10" text-anchor="middle" fill="var(--teal)" font-family="Share Tech Mono, monospace">O</text>
    <text x="120" y="49" font-size="9" text-anchor="middle" fill="var(--teal)" font-family="Share Tech Mono, monospace">H</text>
  </svg>`,

  // Level 5: logic gate symbol (AND-gate shape with input/output pins)
  level5: `
  <svg viewBox="0 0 140 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 20 H70 A30 30 0 0 1 70 80 H35 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="10" y1="35" x2="35" y2="35" stroke="currentColor" stroke-width="3"/>
    <line x1="10" y1="65" x2="35" y2="65" stroke="currentColor" stroke-width="3"/>
    <line x1="100" y1="50" x2="130" y2="50" stroke="var(--green)" stroke-width="3"/>
    <circle cx="10" cy="35" r="4" fill="currentColor"/>
    <circle cx="10" cy="65" r="4" fill="currentColor"/>
    <circle cx="130" cy="50" r="5" fill="var(--green)"/>
  </svg>`,

  // Level 6: master key / padlock, glowing
  level6: `
  <svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 55 V38 a18 18 0 0 1 36 0 V55" fill="none" stroke="currentColor" stroke-width="4"/>
    <rect x="20" y="55" width="60" height="55" rx="6" fill="none" stroke="currentColor" stroke-width="4"/>
    <circle cx="50" cy="78" r="7" fill="currentColor"/>
    <line x1="50" y1="83" x2="50" y2="96" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
  </svg>`,

  // Win: shield with checkmark
  win: `
  <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 8 L108 26 V64 C108 96 88 118 60 132 C32 118 12 96 12 64 V26 Z"
      fill="none" stroke="var(--green)" stroke-width="4"/>
    <path d="M36 68 L54 86 L86 46" fill="none" stroke="var(--green)" stroke-width="7"
      stroke-linecap="round" stroke-linejoin="round" class="win-check"/>
  </svg>`,

  // Wide hero scene: factory under attack (intro)
  heroSiege: `
  <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skySiege" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a0a0d"/>
        <stop offset="100%" stop-color="#0a0d10"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="600" height="220" fill="url(#skySiege)"/>
    <g class="hero-binary-rain" font-family="Share Tech Mono, monospace" font-size="11" fill="var(--red)" opacity="0.35">
      <text x="40" y="30">01</text><text x="110" y="60">10</text><text x="200" y="20">11</text>
      <text x="320" y="50">00</text><text x="420" y="25">01</text><text x="500" y="55">10</text>
      <text x="560" y="35">11</text><text x="20" y="90">10</text><text x="260" y="80">01</text>
    </g>
    <g fill="none" stroke="#3a4650" stroke-width="2">
      <rect x="30" y="120" width="70" height="80"/>
      <rect x="110" y="90" width="50" height="110"/>
      <rect x="170" y="130" width="90" height="70"/>
      <rect x="470" y="110" width="60" height="90"/>
      <rect x="540" y="140" width="45" height="60"/>
    </g>
    <g stroke="#3a4650" stroke-width="3" fill="none">
      <rect x="120" y="40" width="8" height="50"/>
      <rect x="140" y="55" width="8" height="35"/>
      <rect x="485" y="70" width="8" height="40"/>
    </g>
    <g class="hero-smoke-stack">
      <circle cx="124" cy="34" r="7" fill="#5a4a40" opacity="0.4"/>
      <circle cx="144" cy="48" r="6" fill="#5a4a40" opacity="0.35"/>
      <circle cx="489" cy="64" r="6" fill="#5a4a40" opacity="0.35"/>
    </g>
    <g class="hero-windows" fill="var(--amber)">
      <rect x="45" y="140" width="8" height="10" opacity="0.8"/>
      <rect x="65" y="140" width="8" height="10" opacity="0.5"/>
      <rect x="45" y="165" width="8" height="10" opacity="0.6"/>
      <rect x="185" y="150" width="8" height="10" opacity="0.7"/>
      <rect x="210" y="150" width="8" height="10" opacity="0.4"/>
      <rect x="235" y="170" width="8" height="10" opacity="0.6"/>
      <rect x="490" y="130" width="8" height="10" opacity="0.5"/>
      <rect x="510" y="150" width="8" height="10" opacity="0.7"/>
    </g>
    <g class="hero-beacon" stroke="var(--red)" stroke-width="2" fill="none">
      <circle cx="300" cy="100" r="4" fill="var(--red)"/>
      <circle cx="300" cy="100" r="14" opacity="0.5"/>
      <circle cx="300" cy="100" r="24" opacity="0.25"/>
    </g>
    <line x1="0" y1="200" x2="600" y2="200" stroke="#3a4650" stroke-width="2"/>
  </svg>`,

  // Wide hero scene: factory restored (win)
  heroRestored: `
  <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="skyRestored" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a1a14"/>
        <stop offset="100%" stop-color="#0a0d10"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="600" height="220" fill="url(#skyRestored)"/>
    <g fill="none" stroke="var(--green)" stroke-width="2" opacity="0.7">
      <rect x="30" y="120" width="70" height="80"/>
      <rect x="110" y="90" width="50" height="110"/>
      <rect x="170" y="130" width="90" height="70"/>
      <rect x="470" y="110" width="60" height="90"/>
      <rect x="540" y="140" width="45" height="60"/>
    </g>
    <g class="hero-windows" fill="var(--green)">
      <rect x="45" y="140" width="8" height="10" opacity="0.9"/>
      <rect x="65" y="140" width="8" height="10" opacity="0.9"/>
      <rect x="45" y="165" width="8" height="10" opacity="0.9"/>
      <rect x="185" y="150" width="8" height="10" opacity="0.9"/>
      <rect x="210" y="150" width="8" height="10" opacity="0.9"/>
      <rect x="235" y="170" width="8" height="10" opacity="0.9"/>
      <rect x="490" y="130" width="8" height="10" opacity="0.9"/>
      <rect x="510" y="150" width="8" height="10" opacity="0.9"/>
    </g>
    <g class="hero-beacon" stroke="var(--green)" stroke-width="2" fill="none">
      <circle cx="300" cy="100" r="4" fill="var(--green)"/>
      <circle cx="300" cy="100" r="14" opacity="0.5"/>
      <circle cx="300" cy="100" r="24" opacity="0.25"/>
    </g>
    <line x1="0" y1="200" x2="600" y2="200" stroke="var(--green)" stroke-width="2" opacity="0.5"/>
  </svg>`,
};
