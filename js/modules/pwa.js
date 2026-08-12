export function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.warn('Falha ao registrar Service Worker:', err);
        });
    });
  }
}
