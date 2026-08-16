/**
 * shader.js — WebGL Dynamic Cosmic Atmosphere Shaders
 *
 * Implements procedural FBM nebula & starfield simulation with dynamic
 * uniform palette interpolation and 1.2s smooth transitions between
 * 3 cosmic atmospheres:
 *   1. 'nebula'   — Romantic Violet & Magenta (Default)
 *   2. 'sunset'   — Amber Gold & Warm Sunset Rose
 *   3. 'midnight' — Deep Midnight Sapphire & Electric Cyan
 *
 * Features:
 *   - 60fps GPU-efficient uniform color grading
 *   - Zero garbage collection overhead in the render loop
 *   - Floating glassmorphic theme switcher bar (.cosmic-theme-bar)
 *   - LocalStorage persistence and exported setCosmicTheme API
 *
 * @module Shader
 */

const STORAGE_KEY = 'cosmic_atmosphere_theme';
const TRANSITION_DURATION = 1200; // 1.2 seconds smooth lerp

export const COLOR_KEYS = ['bg', 'deep', 'mid', 'high', 'accent', 'star'];

export const COSMIC_THEMES = {
  nebula: {
    name: 'Nebula',
    label: 'Nebula',
    subtitle: 'Violeta & Magenta',
    bg: new Float32Array([0.04, 0.00, 0.08]),
    deep: new Float32Array([0.22, 0.06, 0.45]),
    mid: new Float32Array([0.55, 0.08, 0.55]),
    high: new Float32Array([0.80, 0.25, 0.65]),
    accent: new Float32Array([0.25, 0.06, 0.45]),
    star: new Float32Array([0.70, 0.50, 1.00])
  },
  sunset: {
    name: 'Sunset',
    label: 'Sunset',
    subtitle: 'Âmbar & Rosa Quente',
    bg: new Float32Array([0.08, 0.02, 0.04]),
    deep: new Float32Array([0.38, 0.08, 0.18]),
    mid: new Float32Array([0.75, 0.28, 0.15]),
    high: new Float32Array([0.98, 0.72, 0.25]),
    accent: new Float32Array([0.85, 0.35, 0.18]),
    star: new Float32Array([1.00, 0.88, 0.65])
  },
  midnight: {
    name: 'Midnight',
    label: 'Midnight',
    subtitle: 'Safira & Ciano Elétrico',
    bg: new Float32Array([0.01, 0.03, 0.09]),
    deep: new Float32Array([0.04, 0.14, 0.38]),
    mid: new Float32Array([0.06, 0.35, 0.58]),
    high: new Float32Array([0.20, 0.80, 0.90]),
    accent: new Float32Array([0.10, 0.45, 0.75]),
    star: new Float32Array([0.60, 0.90, 1.00])
  }
};

let activeThemeName = 'nebula';
let isTransitioning = false;
let transitionStartTime = 0;

// Current interpolated colors sent to WebGL uniforms (preallocated)
const currentColors = {
  bg: new Float32Array([0.04, 0.00, 0.08]),
  deep: new Float32Array([0.22, 0.06, 0.45]),
  mid: new Float32Array([0.55, 0.08, 0.55]),
  high: new Float32Array([0.80, 0.25, 0.65]),
  accent: new Float32Array([0.25, 0.06, 0.45]),
  star: new Float32Array([0.70, 0.50, 1.00])
};

// Snapshot taken at transition start (preallocated)
const startColors = {
  bg: new Float32Array(3),
  deep: new Float32Array(3),
  mid: new Float32Array(3),
  high: new Float32Array(3),
  accent: new Float32Array(3),
  star: new Float32Array(3)
};

// Target theme colors to lerp towards
let targetTheme = COSMIC_THEMES.nebula;

/**
 * Retrieve persisted theme name from localStorage with fallback to 'nebula'
 */
function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && COSMIC_THEMES[saved]) {
      return saved;
    }
  } catch (e) {
    // localStorage might be unavailable in restricted environments
  }
  return 'nebula';
}

/**
 * Updates UI buttons and dataset attributes across the document
 * @param {string} themeName
 */
function updateThemeUI(themeName) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.cosmicTheme = themeName;
  const bar = document.querySelector('.cosmic-theme-bar');
  if (!bar) return;
  const buttons = bar.querySelectorAll('.cosmic-theme-btn');
  buttons.forEach(btn => {
    const isCurrent = btn.dataset.theme === themeName;
    btn.classList.toggle('active', isCurrent);
    btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
  });
}

/**
 * Switch cosmic atmosphere with 1.2s smooth uniform interpolation
 * and localStorage persistence.
 *
 * @param {'nebula'|'sunset'|'midnight'} themeName
 */
export function setCosmicTheme(themeName) {
  const targetName = COSMIC_THEMES[themeName] ? themeName : 'nebula';
  const theme = COSMIC_THEMES[targetName];
  activeThemeName = targetName;
  targetTheme = theme;

  try {
    localStorage.setItem(STORAGE_KEY, targetName);
  } catch (e) {}

  updateThemeUI(targetName);

  // Snapshot current colors as the interpolation origin
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    const key = COLOR_KEYS[i];
    startColors[key][0] = currentColors[key][0];
    startColors[key][1] = currentColors[key][1];
    startColors[key][2] = currentColors[key][2];
  }

  transitionStartTime = performance.now();
  isTransitioning = true;
}

/**
 * Return currently active cosmic theme name
 * @returns {string}
 */
export function getCosmicTheme() {
  return activeThemeName;
}

/**
 * Build and attach the floating glassmorphic theme switcher bar
 * @param {string} initialTheme
 */
function initCosmicThemeSwitcher(initialTheme) {
  let bar = document.querySelector('.cosmic-theme-bar');
  if (!bar) {
    bar = document.createElement('nav');
    bar.className = 'cosmic-theme-bar';
    bar.id = 'cosmic-theme-bar';
    bar.setAttribute('aria-label', 'Atmosfera Cósmica');
    bar.innerHTML = `
      <button class="cosmic-theme-btn" data-theme="nebula" type="button" aria-label="Atmosfera Nebula: Violeta &amp; Magenta" title="Nebula">
        <span class="cosmic-theme-swatch swatch-nebula" aria-hidden="true"></span>
        <span class="cosmic-theme-title">Nebula</span>
      </button>
      <button class="cosmic-theme-btn" data-theme="sunset" type="button" aria-label="Atmosfera Sunset: Âmbar Dourado &amp; Rosa" title="Sunset">
        <span class="cosmic-theme-swatch swatch-sunset" aria-hidden="true"></span>
        <span class="cosmic-theme-title">Sunset</span>
      </button>
      <button class="cosmic-theme-btn" data-theme="midnight" type="button" aria-label="Atmosfera Midnight: Safira &amp; Ciano Elétrico" title="Midnight">
        <span class="cosmic-theme-swatch swatch-midnight" aria-hidden="true"></span>
        <span class="cosmic-theme-title">Midnight</span>
      </button>
    `;
    document.body.appendChild(bar);
  }

  if (!bar.dataset.initialized) {
    bar.dataset.initialized = 'true';
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.cosmic-theme-btn');
      if (!btn) return;
      e.preventDefault();
      const theme = btn.dataset.theme;
      if (theme) {
        setCosmicTheme(theme);
      }
    });
  }

  updateThemeUI(initialTheme);
}

/**
 * Initialize WebGL canvas shader with dynamic uniform palette interpolation
 */
export function initWebGLShader() {
  const canvas = document.getElementById('gl-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { powerPreference: 'low-power', alpha: false }) ||
             canvas.getContext('experimental-webgl', { powerPreference: 'low-power', alpha: false });
  if (!gl) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize theme from persistence
  const initialTheme = getSavedTheme();
  activeThemeName = initialTheme;
  targetTheme = COSMIC_THEMES[initialTheme];
  for (let i = 0; i < COLOR_KEYS.length; i++) {
    const k = COLOR_KEYS[i];
    currentColors[k][0] = targetTheme[k][0];
    currentColors[k][1] = targetTheme[k][1];
    currentColors[k][2] = targetTheme[k][2];
    startColors[k][0] = targetTheme[k][0];
    startColors[k][1] = targetTheme[k][1];
    startColors[k][2] = targetTheme[k][2];
  }
  isTransitioning = false;

  initCosmicThemeSwitcher(initialTheme);

  const vSrc = `
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos,0,1); }
  `;
  const fSrc = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec3 u_col_bg;
    uniform vec3 u_col_deep;
    uniform vec3 u_col_mid;
    uniform vec3 u_col_high;
    uniform vec3 u_col_accent;
    uniform vec3 u_col_star;

    vec2 hash2(vec2 p){
      p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(dot(hash2(i+vec2(0,0)),f-vec2(0,0)),
                     dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
                 mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),
                     dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
    }
    float fbm(vec2 p){
      float v=0.0,a=0.5;
      for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.1; a*=0.5; }
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.y = 1.0 - uv.y;
      vec2 centered = uv - 0.5;
      float t = u_time * 0.16;

      vec2 mouse = u_mouse / u_res;
      mouse.y = 1.0 - mouse.y;
      float md = length(centered - (mouse - 0.5)) * 2.0;
      float mInfluence = exp(-md * md * 3.0) * 0.15;

      vec2 q = vec2(fbm(uv + t*0.3), fbm(uv + 1.7 + t*0.25));
      vec2 r = vec2(fbm(uv + 1.0*q + 0.5 + t*0.15), fbm(uv + 1.0*q + 0.3 + t*0.12));
      float f = fbm(uv + r + mInfluence);

      vec3 col = mix(
        u_col_bg,
        u_col_deep,
        clamp(f*f*4.0, 0.0, 1.0)
      );
      col = mix(col, u_col_mid, clamp(length(q)*0.8, 0.0, 1.0));
      col = mix(col, u_col_high, clamp(r.x*r.x*0.6, 0.0, 1.0));

      float vign = 1.0 - smoothstep(0.35, 1.0, length(centered)*1.6);
      col *= vign * 0.85;

      col += u_col_accent * (1.0 - smoothstep(0.0, 0.4, md)) * 0.25;

      vec2 starUV = uv * 55.0;
      vec2 si = floor(starUV); vec2 sf = fract(starUV);
      float star = step(0.988, fract(sin(dot(si, vec2(127.1,311.7)))*43758.55));
      star *= smoothstep(0.5, 0.0, length(sf - 0.5));
      star *= 0.5 + 0.5*sin(u_time + dot(si, vec2(5.3,7.1)));
      col += u_col_star * star * 0.8;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(vSrc, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(fSrc, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes       = gl.getUniformLocation(prog, 'u_res');
  const uTime      = gl.getUniformLocation(prog, 'u_time');
  const uMouse     = gl.getUniformLocation(prog, 'u_mouse');
  const uColBg     = gl.getUniformLocation(prog, 'u_col_bg');
  const uColDeep   = gl.getUniformLocation(prog, 'u_col_deep');
  const uColMid    = gl.getUniformLocation(prog, 'u_col_mid');
  const uColHigh   = gl.getUniformLocation(prog, 'u_col_high');
  const uColAccent = gl.getUniformLocation(prog, 'u_col_accent');
  const uColStar   = gl.getUniformLocation(prog, 'u_col_star');

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let tiltX = 0, tiltY = 0;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('deviceorientation', e => {
    if (e.gamma === null || e.beta === null) return;
    tiltX += (Math.max(-35, Math.min(35, e.gamma)) / 35 - tiltX) * 0.08;
    tiltY += (Math.max(-35, Math.min(35, e.beta - 45)) / 35 - tiltY) * 0.08;
  }, { passive: true });

  const maxDeviceScale = window.innerWidth < 600 ? 1.25 : 1.5;
  let renderScale = Math.min(window.devicePixelRatio || 1, maxDeviceScale);
  if (prefersReducedMotion) renderScale = 1.0;

  function resize() {
    canvas.width  = Math.floor(window.innerWidth * renderScale);
    canvas.height = Math.floor(window.innerHeight * renderScale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let paused = false;
  let lastTime = 0;
  let smoothFrameTime = 22;
  let lastScaleAdjustment = 0;
  const targetInterval = prefersReducedMotion ? (1000 / 30) : (1000 / 45);

  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) {
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    paused = true;
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    initWebGLShader();
  }, false);

  function loop(t) {
    if (paused) return;
    if (t - lastTime >= targetInterval) {
      const frameTime = t - lastTime;
      smoothFrameTime += (frameTime - smoothFrameTime) * 0.08;
      lastTime = t;
      if (t - lastScaleAdjustment > 2000) {
        const nextScale = smoothFrameTime > 32 ? Math.max(0.75, renderScale - 0.15) : smoothFrameTime < 23 ? Math.min(maxDeviceScale, renderScale + 0.1) : renderScale;
        if (Math.abs(nextScale - renderScale) > 0.05) {
          renderScale = nextScale;
          resize();
        }
        lastScaleAdjustment = t;
      }

      // Smooth color lerping (1.2s duration)
      if (isTransitioning) {
        const elapsed = performance.now() - transitionStartTime;
        const progress = Math.min(1.0, Math.max(0.0, elapsed / TRANSITION_DURATION));
        // Smoothstep cubic easing: 3p^2 - 2p^3
        const ease = progress * progress * (3.0 - 2.0 * progress);

        for (let i = 0; i < COLOR_KEYS.length; i++) {
          const k = COLOR_KEYS[i];
          const s = startColors[k];
          const tg = targetTheme[k];
          const c = currentColors[k];
          c[0] = s[0] + (tg[0] - s[0]) * ease;
          c[1] = s[1] + (tg[1] - s[1]) * ease;
          c[2] = s[2] + (tg[2] - s[2]) * ease;
        }

        if (progress >= 1.0) {
          isTransitioning = false;
        }
      }

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t * 0.001);
      gl.uniform2f(uMouse, mouseX + tiltX * window.innerWidth * 0.15, mouseY + tiltY * window.innerHeight * 0.15);

      gl.uniform3fv(uColBg, currentColors.bg);
      gl.uniform3fv(uColDeep, currentColors.deep);
      gl.uniform3fv(uColMid, currentColors.mid);
      gl.uniform3fv(uColHigh, currentColors.high);
      gl.uniform3fv(uColAccent, currentColors.accent);
      gl.uniform3fv(uColStar, currentColors.star);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
