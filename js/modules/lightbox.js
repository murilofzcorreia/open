function getPhotoKey(src) {
  return `murilo-ana-photo:${new URL(src, window.location.href).pathname}`;
}

export function openPhotoLightbox(img) {
  const photoLightbox = document.getElementById('photo-lightbox');
  const photoLightboxImage = document.getElementById('photo-lightbox-image');
  const rotateButton = document.getElementById('photo-lightbox-rotate');
  const likeButton = document.getElementById('photo-lightbox-like');
  const note = document.getElementById('photo-lightbox-note');
  if (!photoLightbox || !photoLightboxImage) return;

  const source = img.currentSrc || img.src;
  const key = getPhotoKey(source);
  const rotation = Number(localStorage.getItem(`${key}:rotation`) || 0);
  const liked = localStorage.getItem(`${key}:liked`) === 'true';

  photoLightboxImage.src = source;
  photoLightboxImage.alt = img.alt || 'Foto ampliada';
  photoLightboxImage.style.setProperty('--photo-rotation', `${rotation}deg`);
  photoLightbox.dataset.photoKey = key;
  if (rotateButton) rotateButton.setAttribute('aria-label', `Girar foto, rotação atual de ${rotation} graus`);
  if (likeButton) {
    likeButton.setAttribute('aria-pressed', String(liked));
    likeButton.textContent = liked ? '♥ Curtida' : '♡ Curtir';
  }
  if (note) note.value = localStorage.getItem(`${key}:note`) || '';

  photoLightbox.classList.remove('closing');
  photoLightbox.classList.add('open');
  photoLightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('photo-lightbox-close')?.focus();
}

export function closePhotoLightbox() {
  const photoLightbox = document.getElementById('photo-lightbox');
  const photoLightboxImage = document.getElementById('photo-lightbox-image');
  const letterModal = document.getElementById('letter-modal');
  if (!photoLightbox) return;

  photoLightbox.classList.add('closing');
  photoLightbox.classList.remove('open');
  photoLightbox.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    photoLightbox.classList.remove('closing');
    if (photoLightboxImage) {
      photoLightboxImage.removeAttribute('src');
      photoLightboxImage.style.removeProperty('--photo-rotation');
    }
    if (!letterModal || !letterModal.classList.contains('open')) document.body.style.overflow = '';
  }, 500);
}

export function initLightboxModule() {
  const photoLightbox = document.getElementById('photo-lightbox');
  const photoLightboxImage = document.getElementById('photo-lightbox-image');
  const photoLightboxClose = document.getElementById('photo-lightbox-close');
  const photoLightboxBackdrop = document.getElementById('photo-lightbox-backdrop');
  const rotateButton = document.getElementById('photo-lightbox-rotate');
  const likeButton = document.getElementById('photo-lightbox-like');
  const note = document.getElementById('photo-lightbox-note');

  document.querySelectorAll('.gallery .g-card img, .memory-photo img').forEach(img => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `${img.alt || 'Foto'} — abrir em tela cheia`);
  });

  document.addEventListener('click', e => {
    if (e.target.matches('.gallery .g-card img, .memory-photo img')) openPhotoLightbox(e.target);
  });
  if (photoLightboxClose) photoLightboxClose.addEventListener('click', closePhotoLightbox);
  if (photoLightboxBackdrop) photoLightboxBackdrop.addEventListener('click', closePhotoLightbox);

  if (rotateButton && photoLightbox && photoLightboxImage) {
    rotateButton.addEventListener('click', () => {
      const key = photoLightbox.dataset.photoKey;
      if (!key) return;
      const rotation = (Number(localStorage.getItem(`${key}:rotation`) || 0) + 90) % 360;
      localStorage.setItem(`${key}:rotation`, String(rotation));
      photoLightboxImage.style.setProperty('--photo-rotation', `${rotation}deg`);
      rotateButton.setAttribute('aria-label', `Girar foto, rotação atual de ${rotation} graus`);
    });
  }
  if (likeButton && photoLightbox) {
    likeButton.addEventListener('click', () => {
      const key = photoLightbox.dataset.photoKey;
      if (!key) return;
      const liked = localStorage.getItem(`${key}:liked`) !== 'true';
      localStorage.setItem(`${key}:liked`, String(liked));
      likeButton.setAttribute('aria-pressed', String(liked));
      likeButton.textContent = liked ? '♥ Curtida' : '♡ Curtir';
      if (liked && navigator.vibrate) navigator.vibrate(20);
    });
  }
  if (note && photoLightbox) {
    note.addEventListener('input', () => {
      const key = photoLightbox.dataset.photoKey;
      if (key) localStorage.setItem(`${key}:note`, note.value.trim());
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && photoLightbox?.classList.contains('open')) closePhotoLightbox();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.gallery .g-card img, .memory-photo img')) {
      e.preventDefault();
      openPhotoLightbox(e.target);
    }
  });
}
