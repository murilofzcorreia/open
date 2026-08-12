import { startMusic } from './music.js';
import { transitionTo } from './router.js';
import { launchConfetti } from './particles.js';

let noEsc = 0;
const MAX = 7;
let holdTimer = null;
let holdProgress = 0;

export function resetQuestionState() {
  noEsc = 0;
  const ph = document.getElementById('btn-no-placeholder');
  const noAway = document.getElementById('no-away');
  const btnNo = document.getElementById('btn-no');

  if (ph) ph.classList.remove('gone');
  if (noAway) {
    noAway.classList.remove('show');
    noAway.innerHTML = '';
  }
  if (btnNo) {
    btnNo.style.display = '';
    btnNo.classList.remove('bye');
  }
}

export function positionNoButton() {
  const ph = document.getElementById('btn-no-placeholder');
  const btnNo = document.getElementById('btn-no');
  if (!ph || !btnNo) return;

  const r = ph.getBoundingClientRect();
  btnNo.style.transition = 'none';
  btnNo.style.width = r.width + 'px';
  btnNo.style.left = r.left + 'px';
  btnNo.style.top = r.top + 'px';
  btnNo.classList.add('visible');
  requestAnimationFrame(() => {
    btnNo.style.transition = 'left 0.6s cubic-bezier(.22,.68,0,1.2), top 0.6s cubic-bezier(.22,.68,0,1.2), opacity 0.4s';
  });
}

export function runAway() {
  const btnNo = document.getElementById('btn-no');
  const noAway = document.getElementById('no-away');
  const ph = document.getElementById('btn-no-placeholder');
  if (!btnNo) return;

  if (noEsc >= MAX) return;
  noEsc++;

  if (noEsc >= MAX) {
    const r = btnNo.getBoundingClientRect();
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.style.cssText = `position:fixed; width:${Math.random()*8+4}px; height:${Math.random()*8+4}px; background:var(--pink); left:${r.left+r.width/2}px; top:${r.top+r.height/2}px; z-index:10000; pointer-events:none; border-radius:50%; box-shadow:0 0 10px var(--p4);`;
      document.body.appendChild(p);
      const vx = (Math.random() - 0.5) * 20;
      let vy = (Math.random() - 0.5) * 20 - 5;
      let px = r.left + r.width / 2, py = r.top + r.height / 2;
      let a = 1;
      function anim() {
        px += vx; py += vy; vy += 0.5; a -= 0.02;
        p.style.transform = `translate(${px - (r.left + r.width / 2)}px, ${py - (r.top + r.height / 2)}px)`;
        p.style.opacity = a;
        if (a > 0) requestAnimationFrame(anim); else p.remove();
      }
      anim();
    }
    if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
    btnNo.style.display = 'none';
    if (ph) ph.classList.add('gone');
    if (noAway) {
      noAway.innerHTML = "Você achou mesmo que ia ter escolha? 😈💜";
      noAway.classList.add('show');
    }
    return;
  }

  const vw = window.innerWidth, vh = window.innerHeight;
  const bw = btnNo.offsetWidth || 100, bh = btnNo.offsetHeight || 50;
  const m = 18;
  const cl = parseFloat(btnNo.style.left) || vw / 2;
  const ct = parseFloat(btnNo.style.top) || vh * 0.7;
  let nx, ny, t = 0;
  do {
    nx = m + Math.random() * (vw - bw - m * 2);
    ny = m + Math.random() * (vh - bh - m * 2);
    t++;
  } while (Math.abs(nx - cl) < 80 && Math.abs(ny - ct) < 80 && t < 30);

  btnNo.style.left = nx + 'px';
  btnNo.style.top = ny + 'px';
}

export function goToYes() {
  const btnNo = document.getElementById('btn-no');
  if (btnNo) btnNo.classList.remove('visible');
  startMusic();
  transitionTo('page-yes');
  setTimeout(launchConfetti, 500);
  setTimeout(() => {
    document.querySelectorAll('.g-card').forEach(c => c.classList.add('shown'));
  }, 700);
}

export function resetHoldButton() {
  holdProgress = 0;
  cancelAnimationFrame(holdTimer);
  const openBtn = document.getElementById('open-btn');
  const btnGlow = openBtn ? openBtn.querySelector('.btn-glow') : null;
  if (!btnGlow) return;
  btnGlow.style.transform = '';
  btnGlow.style.opacity = '';
}

export function startHold(e) {
  const openBtn = document.getElementById('open-btn');
  const btnGlow = openBtn ? openBtn.querySelector('.btn-glow') : null;
  const bgMusic = document.getElementById('bg-music');
  if (!openBtn || !btnGlow) return;
  if (e) e.preventDefault();
  if (bgMusic && bgMusic.readyState === 0) bgMusic.load();
  startMusic();

  holdProgress = 0;
  function updateHold() {
    holdProgress += 2;
    btnGlow.style.transform = `scale(${1 + holdProgress / 40})`;
    btnGlow.style.opacity = Math.min(1, holdProgress / 100 + 0.6);
    if (holdProgress % 15 === 0 && navigator.vibrate) navigator.vibrate(30);
    if (holdProgress >= 100) {
      if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      btnGlow.style.transform = 'scale(3)';
      btnGlow.style.opacity = '0';
      transitionTo('page-question');
    } else {
      holdTimer = requestAnimationFrame(updateHold);
    }
  }
  updateHold();
}

export function stopHold(e) {
  const openBtn = document.getElementById('open-btn');
  const btnGlow = openBtn ? openBtn.querySelector('.btn-glow') : null;
  if (!openBtn || !btnGlow) return;
  if (e) e.preventDefault();
  cancelAnimationFrame(holdTimer);
  if (holdProgress >= 100) return;
  holdProgress = 0;
  btnGlow.style.transform = '';
  btnGlow.style.opacity = '';
}

export function initEvasionModule() {
  const btnNo = document.getElementById('btn-no');
  const openBtn = document.getElementById('open-btn');

  window.resetQuestionState = resetQuestionState;
  window.positionNoButton = positionNoButton;
  window.goToYes = goToYes;

  if (btnNo) {
    btnNo.addEventListener('mouseover', runAway);
    btnNo.addEventListener('touchstart', e => {
      e.preventDefault(); e.stopPropagation(); runAway();
    }, { passive: false });
  }

  if (openBtn) {
    openBtn.addEventListener('pointerdown', startHold);
    openBtn.addEventListener('pointerup', stopHold);
    openBtn.addEventListener('pointerleave', stopHold);
    openBtn.addEventListener('pointercancel', stopHold);
    openBtn.addEventListener('contextmenu', e => e.preventDefault());
    openBtn.addEventListener('touchstart', startHold, { passive: false });
    openBtn.addEventListener('touchend', stopHold, { passive: false });
    openBtn.addEventListener('touchcancel', stopHold, { passive: false });
  }

  // Magnetic button hover interaction
  document.querySelectorAll('.btn-sim, .intro-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.25;
      const dy = (e.clientY - r.top - r.height / 2) * 0.25;
      btn.style.transform = `translate(${dx}px,${dy}px) scale(1.04)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // Gyroscope parallax support
  window.addEventListener('deviceorientation', e => {
    if (e.gamma === null || e.beta === null) return;
    const ax = Math.max(-30, Math.min(30, e.gamma)) / 30;
    const ay = Math.max(-30, Math.min(30, e.beta - 45)) / 30;
    const pages = document.querySelectorAll('.page.active');
    pages.forEach(p => {
      p.style.transform = `perspective(1000px) rotateY(${ax * 5}deg) rotateX(${-ay * 5}deg) translateZ(10px)`;
    });
  });
}
