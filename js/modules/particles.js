/**
 * particles.js — High-Performance 60 FPS Particle Systems & Micro-Interactions
 * Zero-allocation inner loops, font-parsing caching, and visibility-aware lifecycle.
 */

export function initFloatingEmojis() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;';
  document.body.appendChild(c);

  const ctx = c.getContext('2d', { alpha: true });
  if (!ctx) return;

  const EMO = ['💜', '🩷', '✨', '💕', '🌸', '💫', '🌙', '⭐'];
  let W = 0, H = 0;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const count = prefersReducedMotion ? 6 : (window.innerWidth < 600 ? 14 : 22);
  const pts = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    sz: Math.random() * 12 + 8,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -(Math.random() * 0.35 + 0.1),
    op: 0,
    maxOp: Math.random() * 0.22 + 0.04,
    life: 0,
    maxLife: Math.random() * 500 + 300,
    ang: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.012,
    em: EMO[Math.floor(Math.random() * EMO.length)]
  }));

  function resetPt(p) {
    p.x = Math.random() * W;
    p.y = H + 10;
    p.sz = Math.random() * 12 + 8;
    p.vx = (Math.random() - 0.5) * 0.25;
    p.vy = -(Math.random() * 0.35 + 0.1);
    p.maxOp = Math.random() * 0.22 + 0.04;
    p.life = 0;
    p.maxLife = Math.random() * 500 + 300;
    p.ang = Math.random() * Math.PI * 2;
    p.spin = (Math.random() - 0.5) * 0.012;
    p.em = EMO[Math.floor(Math.random() * EMO.length)];
  }

  let isRunning = false;
  let rafId = null;

  // Base font set once outside the loop to eliminate string parsing overhead
  const BASE_FONT_SIZE = 16;

  function frame() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, W, H);
    ctx.font = `${BASE_FONT_SIZE}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const len = pts.length;
    for (let i = 0; i < len; i++) {
      const p = pts[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.ang += p.spin;

      const pr = p.life / p.maxLife;
      p.op = pr < 0.15 ? (pr / 0.15) * p.maxOp : pr > 0.75 ? ((1 - pr) / 0.25) * p.maxOp : p.maxOp;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.op));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang);

      const scale = p.sz / BASE_FONT_SIZE;
      ctx.scale(scale, scale);
      ctx.fillText(p.em, 0, 0);
      ctx.restore();

      if (p.life >= p.maxLife) {
        resetPt(p);
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (!isRunning) {
      isRunning = true;
      rafId = requestAnimationFrame(frame);
    }
  }

  function stop() {
    isRunning = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}

export function launchConfetti() {
  const cc = document.getElementById('cfc');
  if (!cc) return;
  cc.style.display = 'block';
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;

  const ctx = cc.getContext('2d', { alpha: true });
  if (!ctx) return;

  const COLS = ['#a855f7', '#f472b6', '#f5c842', '#d8b4fe', '#fff', '#c084fc', '#fb7185', '#38bdf8'];
  const SHAPES = ['rect', 'circle', 'ribbon'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * cc.width,
    y: -20 - Math.random() * 250,
    w: Math.random() * 10 + 4,
    h: Math.random() * 18 + 6,
    col: COLS[Math.floor(Math.random() * COLS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rot: Math.random() * Math.PI * 2,
    rs: (Math.random() - 0.5) * 0.15,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    alpha: 1
  }));

  let fr = 0;
  let active = true;

  function drawC() {
    if (!active) return;
    ctx.clearRect(0, 0, cc.width, cc.height);

    let hasVisible = false;
    const len = pieces.length;

    for (let i = 0; i < len; i++) {
      const p = pieces[i];
      if (p.alpha <= 0) continue;

      hasVisible = true;
      p.x += p.vx;
      p.y += p.vy + Math.sin(fr * 0.03 + p.x) * 0.3;
      p.rot += p.rs;
      p.vx *= 0.995;

      if (fr > 80) p.alpha -= 0.007;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ribbon') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h / 3);
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    fr++;
    if (hasVisible) {
      requestAnimationFrame(drawC);
    } else {
      active = false;
      cc.style.display = 'none';
    }
  }

  requestAnimationFrame(drawC);
}

export function initRippleEffect() {
  // DOM recycling pool for click ripples
  const POOL_SIZE = 6;
  const pool = [];
  let poolIdx = 0;

  for (let i = 0; i < POOL_SIZE; i++) {
    const rip = document.createElement('div');
    rip.className = 'touch-ripple';
    rip.style.cssText = 'position:fixed;width:80px;height:80px;border-radius:50%;border:1px solid rgba(168,85,247,0.6);pointer-events:none;z-index:9000;display:none;will-change:transform,opacity;';
    document.body.appendChild(rip);
    pool.push(rip);
  }

  document.addEventListener('click', (e) => {
    const rip = pool[poolIdx];
    poolIdx = (poolIdx + 1) % POOL_SIZE;

    const sz = 80;
    rip.style.left = `${e.clientX - sz / 2}px`;
    rip.style.top = `${e.clientY - sz / 2}px`;
    rip.style.display = 'block';
    rip.style.animation = 'none';
    // Force reflow for re-triggering animation cleanly
    void rip.offsetWidth;
    rip.style.animation = 'ripOut 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards';

    setTimeout(() => {
      rip.style.display = 'none';
    }, 650);
  }, { passive: true });

  const ripStyle = document.createElement('style');
  ripStyle.textContent = '@keyframes ripOut{from{transform:scale(0.3);opacity:1;}to{transform:scale(2.8);opacity:0;}}';
  document.head.appendChild(ripStyle);
}
