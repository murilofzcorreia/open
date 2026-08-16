/**
 * PWA Module
 * Handles Service Worker registration, updates, offline status notifications, and install prompts.
 */

let deferredInstallPrompt = null;

export function initPWA() {
  registerServiceWorker();
  initNetworkStatusListener();
  initInstallPromptListener();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nova versão disponível em segundo plano.');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', err);
      });

    // Handle controller change (when new SW takes control)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
      }
    });
  });
}

function initNetworkStatusListener() {
  function showStatusToast(message, isOffline = false) {
    let toast = document.getElementById('pwa-status-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pwa-status-toast';
      toast.className = 'pwa-status-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.toggle('offline', isOffline);
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 4000);
  }

  window.addEventListener('offline', () => {
    showStatusToast('Você está offline. Todas as memórias e músicas continuam disponíveis! 💜', true);
  });

  window.addEventListener('online', () => {
    showStatusToast('Conexão restabelecida ✨', false);
  });
}

function initInstallPromptListener() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar on mobile
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    console.log('[PWA] Aplicativo instalado com sucesso!');
  });
}

export function promptPWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou instalar');
      }
      deferredInstallPrompt = null;
    });
  }
}
