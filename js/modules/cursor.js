export function initCursorTrail() {
  const N = 18;
  const dots = [];
  for (let i = 0; i < N; i++) {
    const d = document.createElement('div');
    d.className = 'cursor-dot';
    d.style.cssText = `width:${6-i*0.2}px;height:${6-i*0.2}px;opacity:${1-i/N};transition-duration:${(i+1)*0.04}s;z-index:${9999-i};`;
    document.body.appendChild(d);
    dots.push({ el: d, x: 0, y: 0 });
  }

  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('touchmove', e => {
    if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
  }, { passive: true });

  function animTrail() {
    dots.forEach((d, i) => {
      const prev = i === 0 ? { x: mx, y: my } : dots[i - 1];
      d.x += (prev.x - d.x) * (0.35 - i * 0.012);
      d.y += (prev.y - d.y) * (0.35 - i * 0.012);
      d.el.style.transform = `translate3d(${d.x}px,${d.y}px,0) translate(-50%,-50%)`;
    });
    requestAnimationFrame(animTrail);
  }
  animTrail();
}
