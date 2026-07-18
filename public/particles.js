// BREAKING CODE - roaming particle system
// Ambient embers + binary digits drift the screen during play; a gold/green
// confetti burst fires when the plant is secured.

(function () {
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (rainActive) startRain();
  }
  window.addEventListener("resize", resize);
  resize();

  const MAX_AMBIENT = 55;
  let mode = "alert"; // "alert" | "success"
  let particles = [];
  let bursts = [];
  let rainActive = false;
  let rainColumns = [];

  const ALERT_COLORS = ["#ffb000", "#ff2d3b", "#ffcf66"];
  const SUCCESS_COLORS = ["#38ff9c", "#ffd166", "#35e7e0"];
  const RAIN_COLOR = "#35e7e0";

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  class Ember {
    constructor() {
      this.x = rand(0, W);
      this.y = H + rand(0, 40);
      this.r = rand(1, 2.6);
      this.speed = rand(0.25, 0.9);
      this.sway = rand(0.3, 1.1);
      this.swaySeed = rand(0, Math.PI * 2);
      this.alpha = rand(0.25, 0.75);
      this.color = pick(mode === "alert" ? ALERT_COLORS : SUCCESS_COLORS);
      this.life = 0;
      this.isDigit = Math.random() < 0.18;
      this.digit = Math.random() < 0.5 ? "0" : "1";
    }
    update() {
      this.life += 1;
      this.y -= this.speed;
      this.x += Math.sin(this.life * 0.02 + this.swaySeed) * this.sway * 0.4;
      return this.y > -30;
    }
    draw() {
      ctx.globalAlpha = this.alpha * Math.min(1, (H - (H - this.y)) / H + 0.3);
      ctx.globalAlpha = this.alpha;
      if (this.isDigit) {
        ctx.fillStyle = this.color;
        ctx.font = `${10 + this.r * 2}px 'Share Tech Mono', monospace`;
        ctx.fillText(this.digit, this.x, this.y);
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = this.alpha * 0.35;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  class ConfettiPiece {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = rand(0, Math.PI * 2);
      const speed = rand(2, 7);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 2;
      this.gravity = 0.12;
      this.size = rand(2, 5);
      this.color = pick(SUCCESS_COLORS);
      this.life = 0;
      this.maxLife = rand(70, 130);
      this.rot = rand(0, Math.PI * 2);
      this.rotSpeed = rand(-0.2, 0.2);
    }
    update() {
      this.life += 1;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.rotSpeed;
      return this.life < this.maxLife;
    }
    draw() {
      const fade = 1 - this.life / this.maxLife;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = this.color;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.6);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  class RainColumn {
    constructor(x) {
      this.x = x;
      this.y = rand(-H, 0);
      this.speed = rand(3, 8);
      this.digit = Math.random() < 0.5 ? "0" : "1";
      this.flipTimer = 0;
    }
    update() {
      this.y += this.speed;
      this.flipTimer += 1;
      if (this.flipTimer > 8) {
        this.digit = Math.random() < 0.5 ? "0" : "1";
        this.flipTimer = 0;
      }
      if (this.y > H + 20) {
        this.y = rand(-200, -20);
        this.speed = rand(3, 8);
      }
    }
    draw() {
      ctx.fillStyle = RAIN_COLOR;
      ctx.globalAlpha = 0.85;
      ctx.font = "16px 'Share Tech Mono', monospace";
      ctx.fillText(this.digit, this.x, this.y);
      ctx.globalAlpha = 1;
    }
  }

  function startRain() {
    rainActive = true;
    const colCount = Math.floor(W / 22);
    rainColumns = Array.from({ length: colCount }, (_, i) => new RainColumn(i * 22 + 4));
  }

  function stopRain() {
    rainActive = false;
    rainColumns = [];
  }

  function spawnAmbientIfNeeded() {
    if (particles.length < MAX_AMBIENT && Math.random() < 0.6) {
      particles.push(new Ember());
    }
  }

  function burst(x, y, count = 90) {
    x = x ?? W / 2;
    y = y ?? H / 2;
    for (let i = 0; i < count; i++) {
      bursts.push(new ConfettiPiece(x, y));
    }
  }

  function setMode(newMode) {
    mode = newMode;
  }

  function loop() {
    if (rainActive) {
      // semi-transparent fill instead of a full clear creates the falling-trail effect
      ctx.fillStyle = "rgba(5, 7, 10, 0.18)";
      ctx.fillRect(0, 0, W, H);
      rainColumns.forEach((c) => {
        c.update();
        c.draw();
      });
    } else {
      ctx.clearRect(0, 0, W, H);
      spawnAmbientIfNeeded();
      particles = particles.filter((p) => p.update());
      particles.forEach((p) => p.draw());
    }

    bursts = bursts.filter((p) => p.update());
    bursts.forEach((p) => p.draw());

    requestAnimationFrame(loop);
  }
  loop();

  window.FactoryParticles = { burst, setMode, startRain, stopRain };
})();
