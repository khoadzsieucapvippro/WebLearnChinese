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
    const safeUrl = resolveSubpathAudioUrl(rawAudioUrl);
    const audio = new Audio(safeUrl);

    audio.play().catch(() => {
      // Graceful fallback to Web Speech API synthesis if audio file playback is blocked
      speakHanzi('学');
    });
  });
}

/**
 * Synchronizes hero and banner CTA buttons based on authentication status.
 */
export function syncHomepageSessionCtas() {
  const heroCtaBtn = document.getElementById('heroAuthCtaBtn');
  const bannerCtaBtn = document.getElementById('bannerAuthCtaBtn');

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

  if (bannerCtaBtn) {
    if (isAuthenticated) {
      bannerCtaBtn.setAttribute('href', 'srs-dashboard.html');
      bannerCtaBtn.textContent = 'Xem tiến độ học tập';
    } else {
      bannerCtaBtn.setAttribute('href', 'register.html');
      bannerCtaBtn.textContent = 'Đăng ký tài khoản miễn phí';
    }
  }
}
