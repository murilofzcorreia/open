import { initWebGLShader } from './modules/shader.js';
import { initCursorTrail } from './modules/cursor.js';
import { initFloatingEmojis, initRippleEffect } from './modules/particles.js';
import { initMusicModule } from './modules/music.js';
import { initRouter } from './modules/router.js';
import { initEvasionModule } from './modules/evasion.js';
import { initLightboxModule } from './modules/lightbox.js';
import { initLetterModule } from './modules/letter.js';
import { initPWA } from './modules/pwa.js';
import { initInteractiveFeatures } from './modules/features.js';

document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initWebGLShader();
  initCursorTrail();
  initFloatingEmojis();
  initRippleEffect();
  initMusicModule();
  initEvasionModule();
  initLightboxModule();
  initLetterModule();
  initInteractiveFeatures();
  initRouter();

  // Sort history gallery by data-date if present
  const gallery = document.getElementById('history-gallery');
  if (gallery) {
    [...gallery.querySelectorAll('.memory-card')]
      .sort((a, b) => new Date(a.dataset.date || 0) - new Date(b.dataset.date || 0))
      .forEach(card => gallery.appendChild(card));
  }
});

