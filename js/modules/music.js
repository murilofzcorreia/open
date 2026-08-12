let musicEnabled = false;
let animationFrame = null;
let audioContext = null;

function animateMusic(targetVolume, targetRate, onComplete) {
  const bgMusic = document.getElementById('bg-music');
  if (!bgMusic) return;
  cancelAnimationFrame(animationFrame);
  const startVolume = bgMusic.volume;
  const startRate = bgMusic.playbackRate;
  const duration = targetVolume === 0 ? 550 : 700;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    bgMusic.volume = startVolume + (targetVolume - startVolume) * eased;
    bgMusic.playbackRate = startRate + (targetRate - startRate) * eased;
    if (progress < 1) animationFrame = requestAnimationFrame(frame);
    else onComplete?.();
  }
  animationFrame = requestAnimationFrame(frame);
}

function playUiChime() {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  } catch {
    // O som é opcional e não deve impedir nenhuma interação.
  }
}

export function getMusicState() {
  return musicEnabled;
}

export function updateMusicUI() {
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  const musicState = document.getElementById('music-state');
  const musicHint = document.querySelector('.music-hint');
  if (!bgMusic || !musicToggle || !musicState || !musicHint) return;

  musicEnabled = !bgMusic.paused && !bgMusic.ended;
  musicToggle.classList.toggle('on', musicEnabled);
  musicState.textContent = musicEnabled ? 'vinil tocando' : 'vinil pausado';
  musicHint.textContent = musicEnabled ? 'toque para desligar' : 'toque para ligar';
}

export async function startMusic() {
  const bgMusic = document.getElementById('bg-music');
  if (!bgMusic || musicEnabled) return;
  try {
    bgMusic.volume = 0;
    bgMusic.playbackRate = 0.78;
    await bgMusic.play();
    musicEnabled = true;
    animateMusic(1, 1);
    updateMusicUI();
  } catch (err) {
    console.log('Não foi possível iniciar a música:', err);
  }
}

export function stopMusic() {
  const bgMusic = document.getElementById('bg-music');
  if (!bgMusic || !musicEnabled) return;
  animateMusic(0, 0.55, () => {
    bgMusic.pause();
    bgMusic.volume = 1;
    bgMusic.playbackRate = 1;
    musicEnabled = false;
    updateMusicUI();
  });
}

export function syncMusicTogglePlacement(pageId) {
  const musicToggle = document.getElementById('music-toggle');
  const yesMusicDock = document.getElementById('yes-music-dock');
  if (!musicToggle) return;
  if (pageId === 'page-yes' && yesMusicDock) {
    yesMusicDock.appendChild(musicToggle);
    musicToggle.classList.add('music-toggle-inline');
    return;
  }
  document.body.appendChild(musicToggle);
  musicToggle.classList.remove('music-toggle-inline');
}

export function initMusicModule() {
  const musicToggle = document.getElementById('music-toggle');
  const bgMusic = document.getElementById('bg-music');
  if (!musicToggle || !bgMusic) return;

  musicToggle.addEventListener('click', () => {
    playUiChime();
    if (musicEnabled) stopMusic();
    else startMusic();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('button') && event.target !== musicToggle && !event.target.closest('#music-toggle')) playUiChime();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && musicEnabled) animateMusic(Math.min(bgMusic.volume, 0.35), bgMusic.playbackRate);
    if (!document.hidden && musicEnabled) animateMusic(1, 1);
  });
  bgMusic.addEventListener('play', updateMusicUI);
  bgMusic.addEventListener('pause', updateMusicUI);
  bgMusic.addEventListener('ended', updateMusicUI);
  updateMusicUI();
}
