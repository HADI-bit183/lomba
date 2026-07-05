(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  function createElement(className, attributes = {}) {
    const element = document.createElement('div');
    element.className = className;
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    return element;
  }

  function decorateEnvironment(body) {
    const ambient = createElement('nm-ambient', { 'aria-hidden': 'true' });
    ambient.append(
      createElement('nm-ambient-orb'),
      createElement('nm-ambient-orb'),
      createElement('nm-ambient-orb')
    );

    const cursorAura = createElement('nm-cursor-aura', { 'aria-hidden': 'true' });
    body.prepend(ambient, cursorAura);
  }

  function identifyPage(body) {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    const page = filename.replace(/\.html$/i, '') || 'index';
    body.classList.add(`page-${page === 'index' ? 'home' : page}`, 'ui-refreshed');

    document.querySelectorAll('main > section').forEach((section, index) => {
      section.dataset.nmSection = String(index + 1).padStart(2, '0');
    });

    document.querySelectorAll('#navbar .nav-link, #navbar .dropdown-item').forEach((link) => {
      const href = (link.getAttribute('href') || '').split('#')[0];
      if (href && href === filename) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initScrollExperience(body) {
    const progress = createElement('page-progress', { 'aria-hidden': 'true' });
    body.prepend(progress);

    const navbar = document.getElementById('navbar');
    let ticking = false;

    const syncScroll = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const amount = range > 0 ? Math.min(Math.max(window.scrollY / range, 0), 1) : 0;
      progress.style.transform = `scaleX(${amount})`;
      navbar?.classList.toggle('nav-scrolled', window.scrollY > 28);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncScroll);
    }, { passive: true });

    window.addEventListener('resize', syncScroll, { passive: true });
    syncScroll();
  }

  function initPointerExperience(body) {
    if (!finePointer || reduceMotion) return;

    let pointerFrame = 0;
    let latestX = window.innerWidth / 2;
    let latestY = window.innerHeight / 3;

    window.addEventListener('pointermove', (event) => {
      latestX = event.clientX;
      latestY = event.clientY;
      body.classList.add('nm-pointer-active');

      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--nm-mouse-x', `${latestX}px`);
        document.documentElement.style.setProperty('--nm-mouse-y', `${latestY}px`);
        pointerFrame = 0;
      });
    }, { passive: true });

    document.addEventListener('mouseleave', () => body.classList.remove('nm-pointer-active'));

    document.querySelectorAll('.unified-card, .pricing-card, .pricing-card-pro, .timeline-content').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });

    const orbit = document.querySelector('.orbit-stage');
    const heroVisual = document.querySelector('.hero-visual');
    heroVisual?.addEventListener('pointermove', (event) => {
      if (!orbit) return;
      const rect = heroVisual.getBoundingClientRect();
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 7;
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -7;
      orbit.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }, { passive: true });
    heroVisual?.addEventListener('pointerleave', () => {
      if (orbit) orbit.style.transform = '';
    });

    document.querySelectorAll('.premium-btn, .hero-actions .btn, #global-ai-fab').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        button.style.translate = `${x}px ${y}px`;
      }, { passive: true });
      button.addEventListener('pointerleave', () => {
        button.style.translate = '';
      });
    });
  }

  function initRevealSystem() {
    const revealSelector = [
      'main > section:not(:first-child) .section-title',
      'main > section:not(:first-child) .unified-card:not([data-aos])',
      'main > section:not(:first-child) .glass-card:not([data-aos])',
      'main > section:not(:first-child) .accordion-item',
      'main > section:not(:first-child) .analysis-card',
      'main > section:not(:first-child) .resource-card',
      'main > section:not(:first-child) .mentor-card'
    ].join(',');

    const revealObserver = !reduceMotion && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('nm-visible');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
      : null;

    const decorateReveal = (element, index = 0) => {
      if (!(element instanceof HTMLElement) || element.classList.contains('nm-reveal')) return;
      if (element.hasAttribute('data-aos')) return;
      element.classList.add('nm-reveal');
      element.style.setProperty('--nm-delay', `${Math.min(index % 4, 3) * 70}ms`);

      if (reduceMotion || !revealObserver) {
        element.classList.add('nm-visible');
      } else {
        revealObserver.observe(element);
      }
    };

    document.querySelectorAll(revealSelector).forEach(decorateReveal);

    const sectionObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('nm-section-visible');
          });
        }, { threshold: 0.08 })
      : null;

    document.querySelectorAll('main > section').forEach((section) => {
      if (sectionObserver) sectionObserver.observe(section);
      else section.classList.add('nm-section-visible');
    });

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node, index) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches('.unified-card, .glass-card, .resource-card, .mentor-card, .slide-preview')) {
            decorateReveal(node, index);
          }
          node.querySelectorAll?.('.unified-card, .glass-card, .resource-card, .mentor-card, .slide-preview')
            .forEach((element, childIndex) => decorateReveal(element, childIndex));
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function initCounters() {
    const counters = document.querySelectorAll('.counter:not(.counter-up)[data-target]');
    const animateCounter = (counter) => {
      const target = Number(counter.dataset.target || 0);
      if (!Number.isFinite(target)) return;
      if (reduceMotion) {
        counter.textContent = target.toLocaleString('en-US');
        return;
      }

      const startedAt = performance.now();
      const duration = 1450;
      const draw = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        counter.textContent = Math.floor(target * eased).toLocaleString('en-US');
        if (progress < 1) window.requestAnimationFrame(draw);
      };
      window.requestAnimationFrame(draw);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });
      counters.forEach((counter) => observer.observe(counter));
    } else {
      counters.forEach(animateCounter);
    }
  }

  function initControlFeedback(body) {
    document.addEventListener('pointerdown', (event) => {
      const button = event.target.closest('.btn, .premium-btn, .filter-btn');
      if (!button || button.disabled || reduceMotion) return;

      const rect = button.getBoundingClientRect();
      const ripple = createElement('nm-ripple', { 'aria-hidden': 'true' });
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 680);
    });

    document.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.classList.toggle('has-file', Boolean(input.files?.length));
        input.closest('.input-group, .border-dashed')?.classList.toggle('has-file', Boolean(input.files?.length));
      });
    });

    const themeToggle = document.getElementById('dark-mode-toggle');
    const hasGlobalBundle = Boolean(document.querySelector('script[src$="js/bundle.js"], script[src$="/bundle.js"]'));
    const applyTheme = (dark) => {
      document.documentElement.classList.toggle('dark-theme', dark);
      document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
      document.body.classList.toggle('dark-theme', dark);
      themeToggle?.querySelector('i')?.setAttribute(
        'class',
        dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'
      );
    };

    if (!hasGlobalBundle) {
      const savedTheme = localStorage.getItem('theme');
      const dark = savedTheme
        ? savedTheme === 'dark'
        : document.documentElement.dataset.theme === 'dark' ||
          window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(dark);
      themeToggle?.addEventListener('click', () => {
        const nextDark = !document.documentElement.classList.contains('dark-theme');
        applyTheme(nextDark);
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        window.dispatchEvent(new Event('themeChanged'));
      });
    }

    const updateThemeLabel = () => {
      const dark = document.documentElement.classList.contains('dark-theme');
      themeToggle?.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle?.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
    };
    updateThemeLabel();
    themeToggle?.addEventListener('click', () => window.requestAnimationFrame(updateThemeLabel));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') body.classList.add('keyboard-navigation');
    });
    document.addEventListener('pointerdown', () => body.classList.remove('keyboard-navigation'));
  }

  function initNavigation() {
    document.querySelectorAll('#navMenu .nav-link, #navMenu .dropdown-item').forEach((link) => {
      link.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        if (menu?.classList.contains('show') && window.bootstrap?.Collapse) {
          window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      });
    });
  }

  function ready() {
    const body = document.body;
    decorateEnvironment(body);
    identifyPage(body);
    initScrollExperience(body);
    initPointerExperience(body);
    initRevealSystem();
    initCounters();
    initControlFeedback(body);
    initNavigation();

    const preloader = document.getElementById('preloader');
    if (preloader) {
      window.setTimeout(() => {
        if (!document.body.contains(preloader)) return;
        preloader.style.opacity = '0';
        window.setTimeout(() => preloader.remove(), 500);
      }, 3200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
})();

// Global Loading Utilities
window.showLoading = function(text = 'Loading...') {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `
      <div class="spinner-modern"></div>
      <div class="fw-medium text-primary mt-2" id="global-loader-text"></div>
    `;
    document.body.appendChild(loader);
  }
  document.getElementById('global-loader-text').textContent = text;
  // Trigger reflow
  void loader.offsetWidth;
  loader.classList.add('show');
};

window.hideLoading = function() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.remove('show');
  }
};
