// BREAKING CODE - ASHCODE eyes
// A pair of glowing eyes appears at a random spot on screen every so often,
// drifts a little as if watching the room, and — if clicked — vanishes with a
// glitch and reappears somewhere else after a beat.

(function () {
  const el = document.getElementById("ashcode-eyes");
  if (!el) return;
  const pupils=el.querySelectorAll(".pupil");

  let visible = false;
  let driftTimer = null;
  let hideTimer = null;
  let blinkTimer = null;
  let glitchTimer = null;
  let disabled = false;
  let mouseX=innerWidth/2,mouseY=innerHeight/2,tracking=false;

  function rand(a, b) { return a + Math.random() * (b - a); }
  document.addEventListener("mousemove",e=>{mouseX=e.clientX;mouseY=e.clientY;});

  // Don't pop up in the middle of a cutscene, the meltdown overlay, or the
  // open leaderboard panel — it'd just look broken layered over those.
  function isBusy() {
    const cutscene = document.getElementById("screen-cutscene");
    const meltdown = document.getElementById("meltdown-overlay");
    const leaderboard = document.getElementById("leaderboard-panel");
    return (
      (cutscene && cutscene.classList.contains("active")) ||
      (meltdown && meltdown.classList.contains("show")) ||
      (leaderboard && leaderboard.classList.contains("open"))
    );
  }

  function pickBasePosition() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const marginX = 90;
    const topBound = 110; // stay clear of the top bar
    const bottomBound = h - 70; // stay clear of the bottom ticker

    let x, y;
    let attempts = 0;
    do {
      x = rand(marginX, w - marginX);
      y = rand(topBound, Math.max(topBound + 40, bottomBound));
      attempts += 1;
      // steer away from the leaderboard toggle button, bottom-right corner
    } while (x > w - 170 && y > h - 170 && attempts < 6);

    return { x, y };
  }

  function jitter(base) {
    return {
      x: Math.min(window.innerWidth - 40, Math.max(40, base.x + rand(-45, 45))),
      y: Math.min(window.innerHeight - 40, Math.max(90, base.y + rand(-35, 35))),
    };
  }

  function applyPosition(pos) {
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
  }

  function blinkOnce() {
    el.classList.add("blinking");
    setTimeout(() => el.classList.remove("blinking"), 140);
  }

  function glitchOnce() {
    el.classList.add("rgb-glitch");
    setTimeout(() => el.classList.remove("rgb-glitch"), 120);
  }

  function clearTimers() {
    clearInterval(driftTimer);
    clearTimeout(hideTimer);
    clearTimeout(blinkTimer);
    clearInterval(glitchTimer);
  }

  function updateEyeDirection(){if(!visible||!tracking)return;const r=el.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(mouseX+18)-cx,dy=mouseY-cy;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;const m=4;pupils[0].setAttribute("x",34+dx*m);pupils[0].setAttribute("y",19+dy*m);pupils[1].setAttribute("x",120+dx*m);pupils[1].setAttribute("y",19+dy*m);requestAnimationFrame(updateEyeDirection);}
  function showEyes() {
    if (disabled) return;
    if (isBusy()) {
      setTimeout(showEyes, rand(2000, 4000));
      return;
    }

    const base = pickBasePosition();
    applyPosition(base);
    el.classList.remove("glitch-out");
    // force reflow so the transition re-triggers cleanly after a glitch-out
    void el.offsetWidth;
    el.classList.add("visible");
    visible = true;
tracking=false;
setTimeout(()=>{if(visible){tracking=true;updateEyeDirection();}},2500);
setTimeout(()=>{if(visible)blinkOnce();},5200);
setTimeout(()=>{if(visible)glitchOnce();},5700);

    blinkTimer = setTimeout(blinkOnce, rand(500, 1400));

    driftTimer = setInterval(() => {
      if (isBusy()) return;
      applyPosition(jitter(base));
      if (Math.random() < 0.5) blinkOnce();
    }, rand(1300, 2200));

    glitchTimer = setInterval(() => {
      if (Math.random() < 0.6) glitchOnce();
    }, rand(2400, 3600));

    hideTimer = setTimeout(() => hideEyes(false), rand(6000, 12000));
  }

  function hideEyes(wasClicked) {
    if (!visible) return;
    visible = false;
    clearTimers();

    if (wasClicked) {
      el.classList.add("glitch-out");
    }
    el.classList.remove("visible");
    setTimeout(() => el.classList.remove("glitch-out"), 250);

    if (disabled) return;
    const nextDelay = wasClicked ? rand(3000, 8000) : rand(5000, 13000);
    setTimeout(showEyes, nextDelay);
  }

  window.stopAshcodeEyes = function () {
    disabled = true;
    clearTimers();
    visible = false;
    el.classList.remove("visible");
    el.classList.remove("glitch-out");
  };

  window.startAshcodeEyes = function () {
    if (!disabled) return;
    disabled = false;
    clearTimers();
    setTimeout(showEyes, 1500);
  };

  el.addEventListener("click", () => hideEyes(true));

  // first appearance after a short delay so it's not the very first thing seen
  setTimeout(showEyes, rand(4000, 9000));
})();
