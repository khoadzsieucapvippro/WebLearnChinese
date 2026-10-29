/**
 * =============================================================================
 * CORE APPLICATION SHELL BOOTSTRAP (PRODUCTION HOMEPAGE)
 * Module: frontend/js/app.js
 * 
 * Responsibilities:
 * - Production Shell Initialization
 * - Accessible Responsive Navigation (aria-expanded sync)
 * - Session-Aware Navbar Integration via initNavbarAuth()
 * - Hero Sample Character Pronunciation (xué) & Session-Aware CTAs
 * =============================================================================
 */

import { initNavbarAuth } from './ui/nav.js';
import { authManager } from './auth/auth-state.js';
import { resolveSubpathAudioUrl, speakHanzi } from './ui/speech.js';
import { playPronunciation } from './ui/ui.js';

/**
 * Initializes the production application shell on DOM ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initNavbarAuth('navAuthContainer');
  initHeroSampleAudio();
  syncHomepageSessionCtas();

  // React reactively to login/logout events via window CustomEvents
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:login', syncHomepageSessionCtas);
    window.addEventListener('auth:logout', syncHomepageSessionCtas);
    window.addEventListener('auth:update', syncHomepageSessionCtas);
  }
});

/**
 * Handles accessible mobile navigation disclosure attributes.
 */
export function initNavbar() {
  const navToggler = document.querySelector('.navbar-toggler');
  const navCollapse = document.getElementById('primaryNavMenu');

  if (navToggler && navCollapse) {
    navCollapse.addEventListener('show.bs.collapse', () => {
      navToggler.setAttribute('aria-expanded', 'true');
    });

    navCollapse.addEventListener('hide.bs.collapse', () => {
      navToggler.setAttribute('aria-expanded', 'false');
    });
  }
}

/**
 * Attaches audio playback to the hero sample character card (学 xué).
 */
export function initHeroSampleAudio() {
  const heroAudioBtn = document.getElementById('heroAudioBtn');
  if (!heroAudioBtn) return;

  heroAudioBtn.addEventListener('click', () => {
    const rawAudioUrl = 'assets/audio/vocabulary/vocab_0418.mp3';
    playPronunciation({
      text: '学',
      audioUrl: rawAudioUrl,
      button: heroAudioBtn
    });
  });
}

/**
 * Synchronizes hero CTA button based on authentication status.
 */
export function syncHomepageSessionCtas() {
  const heroCtaBtn = document.getElementById('heroAuthCtaBtn');
  const isAuthenticated = authManager.isAuthenticated();

  if (heroCtaBtn) {
    if (isAuthenticated) {
      heroCtaBtn.setAttribute('href', 'srs-review.html');
      heroCtaBtn.textContent = 'Vào phòng ôn tập SRS';
    } else {
      heroCtaBtn.setAttribute('href', 'register.html');
      heroCtaBtn.textContent = 'Bắt đầu học ngay';
    }
  }
}
