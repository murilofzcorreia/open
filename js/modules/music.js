let musicEnabled = false;

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
    bgMusic.volume = 1;
    await bgMusic.play();
    musicEnabled = true;
    updateMusicUI();
  } catch (err) {
    console.log('Não foi possível iniciar a música:', err);
  }
}

export function stopMusic() {
  const bgMusic = document.getElementById('bg-music');
  if (!bgMusic || !musicEnabled) return;
  bgMusic.pause();
  musicEnabled = false;
  updateMusicUI();
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
    if (musicEnabled) stopMusic();
    else startMusic();
  });
  bgMusic.addEventListener('play', updateMusicUI);
  bgMusic.addEventListener('pause', updateMusicUI);
  bgMusic.addEventListener('ended', updateMusicUI);
  updateMusicUI();
}
