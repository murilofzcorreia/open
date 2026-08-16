import { initWebGLShader } from './modules/shader.js';
import { initCursorTrail } from './modules/cursor.js';
import { initFloatingEmojis, initRippleEffect } from './modules/particles.js';
import { initMusicModule } from './modules/music.js';
import { initVisualizer } from './modules/visualizer.js';
import { initConstellationMap } from './modules/constellation.js';
import { initRouter } from './modules/router.js';
import { initEvasionModule } from './modules/evasion.js';
import { initLightboxModule } from './modules/lightbox.js';
import { initLetterModule } from './modules/letter.js';
import { initPWA } from './modules/pwa.js';
import { initInteractiveFeatures } from './modules/features.js';
import { initPolaroidCards } from './modules/polaroid.js';
import { initStoriesModule } from './modules/stories.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Critical visual & routing path
  initWebGLShader();
  initMusicModule();
  initVisualizer();
  initRouter();
  initEvasionModule();
  initLightboxModule();
  initLetterModule();
  initStoriesModule();

  // 2. Secondary effects & input trails
  initCursorTrail();
  initFloatingEmojis();
  initRippleEffect();
  initConstellationMap();
  initInteractiveFeatures();
  initPolaroidCards();

  // 3. Defer non-critical sorting and PWA registration to idle time
  const runIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
  runIdle(() => {
    initPWA();

    const gallery = document.getElementById('history-gallery');
    if (gallery) {
      const cards = Array.from(gallery.querySelectorAll('.memory-card'));
      if (cards.some(c => c.dataset.date)) {
        cards
          .sort((a, b) => new Date(a.dataset.date || 0) - new Date(b.dataset.date || 0))
          .forEach(card => gallery.appendChild(card));
      }
    }
  });
});
