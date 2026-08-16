/**
 * visualizer.js — High-Performance Audio Reactive Wave & Beat Visualizer
 *
 * Connects to #bg-music using standard Web Audio API (AudioContext + AnalyserNode).
 * Renders 60fps floating harmonic ribbon waves with dynamic beat detection and pulses
 * CSS variables (--music-beat-scale, --music-energy) on document root for UI reactivity.
 *
 * @module Visualizer
 * @version 1.0.0
 */

// Module-level singletons & cache to ensure createMediaElementSource is called exactly once
let audioContext = null;
let sourceNode = null;
let analyserNode = null;
let freqData = null;
let timeData = null;
let isAudioConnected = false;
let isVisualizerRunning = false;
let animationFrameId = null;

// Canvas & rendering context
let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let dpr = 1;

// Beat detection state
let beatScale = 1.0;
let musicEnergy = 0.0;
let bassEnergyHistory = new Float32Array(24);
let bassHistoryIndex = 0;
let lastBeatTimestamp = 0;
let prevBassEnergy = 0;

// Particle system for beat bursts
const MAX_PARTICLES = 60;
const particles = [];

// Wave animation phases
let wavePhase1 = 0;
let wavePhase2 = 0;
let wavePhase3 = 0;

/**
 * Initializes the Web Audio API graph and attaches to #bg-music.
 * Safe to call repeatedly; uses cached sourceNode.
 */
function setupAudioGraph() {
  if (isAudioConnected) return true;

  const audioElement = document.getElementById('bg-music');
  if (!audioElement) return false;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[Visualizer] Web Audio API is not supported in this browser.');
      return false;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (!analyserNode) {
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.82;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -10;

      freqData = new Uint8Array(analyserNode.frequencyBinCount);
      timeData = new Uint8Array(analyserNode.fftSize);
    }

    if (!sourceNode) {
      // createMediaElementSource can only be called once on an HTMLMediaElement
      sourceNode = audioContext.createMediaElementSource(audioElement);
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
    }

    isAudioConnected = true;
    return true;
  } catch (err) {
    console.warn('[Visualizer] AudioContext setup fallback:', err);
    return false;
  }
}

/**
 * Safely resumes the AudioContext on user interaction if suspended.
 */
export async function resumeVisualizerAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch {
      // Ignore autoplay resume rejection
    }
  }
}

/**
 * Creates or grabs the visualizer canvas element and sets up sizing.
 */
function setupCanvas() {
  canvas = document.getElementById('audio-visualizer-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'audio-visualizer-canvas';
    canvas.className = 'audio-visualizer-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
  }

  ctx = canvas.getContext('2d', { alpha: true });
  resizeCanvas();
}

/**
 * Handles resize with devicePixelRatio for crisp 60fps rendering.
 */
function resizeCanvas() {
  if (!canvas || !ctx) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  width = rect.width || window.innerWidth;
  height = rect.height || 140;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Emits romantic stardust sparkles from wave peaks on rhythm beats.
 */
function spawnBeatParticles(peakX, peakY, intensity) {
  const count = Math.min(Math.floor(intensity * 12) + 2, 8);
  const colors = [
    'rgba(244, 114, 182, ',  // Pink
    'rgba(236, 72, 153, ',  // Magenta
    'rgba(168, 85, 247, ',  // Neon purple
    'rgba(245, 200, 66, ',  // Gold
    'rgba(255, 255, 255, '   // Starlight white
  ];

  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = (Math.random() * 2.5 + 1.2) * (0.8 + intensity);
    const colorBase = colors[Math.floor(Math.random() * colors.length)];

    particles.push({
      x: peakX + (Math.random() - 0.5) * 40,
      y: peakY + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.8 + 1.2,
      color: colorBase,
      alpha: 1.0,
      decay: Math.random() * 0.02 + 0.015,
      twinkleSpeed: Math.random() * 0.15 + 0.05,
      phase: Math.random() * Math.PI * 2
    });
  }
}

/**
 * Updates and renders stardust particles.
 */
function renderParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02; // Gentle upward drift/gravity
    p.alpha -= p.decay;
    p.phase += p.twinkleSpeed;

    if (p.alpha <= 0 || p.y < -20 || p.x < 0 || p.x > width) {
      particles.splice(i, 1);
      continue;
    }

    const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.phase));
    ctx.save();
    ctx.fillStyle = p.color + currentAlpha.toFixed(3) + ')';
    ctx.shadowColor = p.color + '0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Computes frequency analysis and beat metrics.
 */
function analyzeAudio(now) {
  let isPlaying = false;
  const audioElement = document.getElementById('bg-music');
  if (audioElement && !audioElement.paused && !audioElement.ended) {
    isPlaying = true;
  }

  let currentBass = 0;
  let currentTotal = 0;

  if (isPlaying && isAudioConnected && analyserNode && freqData) {
    analyserNode.getByteFrequencyData(freqData);
    analyserNode.getByteTimeDomainData(timeData);

    // Bass energy (bins 1 to 10: ~30Hz to ~220Hz)
    let bassSum = 0;
    const bassBins = Math.min(10, freqData.length);
    for (let i = 1; i <= bassBins; i++) {
      bassSum += freqData[i];
    }
    currentBass = bassSum / (bassBins * 255);

    // Total audio energy
    let totalSum = 0;
    for (let i = 0; i < freqData.length; i++) {
      totalSum += freqData[i];
    }
    currentTotal = totalSum / (freqData.length * 255);
  } else {
    // Gentle synthetic idle breathing oscillation when paused
    const idleOsc = 0.5 + 0.5 * Math.sin(now * 0.0018);
    currentBass = 0.05 + 0.04 * idleOsc;
    currentTotal = 0.03 + 0.02 * idleOsc;
  }

  // Rolling bass average
  bassEnergyHistory[bassHistoryIndex] = currentBass;
  bassHistoryIndex = (bassHistoryIndex + 1) % bassEnergyHistory.length;

  let bassAvg = 0;
  for (let i = 0; i < bassEnergyHistory.length; i++) {
    bassAvg += bassEnergyHistory[i];
  }
  bassAvg /= bassEnergyHistory.length;

  // Beat Delta Detection
  const bassDelta = currentBass - prevBassEnergy;
  prevBassEnergy = currentBass;

  const isBeat = isPlaying && (bassDelta > 0.06 || currentBass > bassAvg * 1.35) && currentBass > 0.28;

  if (isBeat && (now - lastBeatTimestamp > 220)) {
    lastBeatTimestamp = now;
    const hitIntensity = Math.min(1.0, currentBass * 1.4);
    beatScale = 1.0 + hitIntensity * 0.16;

    // Spawn sparkles along random high amplitude crests
    const spawnX = width * (0.2 + Math.random() * 0.6);
    const spawnY = height * 0.45;
    spawnBeatParticles(spawnX, spawnY, hitIntensity);
  } else {
    // Smooth lerp decay back to rest
    beatScale += (1.0 - beatScale) * 0.12;
  }

  // Smooth total energy lerp
  musicEnergy += (currentTotal - musicEnergy) * 0.18;

  // Update root CSS variables for vinyl disc & ambient pulsations
  document.documentElement.style.setProperty('--music-beat-scale', beatScale.toFixed(3));
  document.documentElement.style.setProperty('--music-energy', musicEnergy.toFixed(3));

  return { isPlaying, currentBass, currentTotal };
}

/**
 * Draws a flowing harmonic glow wave ribbon.
 */
function drawWaveLayer({
  baseline,
  amplitude,
  frequency,
  phase,
  strokeColor,
  fillGradient,
  lineWidth,
  audioModulation = 0
}) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height);

  const steps = 60;
  const stepWidth = width / steps;

  for (let i = 0; i <= steps; i++) {
    const x = i * stepWidth;
    const normX = i / steps;

    // Harmonic wave formula with audio time domain / frequency modulation
    let audioBump = 0;
    if (timeData && audioModulation > 0) {
      const sampleIdx = Math.floor(normX * (timeData.length - 1));
      audioBump = ((timeData[sampleIdx] - 128) / 128) * audioModulation;
    }

    // Edge dampening window so wave anchors gracefully at sides
    const edgeWindow = Math.sin(normX * Math.PI);
    const y = baseline - (
      Math.sin(normX * frequency * Math.PI * 2 + phase) * amplitude +
      Math.cos(normX * (frequency * 1.5) * Math.PI * 2 - phase * 0.8) * (amplitude * 0.45) +
      audioBump
    ) * edgeWindow;

    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.lineTo(width, height);
  ctx.closePath();

  if (fillGradient) {
    ctx.fillStyle = fillGradient;
    ctx.fill();
  }

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 12;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Main 60fps visualizer render loop.
 */
function render(now) {
  if (!isVisualizerRunning) return;

  ctx.clearRect(0, 0, width, height);

  const { isPlaying, currentBass, currentTotal } = analyzeAudio(now);

  // Advance wave phases proportional to energy and rhythm
  const speedMult = isPlaying ? (1.0 + currentTotal * 2.2) : 0.6;
  wavePhase1 += 0.014 * speedMult;
  wavePhase2 += 0.021 * speedMult;
  wavePhase3 += 0.028 * speedMult;

  const baseHeight = height * 0.82;
  const dynamicAmp = (isPlaying ? (22 + currentBass * 55) : 10) * (width < 640 ? 0.7 : 1.0);

  // 1. Layer 1: Deep Cosmic Purple Aurora Wave (Background Glow)
  const grad1 = ctx.createLinearGradient(0, height * 0.3, 0, height);
  grad1.addColorStop(0, `rgba(107, 33, 200, ${(0.18 + musicEnergy * 0.25).toFixed(3)})`);
  grad1.addColorStop(1, 'rgba(4, 0, 14, 0)');

  drawWaveLayer({
    baseline: baseHeight,
    amplitude: dynamicAmp * 0.9,
    frequency: 1.4,
    phase: wavePhase1,
    strokeColor: `rgba(168, 85, 247, ${(0.45 + musicEnergy * 0.4).toFixed(3)})`,
    fillGradient: grad1,
    lineWidth: 2,
    audioModulation: dynamicAmp * 0.5
  });

  // 2. Layer 2: Radiant Romantic Magenta Wave
  const grad2 = ctx.createLinearGradient(0, height * 0.2, 0, height);
  grad2.addColorStop(0, `rgba(236, 72, 153, ${(0.22 + musicEnergy * 0.3).toFixed(3)})`);
  grad2.addColorStop(1, 'rgba(13, 0, 32, 0)');

  drawWaveLayer({
    baseline: baseHeight - 4,
    amplitude: dynamicAmp * 1.15,
    frequency: 2.2,
    phase: wavePhase2,
    strokeColor: `rgba(244, 114, 182, ${(0.65 + musicEnergy * 0.35).toFixed(3)})`,
    fillGradient: grad2,
    lineWidth: 2.5,
    audioModulation: dynamicAmp * 0.75
  });

  // 3. Layer 3: Neon Starlight Crest (Golden Pink Ribbon)
  const grad3 = ctx.createLinearGradient(0, height * 0.1, 0, height);
  grad3.addColorStop(0, `rgba(245, 200, 66, ${(0.15 + musicEnergy * 0.25).toFixed(3)})`);
  grad3.addColorStop(1, 'rgba(0, 0, 0, 0)');

  drawWaveLayer({
    baseline: baseHeight - 8,
    amplitude: dynamicAmp * 0.7,
    frequency: 3.1,
    phase: wavePhase3,
    strokeColor: `rgba(255, 255, 255, ${(0.85 + musicEnergy * 0.15).toFixed(3)})`,
    fillGradient: grad3,
    lineWidth: 1.5,
    audioModulation: dynamicAmp * 0.9
  });

  // 4. Render Beat Stardust Sparkles
  renderParticles();

  animationFrameId = requestAnimationFrame(render);
}

/**
 * Starts the visualizer animation loop.
 */
export function startVisualizer() {
  if (isVisualizerRunning) return;
  setupAudioGraph();
  isVisualizerRunning = true;
  animationFrameId = requestAnimationFrame(render);
}

/**
 * Pauses the visualizer animation loop to conserve battery/CPU.
 */
export function pauseVisualizer() {
  isVisualizerRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // Reset CSS variables cleanly on stop
  document.documentElement.style.setProperty('--music-beat-scale', '1');
  document.documentElement.style.setProperty('--music-energy', '0');
}

/**
 * Returns current audio metrics.
 */
export function getVisualizerState() {
  return {
    beatScale,
    musicEnergy,
    isAudioConnected,
    isVisualizerRunning
  };
}

/**
 * Initializes the visualizer module, DOM elements, and event listeners.
 */
export function initVisualizer() {
  setupCanvas();

  const bgMusic = document.getElementById('bg-music');
  if (bgMusic) {
    bgMusic.addEventListener('play', () => {
      setupAudioGraph();
      resumeVisualizerAudio();
      startVisualizer();
    });

    bgMusic.addEventListener('pause', () => {
      // Keep visualizer gently alive for smooth fade, will idle softly
    });
  }

  // Resume audio context on first user interaction gesture
  const userGestures = ['click', 'touchstart', 'pointerdown', 'keydown'];
  const handleGesture = () => {
    setupAudioGraph();
    resumeVisualizerAudio();
    userGestures.forEach(ev => window.removeEventListener(ev, handleGesture));
  };
  userGestures.forEach(ev => window.addEventListener(ev, handleGesture, { passive: true, once: true }));

  // Handle visibility changes to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseVisualizer();
    } else {
      startVisualizer();
    }
  });

  // Handle window resizing
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Initial startup
  startVisualizer();
}
