document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      once: true,
      duration: 800,
      easing: 'ease-out-cubic'
    });
  }

  if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
    particlesJS('particles-js', {
      particles: {
        number: { value: 80 },
        color: { value: ['#2563EB', '#7C3AED', '#06B6D4'] },
        size: { value: 3 },
        move: { speed: 2 },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#2563EB',
          opacity: 0.3
        }
      },
      interactivity: {
        events: { onhover: { enable: true, mode: 'repulse' } }
      }
    });
  }

  if (typeof Swiper !== 'undefined') {
    if (document.querySelector('.projects-swiper')) {
      new Swiper('.projects-swiper', {
        slidesPerView: 3,
        spaceBetween: 30,
        loop: true,
        grabCursor: true,
        autoplay: {
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        navigation: {
          nextEl: '.projects-swiper .swiper-button-next',
          prevEl: '.projects-swiper .swiper-button-prev'
        },
        breakpoints: {
          1200: { slidesPerView: 3, spaceBetween: 30 },
          768: { slidesPerView: 2, spaceBetween: 20 },
          0: { slidesPerView: 1, spaceBetween: 16 }
        }
      });
    }

    if (document.querySelector('.news-swiper')) {
      new Swiper('.news-swiper', {
        slidesPerView: 2,
        spaceBetween: 20,
        loop: true,
        navigation: {
          nextEl: '.news-swiper .swiper-button-next',
          prevEl: '.news-swiper .swiper-button-prev'
        },
        breakpoints: {
          1200: { slidesPerView: 2 },
          0: { slidesPerView: 1 }
        }
      });
    }
  }

  const counters = document.querySelectorAll('.counter[data-target]');
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.target || 0);
    if (!Number.isFinite(target)) return;

    const startedAt = performance.now();
    const duration = 1400;
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
    }, { threshold: 0.6 });
    counters.forEach((counter) => observer.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  document.querySelectorAll('a[href^="#"], button[data-target]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const targetId = trigger.dataset.target || trigger.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
