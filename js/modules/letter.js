import { startMusic } from './music.js';

const secretLetterText = `Se você chegou até aqui, é porque eu queria te entregar mais do que uma pergunta bonita.\n\nQueria te oferecer um pedacinho do meu coração, transformado em detalhe, cuidado e carinho, do jeitinho que você merece.\n\nDesde que você entrou na minha vida, os meus dias ficaram mais leves, mais bonitos e muito mais felizes. O seu sorriso acalma, o seu jeito encanta, e a sua presença faz tudo ganhar mais sentido.\n\nEu quero continuar colecionando memórias ao seu lado: das mais simples, como uma conversa tranquila, às mais especiais, como este momento.\n\nSe esta surpresa foi feita com carinho, é porque você é, sem dúvida, uma das partes mais bonitas da minha vida.\n\nE, sinceramente, o que eu mais quero é que este seja apenas o começo de tudo o que ainda vamos viver juntos.`;

let letterModal = null;
let letterBackdrop = null;
let closeLetterBtn = null;
let letterBody = null;
let letterPaper = null;
let letterSkipBtn = null;
let letterTypingTimer = null;
let letterTypingIndex = 0;
let letterWasTyped = false;

function ensureLetterModal() {
  if (letterModal && document.body.contains(letterModal)) return;
  const template = document.getElementById('letter-modal-template');
  if (!template) return;

  document.body.insertAdjacentHTML('beforeend', template.innerHTML.trim());
  closeLetterBtn = document.getElementById('close-letter');
  letterModal = document.getElementById('letter-modal');
  letterBackdrop = document.getElementById('letter-backdrop');
  letterBody = document.getElementById('letter-body');
  letterPaper = document.getElementById('letter-paper');
  letterSkipBtn = document.getElementById('letter-skip');

  if (closeLetterBtn) closeLetterBtn.addEventListener('click', closeLetter);
  if (letterBackdrop) letterBackdrop.addEventListener('click', closeLetter);
  if (letterSkipBtn) letterSkipBtn.addEventListener('click', skipLetterTyping);
}

function renderLetterTyping() {
  if (!letterBody) return;
  const visible = secretLetterText.slice(0, letterTypingIndex);
  letterBody.innerHTML = `${visible.replace(/\n/g, '<br>')}<span class="letter-caret">|</span>`;
}

function showFinishedLetter() {
  clearTimeout(letterTypingTimer);
  letterTypingTimer = null;
  if (letterBody) {
    letterBody.innerHTML = secretLetterText.replace(/\n/g, '<br>');
    letterBody.classList.add('done');
  }
  if (letterModal) {
    letterModal.classList.remove('typing');
    letterModal.classList.add('ready');
  }
  if (letterSkipBtn) letterSkipBtn.hidden = true;
}

function typeLetter() {
  clearTimeout(letterTypingTimer);
  renderLetterTyping();
  if (letterTypingIndex >= secretLetterText.length) {
    letterWasTyped = true;
    showFinishedLetter();
    return;
  }
  const nextChar = secretLetterText[letterTypingIndex];
  letterTypingIndex++;
  const delay = nextChar === '\n' ? 220 : nextChar === '.' ? 110 : 26;
  letterTypingTimer = setTimeout(typeLetter, delay);
}

export function skipLetterTyping() {
  letterTypingIndex = secretLetterText.length;
  letterWasTyped = true;
  showFinishedLetter();
}

export function openLetter() {
  ensureLetterModal();
  startMusic();
  if (!letterModal) return;

  letterModal.classList.add('open');
  letterModal.classList.remove('ready');
  letterModal.classList.add('typing');
  letterModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (letterPaper) letterPaper.scrollTop = 0;

  if (letterWasTyped) {
    showFinishedLetter();
    return;
  }
  letterTypingIndex = 0;
  if (letterBody) {
    letterBody.classList.remove('done');
    letterBody.innerHTML = '';
  }
  if (letterSkipBtn) letterSkipBtn.hidden = false;
  setTimeout(typeLetter, 720);
}

export function closeLetter() {
  if (!letterModal) return;
  const photoLightbox = document.getElementById('photo-lightbox');

  letterModal.classList.remove('open');
  letterModal.classList.remove('typing');
  letterModal.classList.remove('ready');
  letterModal.setAttribute('aria-hidden', 'true');
  clearTimeout(letterTypingTimer);
  letterTypingTimer = null;

  setTimeout(() => {
    if (letterModal && !letterModal.classList.contains('open')) {
      letterModal.remove();
      letterModal = null;
      letterBackdrop = null;
      closeLetterBtn = null;
      letterBody = null;
      letterPaper = null;
      letterSkipBtn = null;
    }
  }, 450);

  if (!photoLightbox || !photoLightbox.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

export function initLetterModule() {
  const openLetterBtn = document.getElementById('open-letter');
  if (openLetterBtn) openLetterBtn.addEventListener('click', openLetter);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && letterModal && letterModal.classList.contains('open')) {
      closeLetter();
    }
  });
}
