export function initFloatingEmojis() {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const EMO = ['💜','🩷','✨','💕','🌸','💫','🌙','⭐'];
  let W, H;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const pts = Array.from({ length: 22 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    sz: Math.random() * 12 + 7,
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
    p.sz = Math.random() * 12 + 7;
    p.vx = (Math.random() - 0.5) * 0.25;
    p.vy = -(Math.random() * 0.35 + 0.1);
    p.maxOp = Math.random() * 0.22 + 0.04;
    p.life = 0;
    p.maxLife = Math.random() * 500 + 300;
    p.ang = Math.random() * Math.PI * 2;
    p.spin = (Math.random() - 0.5) * 0.012;
    p.em = EMO[Math.floor(Math.random() * EMO.length)];
  }

  function frame() {
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.ang += p.spin;
      const pr = p.life / p.maxLife;
      p.op = pr < 0.15 ? (pr / 0.15) * p.maxOp : pr > 0.75 ? ((1 - pr) / 0.25) * p.maxOp : p.maxOp;
      ctx.save();
      ctx.globalAlpha = p.op;
      ctx.font = p.sz + 'px serif';
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang);
      ctx.fillText(p.em, -p.sz / 2, p.sz / 2);
      ctx.restore();
      if (p.life >= p.maxLife) resetPt(p);
    });
    requestAnimationFrame(frame);
  }
  frame();
}

export function launchConfetti() {
  const cc = document.getElementById('cfc');
  if (!cc) return;
  cc.style.display = 'block';
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;
  const ctx = cc.getContext('2d');
  const COLS = ['#a855f7','#f472b6','#f5c842','#d8b4fe','#fff','#c084fc','#fb7185','#38bdf8'];
  const SHAPES = ['rect','circle','ribbon'];
  const pieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * cc.width,
    y: -20 - Math.random() * 300,
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
  function drawC() {
    ctx.clearRect(0, 0, cc.width, cc.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy + Math.sin(fr * 0.03 + p.x) * 0.3;
      p.rot += p.rs;
      p.vx *= 0.995;
      if (fr > 90) p.alpha -= 0.006;
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
    });
    fr++;
    if (pieces.some(p => p.alpha > 0)) requestAnimationFrame(drawC);
    else cc.style.display = 'none';
  }
  drawC();
}

export function initRippleEffect() {
  document.addEventListener('click', e => {
    const rip = document.createElement('div');
    const sz = 80;
    rip.style.cssText = `
      position:fixed;width:${sz}px;height:${sz}px;border-radius:50%;
      left:${e.clientX - sz / 2}px;top:${e.clientY - sz / 2}px;
      border:1px solid rgba(168,85,247,0.6);
      pointer-events:none;z-index:9000;
      animation:ripOut 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
    `;
    document.body.appendChild(rip);
    setTimeout(() => rip.remove(), 700);
  });

  const ripStyle = document.createElement('style');
  ripStyle.textContent = '@keyframes ripOut{from{transform:scale(0.3);opacity:1;}to{transform:scale(3);opacity:0;}}';
  document.head.appendChild(ripStyle);
}
