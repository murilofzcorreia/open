/**
 * Polaroid 3D Flippable Cards & Interactive Memories Module
 * Features:
 * - 3D card flip with rotateY(180deg)
 * - Vintage photo gloss front & textured polaroid paper back
 * - Double-tap detection with haptics (navigator.vibrate([25, 40, 25]))
 * - Erupting burst of floating heart emojis (💜)
 * - Milestone stamps & romantic quotes
 * - Editable textarea notes with real-time localStorage persistence
 */

const DEFAULT_MILESTONES = [
  {
    date: '12 de Maio de 2026',
    milestone: 'O Início de Tudo',
    quote: '“Onde o nosso para sempre começou a ganhar forma e cor.”',
    stampDate: '12.05.2026'
  },
  {
    date: 'Primeiro Sorriso',
    milestone: 'Conexão & Brilho',
    quote: '“O seu riso solto é a minha melodia favorita no mundo.”',
    stampDate: '2026'
  },
  {
    date: 'Nosso Abraço',
    milestone: 'Porto Seguro',
    quote: '“Estar no seu abraço é ter a certeza de que estou em casa.”',
    stampDate: '2026'
  },
  {
    date: 'Passeio Especial',
    milestone: 'Cumplicidade',
    quote: '“Com você, qualquer caminho vira a viagem mais bonita.”',
    stampDate: '2026'
  },
  {
    date: 'Olhares Sinceros',
    milestone: 'Pura Leveza',
    quote: '“Nos seus olhos encontrei a paz que meu coração pedia.”',
    stampDate: '2026'
  },
  {
    date: 'Noite Mágica',
    milestone: 'Festa & Paixão',
    quote: '“Dançando com você sob as luzes, o tempo parecia parar.”',
    stampDate: '2026'
  },
  {
    date: 'Sob as Estrelas',
    milestone: 'Destino Escrito',
    quote: '“O universo conspirou com carinho para o nosso encontro.”',
    stampDate: '2026'
  },
  {
    date: 'Café & Conversas',
    milestone: 'Detalhes Lindos',
    quote: '“As horas voam quando estou me perdendo na sua conversa.”',
    stampDate: '2026'
  },
  {
    date: 'Nossos Sonhos',
    milestone: 'Planos a Dois',
    quote: '“Cada plano para o futuro tem você como protagonista.”',
    stampDate: '2026'
  },
  {
    date: 'Dias de Calmaria',
    milestone: 'Amor & Cuidado',
    quote: '“Você é a minha calmaria no meio de todo o barulho do mundo.”',
    stampDate: '2026'
  },
  {
    date: 'Mãos Dadas',
    milestone: 'Para Sempre',
    quote: '“Escolho você hoje, amanhã e em todos os dias que virão.”',
    stampDate: '2026'
  },
  {
    date: 'Amor Eterno',
    milestone: 'Murilo & Ana',
    quote: '“Não é sobre o tempo, é sobre a profundidade do que sentimos.”',
    stampDate: '12.05.2026'
  }
];

function getPhotoKey(src) {
  try {
    return `murilo-ana-photo:${new URL(src, window.location.href).pathname}`;
  } catch {
    return `murilo-ana-photo:${src}`;
  }
}

/**
 * Spawns an erupting burst of floating heart emojis (💜) at the specified coordinates
 * @param {number} x Screen X coordinate
 * @param {number} y Screen Y coordinate
 */
export function triggerHeartExplosion(x, y) {
  // Haptic feedback
  if (navigator?.vibrate) {
    try {
      navigator.vibrate([25, 40, 25]);
    } catch {
      // Ignored if vibration is not allowed by device
    }
  }

  // Create burst container if needed
  let container = document.getElementById('heart-explosion-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'heart-explosion-container';
    container.className = 'heart-explosion-container';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);
  }

  // 1. Center mega glowing heart
  const megaHeart = document.createElement('div');
  megaHeart.className = 'heart-burst-center';
  megaHeart.textContent = '💜';
  megaHeart.style.left = `${x}px`;
  megaHeart.style.top = `${y}px`;
  container.appendChild(megaHeart);

  setTimeout(() => {
    megaHeart.remove();
  }, 900);

  // 2. Multi-directional particle fountain
  const emojis = ['💜', '💜', '💜', '💖', '✨', '🤍', '💜'];
  const particleCount = 16;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('span');
    p.className = 'heart-burst-particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    // Physics calculations for erupting fountain
    const angle = (Math.PI * 2 * (i / particleCount)) + (Math.random() * 0.4 - 0.2);
    const distance = 70 + Math.random() * 95;
    const tx = Math.cos(angle) * distance;
    // Bias upward for fountain lift
    const ty = (Math.sin(angle) * distance) - (35 + Math.random() * 45);
    const rot = Math.floor(Math.random() * 90 - 45);
    const scale = (0.75 + Math.random() * 0.7).toFixed(2);
    const duration = 750 + Math.random() * 350;

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    p.style.setProperty('--rot', `${rot}deg`);
    p.style.setProperty('--scale', scale);
    p.style.animationDuration = `${duration}ms`;

    container.appendChild(p);

    setTimeout(() => {
      p.remove();
    }, duration + 50);
  }
}

/**
 * Initializes and upgrades all .memory-card elements into 3D flippable Polaroid cards
 */
export function initPolaroidCards() {
  const gallery = document.getElementById('history-gallery');
  if (!gallery) return;

  const cards = gallery.querySelectorAll('.memory-card');
  if (!cards.length) return;

  cards.forEach((card, index) => {
    // Prevent duplicate initialization
    if (card.dataset.polaroidReady === 'true') return;
    card.dataset.polaroidReady = 'true';

    // Extract existing image data
    const imgEl = card.querySelector('img');
    const imgSrc = imgEl ? (imgEl.getAttribute('src') || imgEl.src) : '';
    const imgAlt = imgEl ? (imgEl.getAttribute('alt') || 'Nossa história') : 'Nossa história';
    const photoKey = getPhotoKey(imgSrc);

    // Read initial localStorage values
    const isLiked = localStorage.getItem(`${photoKey}:liked`) === 'true';
    const savedNote = localStorage.getItem(`${photoKey}:note`) || '';

    // Card metadata
    const milestoneInfo = DEFAULT_MILESTONES[index % DEFAULT_MILESTONES.length];
    const dateText = card.dataset.date || milestoneInfo.date;
    const milestoneTitle = card.dataset.milestone || milestoneInfo.milestone;
    const quoteText = card.dataset.quote || milestoneInfo.quote;
    const stampDate = milestoneInfo.stampDate;

    // Apply 3D Polaroid layout
    card.classList.add('polaroid-card');
    card.innerHTML = `
      <div class="polaroid-card-inner">
        <!-- FRONT FACE -->
        <div class="polaroid-face polaroid-front" aria-label="Frente da polaroid: ${milestoneTitle}">
          <div class="polaroid-photo-frame">
            <div class="polaroid-photo-wrapper" tabindex="0" role="button" aria-label="Foto de ${milestoneTitle} — toque 2x para curtir">
              <img src="${imgSrc}" alt="${imgAlt}" loading="lazy" decoding="async" class="polaroid-img" />
              <div class="polaroid-gloss" aria-hidden="true"></div>
              <button class="polaroid-like-badge ${isLiked ? 'liked' : ''}" type="button" aria-label="${isLiked ? 'Descurtir memória' : 'Curtir memória'}" aria-pressed="${isLiked}">
                <span class="like-heart-icon">${isLiked ? '💜' : '♡'}</span>
              </button>
              <div class="polaroid-tap-hint" aria-hidden="true">Toque 2x 💜</div>
            </div>
          </div>
          <div class="polaroid-front-footer">
            <span class="polaroid-date-badge">${dateText}</span>
            <button class="polaroid-flip-btn" type="button" aria-label="Virar polaroid para ver o verso">
              <span class="flip-icon" aria-hidden="true">🔄</span>
              <span>Virar</span>
            </button>
          </div>
        </div>

        <!-- BACK FACE -->
        <div class="polaroid-face polaroid-back" aria-label="Verso da polaroid: anotação e memórias">
          <div class="polaroid-paper-texture" aria-hidden="true"></div>
          <div class="polaroid-back-content">
            <div class="polaroid-stamp-wrap">
              <div class="polaroid-milestone-stamp">
                <span class="stamp-star" aria-hidden="true">✦</span>
                <span class="stamp-title">${milestoneTitle}</span>
                <span class="stamp-couple">Murilo &amp; Ana</span>
                <span class="stamp-date">${stampDate}</span>
              </div>
            </div>

            <blockquote class="polaroid-quote">
              ${quoteText}
            </blockquote>

            <div class="polaroid-note-section">
              <div class="polaroid-note-head">
                <label class="polaroid-note-label" for="polaroid-note-${index}">
                  <span class="note-icon" aria-hidden="true">✍️</span> Nossa lembrança:
                </label>
                <span class="polaroid-save-status" id="save-status-${index}" aria-live="polite">✓ Salvo</span>
              </div>
              <textarea
                id="polaroid-note-${index}"
                class="polaroid-note-input"
                rows="3"
                maxlength="220"
                placeholder="Escreva uma memória sobre este momento especial..."
                aria-label="Nota personalizada desta memória"
              >${savedNote}</textarea>
            </div>

            <div class="polaroid-back-footer">
              <button class="polaroid-flip-btn polaroid-flip-back" type="button" aria-label="Voltar para a foto da frente">
                <span class="flip-icon" aria-hidden="true">🔄</span>
                <span>Voltar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // ── 1. 3D Card Flip handlers ──
    const flipBtns = card.querySelectorAll('.polaroid-flip-btn');
    flipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('is-flipped');
        if (navigator?.vibrate) {
          try { navigator.vibrate(18); } catch {}
        }
      });
    });

    // ── 2. Like button handler ──
    const likeBtn = card.querySelector('.polaroid-like-badge');
    const updateLikeUI = (liked) => {
      if (!likeBtn) return;
      likeBtn.classList.toggle('liked', liked);
      likeBtn.setAttribute('aria-pressed', String(liked));
      const icon = likeBtn.querySelector('.like-heart-icon');
      if (icon) icon.textContent = liked ? '💜' : '♡';
      likeBtn.setAttribute('aria-label', liked ? 'Descurtir memória' : 'Curtir memória');
    };

    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentlyLiked = localStorage.getItem(`${photoKey}:liked`) === 'true';
        const nextLiked = !currentlyLiked;
        localStorage.setItem(`${photoKey}:liked`, String(nextLiked));
        updateLikeUI(nextLiked);

        if (nextLiked) {
          const rect = likeBtn.getBoundingClientRect();
          triggerHeartExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else if (navigator?.vibrate) {
          try { navigator.vibrate(15); } catch {}
        }
      });
    }

    // ── 3. Double-tap detection on photo ──
    const photoWrapper = card.querySelector('.polaroid-photo-wrapper');
    if (photoWrapper) {
      let lastTapTime = 0;
      let lastTapX = 0;
      let lastTapY = 0;
      const DOUBLE_TAP_THRESHOLD = 320; // ms
      const MAX_TAP_DISTANCE = 35; // px

      const handleDoubleTap = (clientX, clientY) => {
        localStorage.setItem(`${photoKey}:liked`, 'true');
        updateLikeUI(true);
        triggerHeartExplosion(clientX, clientY);
      };

      // Pointer / Touch / Click double-tap
      photoWrapper.addEventListener('pointerdown', (e) => {
        const now = Date.now();
        const timeDiff = now - lastTapTime;
        const dist = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);

        if (timeDiff > 40 && timeDiff < DOUBLE_TAP_THRESHOLD && dist < MAX_TAP_DISTANCE) {
          e.preventDefault();
          handleDoubleTap(e.clientX, e.clientY);
          lastTapTime = 0;
        } else {
          lastTapTime = now;
          lastTapX = e.clientX;
          lastTapY = e.clientY;
        }
      });

      // Desktop dblclick fallback
      photoWrapper.addEventListener('dblclick', (e) => {
        e.preventDefault();
        handleDoubleTap(e.clientX, e.clientY);
      });
    }

    // ── 4. Real-time note persistence in localStorage ──
    const textarea = card.querySelector('.polaroid-note-input');
    const saveStatus = card.querySelector(`#save-status-${index}`);
    let saveTimeout = null;

    if (textarea) {
      textarea.addEventListener('input', () => {
        const val = textarea.value;
        localStorage.setItem(`${photoKey}:note`, val);

        if (saveStatus) {
          saveStatus.textContent = 'Salvando...';
          saveStatus.classList.add('visible');

          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            saveStatus.textContent = '✓ Salvo';
            setTimeout(() => {
              saveStatus.classList.remove('visible');
            }, 1200);
          }, 400);
        }
      });
    }
  });
}
