import { syncMusicTogglePlacement } from './music.js';
import { updateRelationshipCounter, stopRelationshipCounter } from './counter.js';
import { resetHoldButton } from './evasion.js';

const pagesWithNav = ['page-proposal-intro', 'page-yes', 'page-history'];

export function transitionTo(pageId) {
  const overlay = document.getElementById('trans-overlay');
  if (pageId === 'page-question' && typeof window.resetQuestionState === 'function') {
    window.resetQuestionState();
  }

  if (overlay) overlay.classList.add('show');
  setTimeout(() => {
    showPage(pageId);
    if (pageId === 'page-question' && typeof window.positionNoButton === 'function') {
      setTimeout(window.positionNoButton, 500);
    }
    setTimeout(() => {
      if (overlay) overlay.classList.remove('show');
    }, 50);
  }, 350);
}

export function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(id);
  if (!pg) return;
  pg.classList.add('active');

  syncMusicTogglePlacement(id);
  syncSiteNav(id);

  if (id === 'page-proposal-intro') resetHoldButton();
  if (id === 'page-history') updateRelationshipCounter();
  else stopRelationshipCounter();

  window.scrollTo(0, 0);
  setTimeout(() => {
    pg.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }, 100);
}

export function syncSiteNav(pageId) {
  const siteNav = document.getElementById('site-nav');
  const siteNavButtons = document.querySelectorAll('.site-nav-btn');
  if (!siteNav) return;

  siteNav.classList.toggle('visible', pagesWithNav.includes(pageId));
  siteNavButtons.forEach(btn => {
    const target = btn.dataset.page;
    if (target === 'page-proposal-intro' && (pageId === 'page-proposal-intro' || pageId === 'page-yes')) {
      btn.classList.add('active');
    } else {
      btn.classList.toggle('active', target === pageId);
    }
  });
}

export function initRouter() {
  const siteNavButtons = document.querySelectorAll('.site-nav-btn');
  siteNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.page;
      if (pageId && !btn.classList.contains('active')) transitionTo(pageId);
    });
  });

  window.transitionTo = transitionTo;
  syncSiteNav('page-intro');

  document.querySelectorAll('#page-intro .reveal').forEach(el => {
    setTimeout(() => el.classList.add('in'), 100);
  });
}
