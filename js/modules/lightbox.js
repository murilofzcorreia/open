export function openPhotoLightbox(img) {
  const photoLightbox = document.getElementById('photo-lightbox');
  const photoLightboxImage = document.getElementById('photo-lightbox-image');
  if (!photoLightbox || !photoLightboxImage) return;

  photoLightboxImage.src = img.currentSrc || img.src;
  photoLightboxImage.alt = img.alt || 'Foto ampliada';
  photoLightbox.classList.remove('closing');
  photoLightbox.classList.add('open');
  photoLightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
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
    if (photoLightboxImage) photoLightboxImage.removeAttribute('src');
    if (!letterModal || !letterModal.classList.contains('open')) document.body.style.overflow = '';
  }, 500);
}

export function initLightboxModule() {
  const photoLightboxClose = document.getElementById('photo-lightbox-close');
  const photoLightboxBackdrop = document.getElementById('photo-lightbox-backdrop');

  document.addEventListener('click', e => {
    if (e.target.matches('.gallery .g-card img, .memory-photo img')) {
      openPhotoLightbox(e.target);
    }
  });

  if (photoLightboxClose) photoLightboxClose.addEventListener('click', closePhotoLightbox);
  if (photoLightboxBackdrop) photoLightboxBackdrop.addEventListener('click', closePhotoLightbox);

  document.addEventListener('keydown', e => {
    const photoLightbox = document.getElementById('photo-lightbox');
    if (e.key === 'Escape' && photoLightbox && photoLightbox.classList.contains('open')) {
      closePhotoLightbox();
    }
  });
}
