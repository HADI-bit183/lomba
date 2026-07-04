(() => {
  'use strict';

  const ready = () => {
    const body = document.body;
    const rawPage = window.location.pathname.split('/').pop() || 'index.html';
    const page = rawPage.replace('.html', '') || 'index';
    body.classList.add(`page-${page === 'index' ? 'home' : page}`, 'ui-refreshed');

    // Active navigation state.
    document.querySelectorAll('#navbar .nav-link').forEach((link) => {
      const href = (link.getAttribute('href') || '').split('#')[0];
      const isHome = rawPage === '' && href === 'index.html';
      if (href === rawPage || isHome) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    // A slim progress line gives long pages a quiet sense of place.
    const progress = document.createElement('div');
    progress.className = 'page-progress';
    progress.setAttribute('aria-hidden', 'true');
    body.prepend(progress);

    const navbar = document.getElementById('navbar');
    let ticking = false;
    const syncScroll = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const amount = range > 0 ? Math.min(window.scrollY / range, 1) : 0;
      progress.style.transform = `scaleX(${amount})`;
      navbar?.classList.toggle('nav-scrolled', window.scrollY > 24);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(syncScroll);
        ticking = true;
      }
    }, { passive: true });
    syncScroll();

    // Card spotlight follows the pointer without heavy canvas effects.
    if (window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.unified-card, .pricing-card, .pricing-card-pro').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
          card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
        }, { passive: true });
      });
    }

    // Number animation for the home statistics (the legacy bundle only
    // handled dashboard counters).
    const counters = document.querySelectorAll('.counter:not(.counter-up)[data-target]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animateCounter = (counter) => {
      const target = Number(counter.dataset.target || 0);
      if (reduceMotion) {
        counter.textContent = target.toLocaleString('en-US');
        return;
      }

      const start = performance.now();
      const duration = 1350;
      const draw = (now) => {
        const progressValue = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progressValue, 4);
        counter.textContent = Math.floor(target * eased).toLocaleString('en-US');
        if (progressValue < 1) window.requestAnimationFrame(draw);
      };
      window.requestAnimationFrame(draw);
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });
      counters.forEach((counter) => counterObserver.observe(counter));
    } else {
      counters.forEach(animateCounter);
    }

    // The theme switch should announce its current action.
    const themeToggle = document.getElementById('dark-mode-toggle');
    const updateThemeLabel = () => {
      const dark = document.documentElement.classList.contains('dark-theme');
      themeToggle?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle?.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
    };
    updateThemeLabel();
    themeToggle?.addEventListener('click', () => window.requestAnimationFrame(updateThemeLabel));

    // Close the mobile navigation after choosing a route.
    document.querySelectorAll('#navMenu .nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        if (menu?.classList.contains('show') && window.bootstrap?.Collapse) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
