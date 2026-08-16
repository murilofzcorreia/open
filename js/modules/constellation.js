/**
 * constellation.js — Interactive Constellation Star Map & Love Milestones
 *
 * Renders an interactive, 60fps celestial star map in #constellation-container.
 * Features gravitational glow physics, glowing celestial lines, light pulse traversal,
 * floating glassmorphic romantic tooltips, stardust supernova sparkles, and haptic feedback.
 *
 * @module Constellation
 * @version 1.0.0
 */

export const CONSTELLATION_MILESTONES = [
  {
    id: 1,
    title: 'Primeira Troca de Olhares',
    subtitle: 'O instante em que nossos mundos colidiram',
    coordinates: 'RA 14h 15m 39s / Dec +19° 10′ 56″',
    constellation: 'Alfa Amor ✧',
    date: 'O Primeiro Olhar',
    description: 'Quando nossos olhares se cruzaram pela primeira vez, o tempo desacelerou e eu tive a certeza de que algo extraordinário estava para começar.',
    quote: '“Bastou um segundo para o meu coração reconhecer o seu.”',
    icon: '✨',
    color: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.8)',
    x: 0.14,
    y: 0.74,
    magnitude: 1.0
  },
  {
    id: 2,
    title: 'Primeira Conversa Inesquecível',
    subtitle: 'Horas que pareceram suspiros',
    coordinates: 'RA 16h 29m 24s / Dec -26° 25′ 55″',
    constellation: 'Nebulosa do Diálogo 💬',
    date: 'Primeira Conversa',
    description: 'Conversas que vararam a madrugada, risadas soltas e a descoberta de uma afinidade mágica que parecia ter sido escrita há séculos nas estrelas.',
    quote: '“Falar com você é como encontrar o lugar onde a alma descansa.”',
    icon: '💜',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.85)',
    x: 0.32,
    y: 0.34,
    magnitude: 1.15
  },
  {
    id: 3,
    title: 'O Primeiro Beijo Mágico',
    subtitle: 'O universo inteiro parou ao nosso redor',
    coordinates: 'RA 19h 50m 46s / Dec +08° 52′ 05″',
    constellation: 'Estrela Cadente 💋',
    date: 'Primeiro Beijo',
    description: 'Um arrepio na pele, o toque doce dos seus lábios e a certeza mais profunda de que eu havia encontrado o grande amor da minha vida.',
    quote: '“Naquele beijo, o mundo inteiro silenciou e só restou nós dois.”',
    icon: '💫',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.9)',
    x: 0.50,
    y: 0.68,
    magnitude: 1.2
  },
  {
    id: 4,
    title: '12 de Maio de 2026: O Começo de Tudo',
    subtitle: '20:25 — O marco da nossa história',
    coordinates: 'RA 20h 25m 00s / Dec +45° 16′ 49″',
    constellation: 'Constelação 12.05 ⏳',
    date: '12 de Maio de 2026, 20:25',
    description: 'O momento exato em que a nossa história começou a ser contada com amor, verdade e cumplicidade. A contagem de cada segundo juntos.',
    quote: '“Desde aquele minuto, cada batida do meu peito tem o seu nome.”',
    icon: '👑',
    color: '#f5c842',
    glowColor: 'rgba(245, 200, 66, 0.95)',
    x: 0.68,
    y: 0.28,
    magnitude: 1.35
  },
  {
    id: 5,
    title: 'O Pedido de Namoro Real',
    subtitle: 'O sim mais lindo da minha vida',
    coordinates: 'RA 05h 35m 08s / Dec -05° 23′ 28″',
    constellation: 'Aliança Celeste 💍',
    date: 'O Pedido Oficial',
    description: 'Com todo o amor que transborda no meu peito, fiz a pergunta mais importante da minha vida — e o seu sorriso disse tudo o que eu sonhava ouvir.',
    quote: '“Você é a escolha mais linda, perfeita e certa que eu já fiz.”',
    icon: '💍',
    color: '#d8b4fe',
    glowColor: 'rgba(216, 180, 254, 0.9)',
    x: 0.83,
    y: 0.56,
    magnitude: 1.25
  },
  {
    id: 6,
    title: 'Para Todo o Sempre ✨',
    subtitle: 'Infinito, além do tempo e das galáxias',
    coordinates: 'RA ∞h ∞m ∞s / Dec +90° 00′ 00″',
    constellation: 'Infinito dos Apaixonados ♾️',
    date: 'Para Sempre',
    description: 'Cuidar de você, te fazer sorrir todos os dias e construir uma vida inteira de mãos dadas. Esta constelação nunca se apagará.',
    quote: '“Amar você ontem, hoje e por toda a eternidade.”',
    icon: '💖',
    color: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 1)',
    x: 0.92,
    y: 0.22,
    magnitude: 1.4
  }
];

// Constellation Line Links (Pairings connecting milestones)
const CONSTELLATION_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [1, 3], // Extra aesthetic galactic cross-connection
  [2, 4]
];

// Module state
let container = null;
let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let dpr = 1;
let animFrameId = null;
let isRunning = false;
let isVisible = true;

// Interactive pointers & physics
let pointer = { x: -9999, y: -9999, active: false, isTouch: false };
let activeMilestoneIndex = 3; // Default highlighted: May 12, 2026
let hoveredMilestoneIndex = -1;
let pulsePhotonProgress = 0;

// Background ambient stars & shooting stars
let backgroundStars = [];
let shootingStars = [];
let supernovaParticles = [];

/**
 * Initializes the background cosmic starfield.
 */
function initStarfield() {
  backgroundStars = [];
  const count = width < 600 ? 120 : 220;
  for (let i = 0; i < count; i++) {
    backgroundStars.push({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 1.5 + 0.4,
      baseAlpha: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.03 + 0.008,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.7 ? '#d8b4fe' : (Math.random() > 0.5 ? '#f472b6' : '#ffffff')
    });
  }
}

/**
 * Triggers a shooting star across the cosmic map.
 */
function spawnShootingStar() {
  if (shootingStars.length >= 2) return;
  const startX = Math.random() * width * 0.7;
  const startY = Math.random() * height * 0.4;
  const length = Math.random() * 80 + 60;
  const speed = Math.random() * 6 + 7;
  const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;

  shootingStars.push({
    x: startX,
    y: startY,
    length,
    speed,
    angle,
    alpha: 1.0,
    decay: Math.random() * 0.015 + 0.012
  });
}

/**
 * Emits romantic supernova stardust sparkle particles on star click.
 */
export function triggerStarSupernova(screenX, screenY, milestone) {
  const count = 36;
  const colors = [milestone.color, '#ffffff', '#f5c842', '#f472b6', '#a855f7'];

  // Haptic feedback if available on mobile
  if (navigator.vibrate) {
    try {
      navigator.vibrate([20, 35, 20]);
    } catch {
      // Ignored
    }
  }

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 4.5 + 1.8;
    const size = Math.random() * 3.5 + 1.2;

    supernovaParticles.push({
      x: screenX,
      y: screenY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      decay: Math.random() * 0.02 + 0.012,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      isGlyph: Math.random() > 0.8,
      glyph: ['✦', '✨', '💜', '✧'][Math.floor(Math.random() * 4)]
    });
  }
}

/**
 * Calculates responsive star positions with gravitational pull.
 */
function getStarCoordinates(index, now) {
  const m = CONSTELLATION_MILESTONES[index];
  const paddingX = Math.max(36, width * 0.06);
  const paddingY = Math.max(40, height * 0.12);
  const usableW = width - paddingX * 2;
  const usableH = height - paddingY * 2;

  let originX = paddingX + m.x * usableW;
  let originY = paddingY + m.y * usableH;

  // Gentle ambient cosmic drift
  const driftX = Math.sin(now * 0.0012 + index * 1.5) * 3;
  const driftY = Math.cos(now * 0.0015 + index * 2.1) * 3;
  originX += driftX;
  originY += driftY;

  // Gravitational Attraction towards mouse/touch pointer
  let gravX = 0;
  let gravY = 0;
  let hoverInfluence = 0;

  if (pointer.active) {
    const dx = pointer.x - originX;
    const dy = pointer.y - originY;
    const dist = Math.hypot(dx, dy);
    const gravRadius = width < 600 ? 90 : 130;

    if (dist < gravRadius && dist > 0) {
      hoverInfluence = 1 - dist / gravRadius;
      const pull = Math.pow(hoverInfluence, 1.8) * 16;
      gravX = (dx / dist) * pull;
      gravY = (dy / dist) * pull;
    }
  }

  return {
    x: originX + gravX,
    y: originY + gravY,
    originX,
    originY,
    hoverInfluence,
    milestone: m
  };
}

/**
 * Draws celestial background coordinate grids and nebula halos.
 */
function drawCosmicBackground(now) {
  // 1. Deep Space Nebula Glow Gradients
  const nebula1 = ctx.createRadialGradient(width * 0.35, height * 0.4, 10, width * 0.35, height * 0.4, width * 0.55);
  nebula1.addColorStop(0, 'rgba(107, 33, 200, 0.22)');
  nebula1.addColorStop(0.5, 'rgba(236, 72, 153, 0.08)');
  nebula1.addColorStop(1, 'rgba(4, 0, 14, 0)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, width, height);

  const nebula2 = ctx.createRadialGradient(width * 0.75, height * 0.6, 10, width * 0.75, height * 0.6, width * 0.45);
  nebula2.addColorStop(0, 'rgba(245, 200, 66, 0.12)');
  nebula2.addColorStop(0.6, 'rgba(168, 85, 247, 0.07)');
  nebula2.addColorStop(1, 'rgba(4, 0, 14, 0)');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, width, height);

  // 2. Celestial Coordinate Lines (RA/DEC Rings & Meridian Arcs)
  ctx.save();
  ctx.strokeStyle = 'rgba(216, 180, 254, 0.07)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 8]);

  // Major Celestial Equator & declination rings
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.5, width * 0.42, height * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.5, width * 0.28, height * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Galactic Axis Meridian Line
  ctx.beginPath();
  ctx.moveTo(width * 0.5, 0);
  ctx.lineTo(width * 0.5, height);
  ctx.stroke();
  ctx.restore();

  // 3. Twinkling Background Stars
  for (let i = 0; i < backgroundStars.length; i++) {
    const star = backgroundStars[i];
    star.phase += star.twinkleSpeed;
    const currentAlpha = star.baseAlpha + Math.sin(star.phase) * (star.baseAlpha * 0.5);

    ctx.save();
    ctx.fillStyle = star.color;
    ctx.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
    ctx.beginPath();
    ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Shooting Stars
  if (Math.random() < 0.008) spawnShootingStar();

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const ss = shootingStars[i];
    ss.x += Math.cos(ss.angle) * ss.speed;
    ss.y += Math.sin(ss.angle) * ss.speed;
    ss.alpha -= ss.decay;

    if (ss.alpha <= 0 || ss.x > width + 100 || ss.y > height + 100) {
      shootingStars.splice(i, 1);
      continue;
    }

    const tailX = ss.x - Math.cos(ss.angle) * ss.length;
    const tailY = ss.y - Math.sin(ss.angle) * ss.length;

    const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
    grad.addColorStop(0, `rgba(255, 255, 255, ${ss.alpha.toFixed(3)})`);
    grad.addColorStop(0.3, `rgba(244, 114, 182, ${(ss.alpha * 0.7).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draws glowing constellation lines and traveling energy photons.
 */
function drawConstellationLines(starNodes, now) {
  pulsePhotonProgress = (pulsePhotonProgress + 0.004) % 1;

  for (let i = 0; i < CONSTELLATION_EDGES.length; i++) {
    const [idxA, idxB] = CONSTELLATION_EDGES[i];
    const nodeA = starNodes[idxA];
    const nodeB = starNodes[idxB];
    if (!nodeA || !nodeB) continue;

    const isConnectedToActive = idxA === activeMilestoneIndex || idxB === activeMilestoneIndex;
    const isConnectedToHover = idxA === hoveredMilestoneIndex || idxB === hoveredMilestoneIndex;

    // Glowing base line
    ctx.save();
    const grad = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
    grad.addColorStop(0, nodeA.milestone.color);
    grad.addColorStop(1, nodeB.milestone.color);

    ctx.strokeStyle = grad;
    ctx.globalAlpha = isConnectedToActive || isConnectedToHover ? 0.85 : 0.38;
    ctx.lineWidth = isConnectedToActive || isConnectedToHover ? 2.4 : 1.4;
    ctx.shadowColor = nodeA.milestone.glowColor;
    ctx.shadowBlur = isConnectedToActive ? 14 : 6;

    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.lineTo(nodeB.x, nodeB.y);
    ctx.stroke();
    ctx.restore();

    // Traveling Energy Photon Starlight Spark
    const progress = (pulsePhotonProgress + (i * 0.28)) % 1;
    const photonX = nodeA.x + (nodeB.x - nodeA.x) * progress;
    const photonY = nodeA.y + (nodeB.y - nodeA.y) * progress;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#f5c842';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(photonX, photonY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Draws an interactive milestone star with multi-layer gravitational halo and diffraction spikes.
 */
function drawMilestoneStar(node, index, now) {
  const m = node.milestone;
  const isActive = index === activeMilestoneIndex;
  const isHovered = index === hoveredMilestoneIndex || node.hoverInfluence > 0.4;
  const baseRadius = (8 + m.magnitude * 2.5) * (width < 600 ? 0.85 : 1.0);

  // Breathing pulse
  const pulse = Math.sin(now * 0.003 + index) * 2;
  const currentRadius = (baseRadius + pulse + (isActive ? 4 : 0) + (isHovered ? 3 : 0));

  ctx.save();

  // 1. Outer Gravitational Nebula Atmosphere Glow
  const outerGlowRadius = currentRadius * (isActive ? 4.2 : (isHovered ? 3.5 : 2.5));
  const glowGrad = ctx.createRadialGradient(node.x, node.y, currentRadius * 0.3, node.x, node.y, outerGlowRadius);
  glowGrad.addColorStop(0, m.glowColor);
  glowGrad.addColorStop(0.5, m.color + '44');
  glowGrad.addColorStop(1, 'rgba(4, 0, 14, 0)');

  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(node.x, node.y, outerGlowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Diffraction 4-Point Starlight Spike Flares (Telescope Cross-Flare)
  if (isActive || isHovered) {
    const spikeLen = outerGlowRadius * 1.35;
    ctx.strokeStyle = m.color;
    ctx.globalAlpha = isActive ? 0.85 : 0.6;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    // Horizontal flare
    ctx.moveTo(node.x - spikeLen, node.y);
    ctx.lineTo(node.x + spikeLen, node.y);
    // Vertical flare
    ctx.moveTo(node.x, node.y - spikeLen);
    ctx.lineTo(node.x, node.y + spikeLen);
    ctx.stroke();
  }

  // 3. Pulsing Orbit Ring for Active/Selected Star
  if (isActive) {
    const ringRadius = currentRadius * 1.8 + Math.sin(now * 0.005) * 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Solid Inner Core & Radiant Center
  const coreGrad = ctx.createRadialGradient(node.x - 2, node.y - 2, 0, node.x, node.y, currentRadius);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.35, m.color);
  coreGrad.addColorStop(1, '#6b21c8');

  ctx.fillStyle = coreGrad;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = isActive ? 18 : 10;
  ctx.beginPath();
  ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
  ctx.fill();

  // 5. Star Index Badge / Roman-style Cosmic Number
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${width < 600 ? '9px' : '11px'} Montserrat, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.fillText(String(index + 1), node.x, node.y);

  // 6. Label above star
  ctx.fillStyle = isActive ? '#f5c842' : 'rgba(255, 255, 255, 0.85)';
  ctx.font = `500 ${width < 600 ? '10px' : '12px'} Montserrat, sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText(m.date, node.x, node.y + currentRadius + 15);

  ctx.restore();
}

/**
 * Updates and renders the supernova stardust particles.
 */
function renderSupernovaParticles() {
  for (let i = supernovaParticles.length - 1; i >= 0; i--) {
    const p = supernovaParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96; // Air resistance friction
    p.vy *= 0.96;
    p.rotation += p.rotSpeed;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      supernovaParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.isGlyph) {
      ctx.fillStyle = p.color;
      ctx.font = `${Math.round(p.size * 3.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.glyph, 0, 0);
    } else {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Updates the floating romantic inspector card / tooltip in the DOM.
 */
function updateInspectorUI() {
  const m = CONSTELLATION_MILESTONES[activeMilestoneIndex];
  if (!m) return;

  const card = container?.querySelector('#constellation-active-card');
  if (!card) return;

  card.innerHTML = `
    <div class="c-card-header">
      <div class="c-card-badge">
        <span class="c-card-icon">${m.icon}</span>
        <span class="c-card-constellation">${m.constellation}</span>
      </div>
      <span class="c-card-step">0${m.id} / 06</span>
    </div>
    <h4 class="c-card-title">${m.title}</h4>
    <p class="c-card-coords"><span>📍 Coordenadas:</span> ${m.coordinates}</p>
    <p class="c-card-desc">${m.description}</p>
    <p class="c-card-quote">${m.quote}</p>
    <div class="c-card-nav">
      <button type="button" class="c-nav-btn prev" aria-label="Marco anterior">← Anterior</button>
      <button type="button" class="c-nav-btn sparkle-btn" aria-label="Disparar poeira estelar">✦ Faiscar</button>
      <button type="button" class="c-nav-btn next" aria-label="Próximo marco">Próximo →</button>
    </div>
  `;

  // Attach nav buttons
  card.querySelector('.c-nav-btn.prev')?.addEventListener('click', () => {
    setActiveMilestone((activeMilestoneIndex - 1 + CONSTELLATION_MILESTONES.length) % CONSTELLATION_MILESTONES.length);
  });
  card.querySelector('.c-nav-btn.next')?.addEventListener('click', () => {
    setActiveMilestone((activeMilestoneIndex + 1) % CONSTELLATION_MILESTONES.length);
  });
  card.querySelector('.c-nav-btn.sparkle-btn')?.addEventListener('click', () => {
    const starNode = getStarCoordinates(activeMilestoneIndex, performance.now());
    triggerStarSupernova(starNode.x, starNode.y, m);
  });
}

/**
 * Selects a milestone star and triggers supernova animation.
 */
export function setActiveMilestone(index) {
  if (index < 0 || index >= CONSTELLATION_MILESTONES.length) return;
  activeMilestoneIndex = index;
  updateInspectorUI();

  const starNode = getStarCoordinates(index, performance.now());
  triggerStarSupernova(starNode.x, starNode.y, CONSTELLATION_MILESTONES[index]);
}

/**
 * Main 60fps Constellation Render Loop.
 */
function render(now) {
  if (!isRunning) return;

  ctx.clearRect(0, 0, width, height);

  // 1. Draw cosmic nebula & starfield
  drawCosmicBackground(now);

  // 2. Compute current star positions with physics
  const starNodes = CONSTELLATION_MILESTONES.map((_, i) => getStarCoordinates(i, now));

  // 3. Draw constellation connecting lines & light pulses
  drawConstellationLines(starNodes, now);

  // 4. Check hover status
  hoveredMilestoneIndex = -1;
  if (pointer.active) {
    for (let i = 0; i < starNodes.length; i++) {
      const dist = Math.hypot(pointer.x - starNodes[i].x, pointer.y - starNodes[i].y);
      if (dist < 26) {
        hoveredMilestoneIndex = i;
        break;
      }
    }
  }

  // 5. Draw all milestone stars
  for (let i = 0; i < starNodes.length; i++) {
    drawMilestoneStar(starNodes[i], i, now);
  }

  // 6. Draw Supernova Stardust Sparkles
  renderSupernovaParticles();

  animFrameId = requestAnimationFrame(render);
}

/**
 * Handles pointer interaction (mouse/touch) on canvas.
 */
function setupInteractions() {
  if (!canvas) return;

  const updatePointer = (clientX, clientY, isTouch = false) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.active = true;
    pointer.isTouch = isTouch;
  };

  const clearPointer = () => {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
    hoveredMilestoneIndex = -1;
  };

  // Mouse events
  canvas.addEventListener('mousemove', (e) => {
    updatePointer(e.clientX, e.clientY, false);
  }, { passive: true });

  canvas.addEventListener('mouseleave', clearPointer, { passive: true });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const starNodes = CONSTELLATION_MILESTONES.map((_, i) => getStarCoordinates(i, performance.now()));
    for (let i = 0; i < starNodes.length; i++) {
      const dist = Math.hypot(clickX - starNodes[i].x, clickY - starNodes[i].y);
      if (dist < 34) {
        setActiveMilestone(i);
        break;
      }
    }
  });

  // Touch events (smooth dragging and tapping without interrupting page scroll unnecessarily)
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      updatePointer(t.clientX, t.clientY, true);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      updatePointer(t.clientX, t.clientY, true);
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = t.clientX - rect.left;
      const touchY = t.clientY - rect.top;

      const starNodes = CONSTELLATION_MILESTONES.map((_, i) => getStarCoordinates(i, performance.now()));
      for (let i = 0; i < starNodes.length; i++) {
        const dist = Math.hypot(touchX - starNodes[i].x, touchY - starNodes[i].y);
        if (dist < 38) {
          setActiveMilestone(i);
          break;
        }
      }
    }
    clearPointer();
  }, { passive: true });
}

/**
 * Resizes canvas using ResizeObserver and devicePixelRatio.
 */
function handleResize() {
  if (!canvas || !container) return;
  const rect = container.getBoundingClientRect();
  width = rect.width || 600;
  height = Math.max(340, Math.min(520, Math.round(width * 0.65)));

  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  initStarfield();
}

/**
 * Builds the container DOM structure with canvas, HUD, and inspector card.
 */
function buildConstellationDOM() {
  container = document.getElementById('constellation-container');
  if (!container) {
    const historyShell = document.querySelector('#page-history .history-shell');
    if (!historyShell) return false;

    const section = document.createElement('section');
    section.className = 'constellation-section';
    section.innerHTML = `
      <div class="history-section-title">
        <p>mapa estelar</p>
        <h3>Constelação das Nossas Memórias</h3>
      </div>
      <div id="constellation-container" class="constellation-container"></div>
    `;
    // Insert before daily-note or at end
    const dailyNote = historyShell.querySelector('.daily-note');
    if (dailyNote) {
      historyShell.insertBefore(section, dailyNote);
    } else {
      historyShell.appendChild(section);
    }
    container = document.getElementById('constellation-container');
  }

  if (!container) return false;

  container.innerHTML = `
    <div class="constellation-hud">
      <span class="hud-pill">✦ M × A • Mapa Estelar do Nosso Amor ✦</span>
      <span class="hud-coords">Coordenadas Gravadas no Infinito</span>
    </div>
    <div class="constellation-canvas-wrap">
      <canvas id="constellation-canvas" class="constellation-canvas"></canvas>
    </div>
    <div class="constellation-inspector">
      <div id="constellation-active-card" class="constellation-active-card"></div>
    </div>
  `;

  canvas = container.querySelector('#constellation-canvas');
  if (!canvas) return false;
  ctx = canvas.getContext('2d', { alpha: true });

  return true;
}

/**
 * Starts the constellation rendering loop.
 */
export function startConstellation() {
  if (isRunning) return;
  isRunning = true;
  animFrameId = requestAnimationFrame(render);
}

/**
 * Pauses the constellation rendering loop when not visible.
 */
export function pauseConstellation() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

/**
 * Initializes the Constellation Map module.
 */
export function initConstellationMap() {
  const success = buildConstellationDOM();
  if (!success) return;

  handleResize();
  setupInteractions();
  updateInspectorUI();

  // ResizeObserver for clean responsive behavior
  const resizeObserver = new ResizeObserver(() => {
    handleResize();
  });
  resizeObserver.observe(container);

  // IntersectionObserver to only animate when in viewport on history page
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting && !document.hidden;
      if (isVisible) startConstellation();
      else pauseConstellation();
    });
  }, { threshold: 0.1 });
  observer.observe(container);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseConstellation();
    } else if (isVisible) {
      startConstellation();
    }
  });

  startConstellation();
}
