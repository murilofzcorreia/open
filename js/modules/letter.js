import { startMusic } from './music.js';

const secretLetterText = `Se você chegou até aqui, é porque eu queria te entregar mais do que uma pergunta bonita.

Queria te oferecer um pedacinho do meu coração, transformado em detalhe, cuidado e carinho, do jeitinho que você merece.

Desde que você entrou na minha vida, os meus dias ficaram mais leves, mais bonitos e muito mais felizes. O seu sorriso acalma, o seu jeito encanta, e a sua presença faz tudo ganhar mais sentido.

Eu quero continuar colecionando memórias ao seu lado: das mais simples, como uma conversa tranquila, às mais especiais, como este momento.

Se esta surpresa foi feita com carinho, é porque você é, sem dúvida, uma das partes mais bonitas da minha vida.

E, sinceramente, o que eu mais quero é que este seja apenas o começo de tudo o que ainda vamos viver juntos.`;

/* ── DOM ELEMENT REFERENCES ── */
let letterModal = null;
let letterBackdrop = null;
let closeLetterBtn = null;
let letterStage = null;
let envelopeScene = null;
let envelope3D = null;
let envelopeFlap = null;
let waxSealContainer = null;
let waxSealBtn = null;
let particleCanvas = null;
let particleCtx = null;
let letterPaper = null;
let letterBody = null;
let letterSkipBtn = null;
let letterSoundToggleBtn = null;
let letterReplayBtn = null;
let letterActionBar = null;
let soundIconOn = null;
let soundIconOff = null;

/* ── STATE VARIABLES ── */
let letterTypingTimer = null;
let letterTypingIndex = 0;
let letterWasTyped = false;
let isEnvelopeOpened = false;
let isBreakingSeal = false;
let isSoundEnabled = true;
let audioCtx = null;
let particleRafId = null;

/* ══════════════════════════════════════════════════════════════
   1. WEB AUDIO API SYNTHESIZER (ZERO EXTERNAL DEPENDENCIES)
══════════════════════════════════════════════════════════════ */
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a realistic tactile wax cracking & shattering sound effect
 */
function playWaxBreakSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Noise burst for wax fracture snap
    const bufferSize = Math.floor(ctx.sampleRate * 0.09);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noiseNode.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    noiseNode.start(now);

    // 2. Dual resonant crystalline harmonics for wax break pop
    const frequencies = [680, 1150];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  } catch {
    // Audio is enhancement, fail gracefully
  }
}

/**
 * Plays a smooth parchment sliding swoosh
 */
function playPaperSlideSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.frequency.linearRampToValueAtTime(1100, now + 0.18);
    filter.frequency.linearRampToValueAtTime(450, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
  } catch {
    // Graceful fallback
  }
}

/**
 * Plays a romantic, gentle music box chime for typewriter letters
 */
const pentatonicChimes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
let lastChimeTime = 0;

function playTypewriterChime(charIndex, char) {
  if (!isSoundEnabled) return;
  if (char === ' ' || char === '\n') return;

  const nowMs = performance.now();
  if (nowMs - lastChimeTime < 45) return; // Prevent audio congestion
  lastChimeTime = nowMs;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pick melodious harmonic note based on letter / index
    const noteFreq = pentatonicChimes[charIndex % pentatonicChimes.length];
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(noteFreq, now);

    // Subtle sweet overtone
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(noteFreq * 2, now);

    const baseGain = char === '.' || char === '!' ? 0.045 : 0.024;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(baseGain, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.17);
    subOsc.stop(now + 0.17);
  } catch {
    // Graceful fallback
  }
}

/* ══════════════════════════════════════════════════════════════
   2. 60FPS WAX SEAL PARTICLE SHATTER PHYSICS ENGINE
══════════════════════════════════════════════════════════════ */
class Particle {
  constructor(originX, originY, type) {
    this.type = type; // 'shard', 'spark', 'heart'
    this.x = originX;
    this.y = originY;
    
    // Physics properties
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'spark' 
      ? 4 + Math.random() * 8 
      : type === 'shard'
      ? 2.5 + Math.random() * 6.5
      : 1.5 + Math.random() * 3.5;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - (type === 'heart' ? 2.5 : 1.5); // Upward blast bias
    this.gravity = type === 'heart' ? -0.04 : type === 'spark' ? 0.22 : 0.36;
    this.drag = 0.982;
    
    // Aesthetics
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.25;
    this.size = type === 'shard' ? 4 + Math.random() * 9 : type === 'spark' ? 2 + Math.random() * 4 : 10 + Math.random() * 6;
    this.opacity = 1;
    this.fadeRate = type === 'spark' ? 0.024 + Math.random() * 0.02 : 0.014 + Math.random() * 0.012;
    
    // Shard colors: golden-purple wax palette
    const colors = [
      '#a855f7', '#9333ea', '#c084fc', '#f472b6', 
      '#fbbf24', '#f59e0b', '#d97706', '#e0aaff'
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    // Polygon vertices for realistic wax chunks
    if (type === 'shard') {
      this.vertexCount = 3 + Math.floor(Math.random() * 3);
      this.vertices = [];
      for (let i = 0; i < this.vertexCount; i++) {
        const a = (i / this.vertexCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const r = this.size * (0.6 + Math.random() * 0.6);
        this.vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= this.drag;
    this.rotation += this.rotSpeed;
    this.opacity = Math.max(0, this.opacity - this.fadeRate);
    return this.opacity > 0;
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity;

    if (this.type === 'shard') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
      for (let i = 1; i < this.vertices.length; i++) {
        ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // Golden foil hairline highlight on shards
      ctx.strokeStyle = 'rgba(255, 235, 180, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (this.type === 'spark') {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'heart') {
      ctx.font = `${this.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💜', 0, 0);
    }

    ctx.restore();
  }
}

function triggerWaxShatterParticles(originX, originY) {
  if (!particleCanvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = particleCanvas.getBoundingClientRect();
  particleCanvas.width = rect.width * dpr;
  particleCanvas.height = rect.height * dpr;
  particleCtx = particleCanvas.getContext('2d');
  particleCtx.scale(dpr, dpr);

  const particles = [];
  const shardCount = 38;
  const sparkCount = 28;
  const heartCount = 6;

  for (let i = 0; i < shardCount; i++) {
    particles.push(new Particle(originX, originY, 'shard'));
  }
  for (let i = 0; i < sparkCount; i++) {
    particles.push(new Particle(originX, originY, 'spark'));
  }
  for (let i = 0; i < heartCount; i++) {
    particles.push(new Particle(originX, originY, 'heart'));
  }

  cancelAnimationFrame(particleRafId);

  function renderLoop() {
    particleCtx.clearRect(0, 0, rect.width, rect.height);
    let activeParticles = 0;

    for (let i = 0; i < particles.length; i++) {
      if (particles[i].update()) {
        particles[i].draw(particleCtx);
        activeParticles++;
      }
    }

    if (activeParticles > 0) {
      particleRafId = requestAnimationFrame(renderLoop);
    } else {
      particleCtx.clearRect(0, 0, rect.width, rect.height);
    }
  }

  particleRafId = requestAnimationFrame(renderLoop);
}

/* ══════════════════════════════════════════════════════════════
   3. TYPEWRITER & LETTER CONTROLS
══════════════════════════════════════════════════════════════ */
function renderLetterTyping() {
  if (!letterBody) return;
  const visible = secretLetterText.slice(0, letterTypingIndex);
  letterBody.innerHTML = `${visible.replace(/\n/g, '<br>')}<span class="letter-caret"></span>`;
}

function showFinishedLetter() {
  clearTimeout(letterTypingTimer);
  letterTypingTimer = null;
  letterWasTyped = true;

  if (letterBody) {
    letterBody.innerHTML = secretLetterText.replace(/\n/g, '<br>');
  }
  if (letterSkipBtn) {
    letterSkipBtn.style.display = 'none';
  }
  if (letterActionBar) {
    letterActionBar.classList.add('visible');
  }
}

function typeLetter() {
  clearTimeout(letterTypingTimer);
  renderLetterTyping();

  if (letterTypingIndex >= secretLetterText.length) {
    showFinishedLetter();
    return;
  }

  const nextChar = secretLetterText[letterTypingIndex];
  playTypewriterChime(letterTypingIndex, nextChar);
  letterTypingIndex++;

  // Organic typing cadence
  let delay = 24 + Math.floor(Math.random() * 8);
  if (nextChar === '\n') {
    delay = 260;
  } else if (nextChar === '.' || nextChar === '!') {
    delay = 240;
  } else if (nextChar === ',') {
    delay = 110;
  }

  letterTypingTimer = setTimeout(typeLetter, delay);
}

export function skipLetterTyping() {
  letterTypingIndex = secretLetterText.length;
  showFinishedLetter();
}

function replayLetterTyping() {
  letterTypingIndex = 0;
  letterWasTyped = false;
  if (letterActionBar) letterActionBar.classList.remove('visible');
  if (letterSkipBtn) letterSkipBtn.style.display = 'inline-flex';
  if (letterBody) letterBody.innerHTML = '';
  if (letterPaper) {
    const inner = letterPaper.querySelector('.letter-paper-inner');
    if (inner) inner.scrollTop = 0;
  }
  setTimeout(typeLetter, 300);
}

function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  if (soundIconOn && soundIconOff) {
    soundIconOn.style.display = isSoundEnabled ? 'inline' : 'none';
    soundIconOff.style.display = isSoundEnabled ? 'none' : 'inline';
  }
  if (letterSoundToggleBtn) {
    letterSoundToggleBtn.setAttribute('aria-pressed', isSoundEnabled ? 'true' : 'false');
  }
}

/* ══════════════════════════════════════════════════════════════
   4. 3D ORIGAMI WAX SEAL BREAK & ENVELOPE OPENING
══════════════════════════════════════════════════════════════ */
function handleWaxSealBreak(event) {
  if (isBreakingSeal || isEnvelopeOpened) return;
  isBreakingSeal = true;

  // 1. Haptic Vibration (Tactile Mechanical Break Pattern)
  if (navigator.vibrate) {
    try {
      navigator.vibrate([35, 40, 90, 40, 140]);
    } catch {
      // Ignore vibration error
    }
  }

  // 2. Play Synthesized Wax Breaking Audio
  playWaxBreakSound();

  // 3. Trigger Particle Shatter Explosion
  if (waxSealBtn && particleCanvas) {
    const sealRect = waxSealBtn.getBoundingClientRect();
    const canvasRect = particleCanvas.getBoundingClientRect();
    const originX = sealRect.left + sealRect.width / 2 - canvasRect.left;
    const originY = sealRect.top + sealRect.height / 2 - canvasRect.top;
    
    waxSealBtn.classList.add('shattered');
    triggerWaxShatterParticles(originX, originY);
  }

  // 4. Envelope 3D Origami Flap Opening
  if (envelope3D) {
    envelope3D.classList.add('breaking');
    
    // Step A: Flap unfolds 180 degrees in 3D
    setTimeout(() => {
      envelope3D.classList.add('opened');
      playPaperSlideSound();
    }, 420);

    // Step B: Letter Paper emerges and expands into reading mode
    setTimeout(() => {
      envelope3D.classList.add('reading');
      isEnvelopeOpened = true;
      isBreakingSeal = false;

      // Step C: Start Typewriter Effect
      if (letterWasTyped) {
        showFinishedLetter();
      } else {
        letterTypingIndex = 0;
        if (letterBody) letterBody.innerHTML = '';
        if (letterSkipBtn) letterSkipBtn.style.display = 'inline-flex';
        setTimeout(typeLetter, 480);
      }
    }, 1100);
  }
}

/* ══════════════════════════════════════════════════════════════
   5. MODAL INITIALIZATION & LIFECYCLE
══════════════════════════════════════════════════════════════ */
function ensureLetterModal() {
  if (letterModal && document.body.contains(letterModal)) return;

  const template = document.getElementById('letter-modal-template');
  if (!template) return;

  document.body.insertAdjacentHTML('beforeend', template.innerHTML.trim());

  // Cache elements
  letterModal = document.getElementById('letter-modal');
  letterBackdrop = document.getElementById('letter-backdrop');
  closeLetterBtn = document.getElementById('close-letter');
  letterStage = document.getElementById('letter-stage');
  envelopeScene = document.getElementById('envelope-scene');
  envelope3D = document.getElementById('envelope-3d');
  envelopeFlap = document.getElementById('envelope-flap');
  waxSealContainer = document.getElementById('wax-seal-container');
  waxSealBtn = document.getElementById('wax-seal');
  particleCanvas = document.getElementById('wax-particle-canvas');
  letterPaper = document.getElementById('letter-paper');
  letterBody = document.getElementById('letter-body');
  letterSkipBtn = document.getElementById('letter-skip');
  letterSoundToggleBtn = document.getElementById('letter-sound-toggle');
  letterReplayBtn = document.getElementById('letter-replay-btn');
  letterActionBar = document.getElementById('letter-action-bar');
  soundIconOn = document.getElementById('sound-icon-on');
  soundIconOff = document.getElementById('sound-icon-off');

  // Event Listeners
  if (closeLetterBtn) closeLetterBtn.addEventListener('click', closeLetter);
  if (letterBackdrop) letterBackdrop.addEventListener('click', closeLetter);
  if (waxSealBtn) {
    waxSealBtn.addEventListener('click', handleWaxSealBreak);
    waxSealBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleWaxSealBreak(e);
    });
  }
  if (letterSkipBtn) letterSkipBtn.addEventListener('click', skipLetterTyping);
  if (letterSoundToggleBtn) letterSoundToggleBtn.addEventListener('click', toggleSound);
  if (letterReplayBtn) letterReplayBtn.addEventListener('click', replayLetterTyping);

  // 3D Parallax Tilt Effect on Desktop / Mouse
  if (letterStage) {
    letterStage.addEventListener('pointermove', (e) => {
      if (isEnvelopeOpened || !envelope3D) return;
      const rect = letterStage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      envelope3D.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
    });

    letterStage.addEventListener('pointerleave', () => {
      if (!envelope3D || isEnvelopeOpened) return;
      envelope3D.style.transform = '';
    });
  }
}

export function openLetter() {
  ensureLetterModal();
  startMusic();
  if (!letterModal) return;

  // Reset state for new opening session
  isBreakingSeal = false;
  isEnvelopeOpened = false;
  if (envelope3D) {
    envelope3D.classList.remove('breaking', 'opened', 'reading');
    envelope3D.style.transform = '';
  }
  if (waxSealBtn) {
    waxSealBtn.classList.remove('shattered');
  }
  if (letterActionBar) {
    letterActionBar.classList.remove('visible');
  }

  letterModal.classList.add('open');
  letterModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

export function closeLetter() {
  if (!letterModal) return;
  const photoLightbox = document.getElementById('photo-lightbox');

  letterModal.classList.remove('open');
  letterModal.setAttribute('aria-hidden', 'true');
  clearTimeout(letterTypingTimer);
  letterTypingTimer = null;
  cancelAnimationFrame(particleRafId);

  setTimeout(() => {
    if (letterModal && !letterModal.classList.contains('open')) {
      letterModal.remove();
      letterModal = null;
      letterBackdrop = null;
      closeLetterBtn = null;
      letterStage = null;
      envelopeScene = null;
      envelope3D = null;
      envelopeFlap = null;
      waxSealContainer = null;
      waxSealBtn = null;
      particleCanvas = null;
      particleCtx = null;
      letterPaper = null;
      letterBody = null;
      letterSkipBtn = null;
      letterSoundToggleBtn = null;
      letterReplayBtn = null;
      letterActionBar = null;
      soundIconOn = null;
      soundIconOff = null;
    }
  }, 450);

  if (!photoLightbox || !photoLightbox.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

export function initLetterModule() {
  const openLetterBtn = document.getElementById('open-letter');
  if (openLetterBtn) {
    openLetterBtn.addEventListener('click', openLetter);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && letterModal && letterModal.classList.contains('open')) {
      closeLetter();
    }
  });
}

