/**
 * Memory Stories Module — Full-Screen Cinematic Stories Mode
 * (Instagram Stories / Apple Memories style)
 * 
 * Features:
 * - Segmented 5-second progress bars at the top
 * - GPU-accelerated Ken Burns zoom & pan photo effect (6 cinematic presets)
 * - Touch & Gesture System:
 *     - Tap left half: Previous story (or restart current if > 1s)
 *     - Tap right half: Next story
 *     - Press & Hold: Pause timer & freeze Ken Burns animation
 *     - Swipe down: Interactive physics-based rubber band drag to dismiss
 * - Dynamic photo ingestion from DOM with fallback metadata
 * - Preloading of adjacent stories for 60fps instant transitions
 */

const STORY_DURATION = 5000; // 5 seconds per story

const DEFAULT_STORIES = [
  {
    src: 'imagensParaADD/foto_1.jpeg',
    title: 'O Primeiro Passo',
    subtitle: '12 de Maio de 2026',
    caption: 'Onde o nosso capítulo mais bonito começou a ser escrito com todo o amor do mundo. 💜'
  },
  {
    src: 'imagensParaADD/foto_2.jpeg',
    title: 'Sorrisos & Luz',
    subtitle: 'Nossa Sintonia',
    caption: 'Com você, até os momentos mais simples se transformam nas melhores lembranças. ✨'
  },
  {
    src: 'imagensParaADD/foto_3.jpeg',
    title: 'Abraço Seguro',
    subtitle: 'Meu Lugar Favorito',
    caption: 'Estar no seu abraço é ter a certeza de paz, aconchego e amor verdadeiro. 🌸'
  },
  {
    src: 'imagensParaADD/foto_4.jpeg',
    title: 'Noite Inesquecível',
    subtitle: 'Rodeio 2026',
    caption: 'Cada instante com você fica guardado para sempre no meu coração. 🎡'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41.jpeg',
    title: 'Cumplicidade',
    subtitle: '08 de Agosto de 2026',
    caption: 'A felicidade mora nos detalhes que a gente compartilha todos os dias. 💫'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (1).jpeg',
    title: 'Minha Princesa',
    subtitle: 'Beleza & Carinho',
    caption: 'Você ilumina tudo ao seu redor do jeitinho mais doce e encantador. 👑💜'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (2).jpeg',
    title: 'Amor Verdadeiro',
    subtitle: 'Dois Corações',
    caption: 'Quando estamos juntos, o tempo para e tudo ganha sentido. ⏳💞'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (3).jpeg',
    title: 'Olhares Que Falam',
    subtitle: 'Conexão Única',
    caption: 'Não precisamos de muitas palavras quando o coração já sabe tudo. ✨'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (4).jpeg',
    title: 'Lembranças Eternas',
    subtitle: 'Nossa Jornada',
    caption: 'Colecionando sorrisos, passeios e momentos que nunca vou esquecer. 📸'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (5).jpeg',
    title: 'Paz & Aconchego',
    subtitle: 'Nossos Dias',
    caption: 'A certeza mais bonita é saber que escolhi a pessoa certa para amar. 🌷'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (6).jpeg',
    title: 'Sempre Juntos',
    subtitle: 'Promessas Reais',
    caption: 'Caminhando lado a lado, sonhando alto e construindo o nosso amanhã. 🏡'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (7).jpeg',
    title: 'Carinho Infinito',
    subtitle: 'Meu Amor',
    caption: 'Obrigado por ser tão maravilhosa e fazer da minha vida uma história de amor. 💌'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (8).jpeg',
    title: 'Sintonia Perfeita',
    subtitle: 'Alegria Compartilhada',
    caption: 'Rir com você é o melhor remédio para qualquer cansaço do dia. ☀️'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (9).jpeg',
    title: 'Nosso Cantinho',
    subtitle: 'Memórias Vivas',
    caption: 'Cada foto guarda um pedacinho da felicidade que é viver com você. 🌺'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (10).jpeg',
    title: 'Sonhos & Planos',
    subtitle: 'Próximos Capítulos',
    caption: 'O futuro é um lugar lindo quando imagino você lá comigo. ✈️💍'
  },
  {
    src: 'imagensParaADD/WhatsApp Image 2026-08-08 at 18.12.41 (11).jpeg',
    title: 'Murilo & Ana Paula',
    subtitle: 'Para Todo o Sempre',
    caption: 'Eu amo você, hoje, amanhã e em cada segundo que ainda vamos viver! 💜✨'
  }
];

// Module State
let activeStories = [];
let currentIndex = 0;
let isOpen = false;
let isPaused = false;
let elapsedBeforePause = 0;
let storyStartTime = 0;
let animFrameId = null;
let preloadedImages = new Map();

// Gesture Tracking State
let isPointerDown = false;
let isHolding = false;
let isDragging = false;
let hasMoved = false;
let suppressNextClick = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let startTimeMs = 0;
let holdTimeout = null;

// DOM Elements Cache
let elements = null;

/**
 * Creates the modal markup if not already present in the DOM
 */
function getOrCreateElements() {
  if (elements && elements.modal && document.body.contains(elements.modal)) {
    return elements;
  }

  let modal = document.getElementById('stories-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stories-modal';
    modal.className = 'stories-modal';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <div class="stories-backdrop" id="stories-backdrop"></div>
      <div class="stories-stage" id="stories-stage">
        <div class="stories-ambient-bg" id="stories-ambient-bg"></div>

        <div class="stories-top-bar">
          <div class="stories-progress-bars" id="stories-progress-bars"></div>
          <div class="stories-header">
            <div class="stories-author">
              <div class="stories-avatar"><span>M×A</span></div>
              <div class="stories-meta">
                <span class="stories-title" id="stories-title">Murilo & Ana Paula</span>
                <span class="stories-subtitle" id="stories-subtitle">Memórias de Amor</span>
              </div>
            </div>
            <div class="stories-actions">
              <button class="stories-btn-icon" id="stories-pause-btn" type="button" aria-label="Pausar / Retomar histórias">
                <span class="pause-icon" aria-hidden="true">⏸</span>
              </button>
              <button class="stories-btn-icon" id="stories-close-btn" type="button" aria-label="Fechar histórias (Esc)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="stories-viewport" id="stories-viewport">
          <div class="stories-slide-container" id="stories-slide-container"></div>
          <div class="stories-tap-zone left" data-action="prev" aria-label="História anterior"></div>
          <div class="stories-tap-zone right" data-action="next" aria-label="Próxima história"></div>
          <div class="stories-paused-badge" id="stories-paused-badge" aria-hidden="true">
            <span>⏸ Pausado</span>
          </div>
        </div>

        <div class="stories-bottom-bar">
          <div class="stories-caption-box" id="stories-caption-box">
            <p class="stories-caption-text" id="stories-caption-text"></p>
          </div>
          <div class="stories-swipe-hint">
            <span class="swipe-arrow" aria-hidden="true">↓</span> deslize para baixo para fechar
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  elements = {
    modal,
    backdrop: modal.querySelector('#stories-backdrop'),
    stage: modal.querySelector('#stories-stage'),
    ambientBg: modal.querySelector('#stories-ambient-bg'),
    progressBars: modal.querySelector('#stories-progress-bars'),
    title: modal.querySelector('#stories-title'),
    subtitle: modal.querySelector('#stories-subtitle'),
    viewport: modal.querySelector('#stories-viewport'),
    slideContainer: modal.querySelector('#stories-slide-container'),
    pausedBadge: modal.querySelector('#stories-paused-badge'),
    captionText: modal.querySelector('#stories-caption-text'),
    closeBtn: modal.querySelector('#stories-close-btn'),
    pauseBtn: modal.querySelector('#stories-pause-btn'),
    tapLeft: modal.querySelector('.stories-tap-zone.left'),
    tapRight: modal.querySelector('.stories-tap-zone.right')
  };

  bindEvents(elements);
  return elements;
}

/**
 * Collects list of stories from DOM images or default story list
 */
function collectStories() {
  const domImages = Array.from(
    document.querySelectorAll('#history-gallery .memory-card img, .gallery .g-card img')
  );

  if (!domImages.length) {
    return DEFAULT_STORIES;
  }

  const collected = [];
  const seenSrcs = new Set();

  domImages.forEach((img, idx) => {
    const src = img.getAttribute('src') || img.src;
    if (!src || seenSrcs.has(src)) return;
    seenSrcs.add(src);

    const defaultMatch = DEFAULT_STORIES.find(d => d.src === src || src.endsWith(d.src));

    collected.push({
      src: src,
      title: defaultMatch ? defaultMatch.title : `Momento Especial ${idx + 1}`,
      subtitle: defaultMatch ? defaultMatch.subtitle : (img.closest('.memory-card')?.querySelector('.memory-date')?.textContent || 'Nossa História'),
      caption: defaultMatch ? defaultMatch.caption : (img.alt || 'Uma lembrança guardada com muito carinho.')
    });
  });

  return collected.length ? collected : DEFAULT_STORIES;
}

/**
 * Preload adjacent images for smooth instant transitions
 */
function preloadStory(index) {
  if (index < 0 || index >= activeStories.length) return;
  const story = activeStories[index];
  if (!story || preloadedImages.has(story.src)) return;

  const img = new Image();
  img.src = story.src;
  preloadedImages.set(story.src, img);
}

/**
 * Build top segmented progress bars
 */
function buildProgressBars(count) {
  const els = getOrCreateElements();
  els.progressBars.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const segment = document.createElement('div');
    segment.className = 'stories-progress-segment';
    segment.dataset.index = String(i);

    const fill = document.createElement('div');
    fill.className = 'stories-progress-fill';
    segment.appendChild(fill);

    els.progressBars.appendChild(segment);
  }
}

/**
 * Update progress segment states
 */
function updateProgressBarsState(currIdx, currentProgress = 0) {
  const els = getOrCreateElements();
  const segments = els.progressBars.querySelectorAll('.stories-progress-segment');

  segments.forEach((seg, idx) => {
    const fill = seg.querySelector('.stories-progress-fill');
    if (!fill) return;

    if (idx < currIdx) {
      fill.style.transform = 'scaleX(1)';
    } else if (idx === currIdx) {
      fill.style.transform = `scaleX(${Math.min(1, Math.max(0, currentProgress))})`;
    } else {
      fill.style.transform = 'scaleX(0)';
    }
  });
}

/**
 * Render slide at target index with Ken Burns animation preset
 */
function renderSlide(index) {
  const els = getOrCreateElements();
  const story = activeStories[index];
  if (!story) return;

  // 1. Update text metadata
  els.title.textContent = story.title || 'Murilo & Ana Paula';
  els.subtitle.textContent = `Memória ${index + 1} de ${activeStories.length} • ${story.subtitle || 'Nossa História'}`;
  els.captionText.textContent = story.caption || 'Cada segundo ao seu lado é uma memória inesquecível.';

  // 2. Ambient background blur
  els.ambientBg.style.backgroundImage = `url("${story.src}")`;

  // 3. Clear slide container and inject new photo with GPU Ken Burns preset
  els.slideContainer.innerHTML = '';

  const kbVariant = (index % 6) + 1; // kb-1 through kb-6
  const imgEl = document.createElement('img');
  imgEl.className = `story-image kb-${kbVariant}`;
  imgEl.src = story.src;
  imgEl.alt = story.title || 'Memória do casal';
  imgEl.draggable = false;

  els.slideContainer.appendChild(imgEl);

  // 4. Preload next & previous images
  preloadStory(index + 1);
  preloadStory(index + 2);
  preloadStory(index - 1);
}

/**
 * Animation tick for 5-second progress loop
 */
function runStoryTimer() {
  cancelAnimationFrame(animFrameId);

  const els = getOrCreateElements();
  const currentSeg = els.progressBars.children[currentIndex];
  const currentFill = currentSeg ? currentSeg.querySelector('.stories-progress-fill') : null;

  function tick(now) {
    if (!isOpen) return;

    if (!isPaused) {
      const elapsed = (now - storyStartTime) + elapsedBeforePause;
      const progress = Math.min(1, Math.max(0, elapsed / STORY_DURATION));

      if (currentFill) {
        currentFill.style.transform = `scaleX(${progress})`;
      }

      if (progress >= 1) {
        nextStory();
        return;
      }
    }

    animFrameId = requestAnimationFrame(tick);
  }

  animFrameId = requestAnimationFrame(tick);
}

/**
 * Navigate to a specific story index
 */
function goToStory(index) {
  if (index < 0) {
    index = 0;
  }

  if (index >= activeStories.length) {
    closeStories();
    return;
  }

  currentIndex = index;
  elapsedBeforePause = 0;
  isPaused = false;

  const els = getOrCreateElements();
  els.modal.classList.remove('is-paused');
  els.pausedBadge.classList.remove('visible');
  if (els.pauseBtn) {
    els.pauseBtn.querySelector('.pause-icon').textContent = '⏸';
  }

  updateProgressBarsState(currentIndex, 0);
  renderSlide(currentIndex);

  storyStartTime = performance.now();
  runStoryTimer();
}

/**
 * Next story step
 */
function nextStory() {
  if (currentIndex + 1 < activeStories.length) {
    goToStory(currentIndex + 1);
  } else {
    closeStories();
  }
}

/**
 * Previous story step (or restart current if > 1s into it)
 */
function prevStory() {
  const currentElapsed = elapsedBeforePause + (isPaused ? 0 : (performance.now() - storyStartTime));
  if (currentElapsed > 1000) {
    // Restart current story
    goToStory(currentIndex);
  } else if (currentIndex > 0) {
    goToStory(currentIndex - 1);
  } else {
    goToStory(0);
  }
}

/**
 * Pause story timer and freeze Ken Burns animation
 */
function pauseStory() {
  if (!isOpen || isPaused) return;
  isPaused = true;
  elapsedBeforePause += (performance.now() - storyStartTime);

  const els = getOrCreateElements();
  els.modal.classList.add('is-paused');
  els.pausedBadge.classList.add('visible');
  if (els.pauseBtn) {
    els.pauseBtn.querySelector('.pause-icon').textContent = '▶';
  }
}

/**
 * Resume story timer
 */
function resumeStory() {
  if (!isOpen || !isPaused) return;
  isPaused = false;
  storyStartTime = performance.now();

  const els = getOrCreateElements();
  els.modal.classList.remove('is-paused');
  els.pausedBadge.classList.remove('visible');
  if (els.pauseBtn) {
    els.pauseBtn.querySelector('.pause-icon').textContent = '⏸';
  }
}

/**
 * Toggle pause / play
 */
function togglePause() {
  if (isPaused) {
    resumeStory();
  } else {
    pauseStory();
  }
}

/**
 * Open Stories Full-Screen Mode
 * @param {number} startIndex Index of story to start with (default: 0)
 * @param {Array} customList Optional custom stories list
 */
export function openStories(startIndex = 0, customList = null) {
  const els = getOrCreateElements();
  activeStories = (customList && customList.length) ? customList : collectStories();

  if (!activeStories.length) return;

  const validIndex = Math.max(0, Math.min(startIndex, activeStories.length - 1));

  buildProgressBars(activeStories.length);

  isOpen = true;
  isPaused = false;
  elapsedBeforePause = 0;

  // Reset stage transforms
  els.stage.style.transform = '';
  els.stage.style.borderRadius = '';
  els.backdrop.style.opacity = '';

  els.modal.classList.remove('closing');
  els.modal.classList.add('open');
  els.modal.setAttribute('aria-hidden', 'false');

  document.body.style.overflow = 'hidden';

  goToStory(validIndex);
}

/**
 * Close Stories Full-Screen Mode with smooth exit
 */
export function closeStories() {
  if (!isOpen) return;
  isOpen = false;
  cancelAnimationFrame(animFrameId);
  clearTimeout(holdTimeout);

  const els = getOrCreateElements();
  els.modal.classList.add('closing');
  els.modal.classList.remove('open');
  els.modal.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    els.modal.classList.remove('closing');
    els.modal.classList.remove('is-paused');
    els.slideContainer.innerHTML = '';
    els.stage.style.transform = '';
    els.stage.style.borderRadius = '';
    els.backdrop.style.opacity = '';

    // Check if lightbox or other modal is open before resetting overflow
    const lightbox = document.getElementById('photo-lightbox');
    const letter = document.getElementById('letter-modal');
    if ((!lightbox || !lightbox.classList.contains('open')) && (!letter || !letter.classList.contains('open'))) {
      document.body.style.overflow = '';
    }
  }, 320);
}

/**
 * Bind gestures & interactions (Touch, Pointer, Hold, Swipe Down, Keyboard)
 */
function bindEvents(els) {
  // Top Action Buttons
  els.closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeStories();
  });

  els.pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
  });

  // Tap Left & Right Navigation
  els.tapLeft.addEventListener('click', (e) => {
    e.stopPropagation();
    if (suppressNextClick || isDragging || isHolding) return;
    prevStory();
  });

  els.tapRight.addEventListener('click', (e) => {
    e.stopPropagation();
    if (suppressNextClick || isDragging || isHolding) return;
    nextStory();
  });

  // Pointer Down (Mouse & Touch) — Hold detection & start gesture
  const onPointerDown = (e) => {
    if (!isOpen) return;
    if (e.target.closest('#stories-close-btn') || e.target.closest('#stories-pause-btn') || e.target.closest('#stories-caption-box')) {
      return;
    }

    isPointerDown = true;
    isHolding = false;
    isDragging = false;
    hasMoved = false;
    suppressNextClick = false;

    startX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? 0;
    startY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? 0;
    currentX = startX;
    currentY = startY;
    startTimeMs = performance.now();

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      if (isPointerDown && !hasMoved && !isDragging) {
        isHolding = true;
        suppressNextClick = true;
        pauseStory();
        if (navigator.vibrate) navigator.vibrate(15);
      }
    }, 180);
  };

  // Pointer Move — Drag down detection & rubber-band physics
  const onPointerMove = (e) => {
    if (!isPointerDown || !isOpen) return;

    currentX = e.clientX ?? (e.touches && e.touches[0].clientX) ?? currentX;
    currentY = e.clientY ?? (e.touches && e.touches[0].clientY) ?? currentY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (Math.hypot(deltaX, deltaY) > 8) {
      hasMoved = true;
      suppressNextClick = true;
      clearTimeout(holdTimeout);
    }

    // Swipe down detection (vertical dominance)
    if (deltaY > 0 && deltaY > Math.abs(deltaX) * 1.05) {
      isDragging = true;
      suppressNextClick = true;
      pauseStory();

      const scale = Math.max(0.72, 1 - deltaY / 900);
      const translateY = deltaY;
      const opacity = Math.max(0.18, 1 - deltaY / 420);

      els.stage.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      els.stage.style.borderRadius = `${Math.min(36, 16 + deltaY / 12)}px`;
      els.backdrop.style.opacity = String(opacity);
    }
  };

  // Pointer Up — Evaluate Swipe to close, Tap navigation, or Release Hold
  const onPointerUp = (e) => {
    if (!isPointerDown) return;
    clearTimeout(holdTimeout);

    const deltaY = currentY - startY;
    const gestureDuration = performance.now() - startTimeMs;

    if (isDragging) {
      suppressNextClick = true;
      // Swiped down threshold or fast flick
      if (deltaY > 110 || (deltaY > 50 && gestureDuration < 260)) {
        closeStories();
      } else {
        // Spring back
        els.stage.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.35s ease';
        els.backdrop.style.transition = 'opacity 0.35s ease';

        els.stage.style.transform = 'translate3d(0, 0, 0) scale(1)';
        els.stage.style.borderRadius = '';
        els.backdrop.style.opacity = '1';

        setTimeout(() => {
          els.stage.style.transition = '';
          els.backdrop.style.transition = '';
          resumeStory();
        }, 350);
      }
      isDragging = false;
    } else if (isHolding) {
      // Released after hold
      suppressNextClick = true;
      isHolding = false;
      resumeStory();
    }

    if (gestureDuration > 220 || hasMoved) {
      suppressNextClick = true;
    }

    // Clear suppression after a tiny frame tick to allow subsequent taps
    setTimeout(() => {
      suppressNextClick = false;
    }, 60);

    isPointerDown = false;
  };

  // Attach pointer events to the stage
  if (window.PointerEvent) {
    els.stage.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
  } else {
    // Touch fallback
    els.stage.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });
    window.addEventListener('touchcancel', onPointerUp, { passive: true });
    els.stage.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeStories();
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      nextStory();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevStory();
    }
  });
}

/**
 * Initialize Stories Module & Hook Gallery Header Button
 */
export function initStoriesModule() {
  getOrCreateElements();

  const openBtn = document.getElementById('btn-open-stories');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openStories(0);
    });
  }

  // Also expose globally for inline buttons or console testing
  window.openStories = openStories;
  window.closeStories = closeStories;
}
