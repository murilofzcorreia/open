/**
 * cursor.js — Smooth Spring Cursor Trail (Fine Pointers Only)
 * Automatically skips mobile touchscreens to eliminate unnecessary DOM mutations and CPU overhead.
 */

export function initCursorTrail() {
  // Mobile CPU Shield: Disable trail on touch-only devices
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (!isFinePointer) return;

  const N = 14;
  const dots = [];
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < N; i++) {
    const d = document.createElement('div');
    d.className = 'cursor-dot';
    d.style.cssText = `position:fixed;top:0;left:0;pointer-events:none;border-radius:50%;background:rgba(216,180,254,${1 - i / N});width:${6 - i * 0.25}px;height:${6 - i * 0.25}px;z-index:${9999 - i};will-change:transform;`;
    fragment.appendChild(d);
    dots.push({ el: d, x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }
  document.body.appendChild(fragment);

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let isRunning = true;
  let rafId = null;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  function animTrail() {
    if (!isRunning) return;

    for (let i = 0; i < N; i++) {
      const d = dots[i];
      const prevX = i === 0 ? mx : dots[i - 1].x;
      const prevY = i === 0 ? my : dots[i - 1].y;

      d.x += (prevX - d.x) * (0.38 - i * 0.015);
      d.y += (prevY - d.y) * (0.38 - i * 0.015);

      d.el.style.transform = `translate3d(${d.x}px, ${d.y}px, 0) translate(-50%, -50%)`;
    }

    rafId = requestAnimationFrame(animTrail);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else {
      isRunning = true;
      rafId = requestAnimationFrame(animTrail);
    }
  });

  rafId = requestAnimationFrame(animTrail);
}
