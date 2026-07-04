
// --- Design System Helpers ---
window.getThemeToken = function(tokenName) {
  return getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim() || '#2563EB';
};

window.hexToRgba = function(hex, alpha = 1) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

window.getTokenRgba = function(tokenName, alpha = 1) {
  const hex = window.getThemeToken(tokenName);
  return window.hexToRgba(hex, alpha);
};
// -----------------------------

(function() {
// NovaMind Global Bundle

/* --- theme.js --- */
function initTheme() {
  const toggle = document.getElementById('dark-mode-toggle');
  
  const updateToggleIcon = (isDark) => {
    const icon = toggle?.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  };

  const isDark = document.documentElement.classList.contains('dark-theme');
  updateToggleIcon(isDark);

  toggle?.addEventListener('click', () => {
    const willBeDark = !document.documentElement.classList.contains('dark-theme');
    if (willBeDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    updateToggleIcon(willBeDark);
    window.dispatchEvent(new Event('themeChanged'));
  });
}


/* --- animations.js --- */
function initAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded.');
    // Simple fallback for data-aos so they don't remain hidden
    const aosElements = document.querySelectorAll('[data-aos]');
    aosElements.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  
  gsap.registerPlugin(ScrollTrigger);

  // Initialize Swiper Carousel
  if (typeof Swiper !== 'undefined' && document.querySelector('.home-swiper')) {
    new Swiper('.home-swiper', {
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      effect: 'fade',
      fadeEffect: {
        crossFade: true
      },
      autoHeight: true
    });
  }

  // Preloader GSAP
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      gsap.to(preloader, { opacity: 0, duration: 0.6, ease: "power3.out", onComplete: () => preloader.remove() });
    });
  }

  let mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    // Replace AOS with GSAP ScrollTrigger (Optimized - 40% Less Animations)
    const aosElements = document.querySelectorAll('[data-aos]');
    
    // Filter only important elements for storytelling
    const importantElements = Array.from(aosElements).filter(el => {
      return (el.tagName === 'H1' && !el.classList.contains('hero-title')) || el.tagName === 'H2' || el.classList.contains('unified-card') || el.classList.contains('card');
    });

    // Make non-important elements visible immediately to save performance
    aosElements.forEach(el => {
      if (!importantElements.includes(el)) {
        gsap.set(el, { opacity: 1, y: 0 });
      }
    });

    importantElements.forEach(el => {
      const delayAttr = el.getAttribute('data-aos-delay');
      const delay = delayAttr ? parseInt(delayAttr) / 1000 : 0;
      
      // Add will-change for performance
      el.style.willChange = 'transform, opacity, clip-path';

      gsap.set(el, { 
        opacity: 0, 
        y: 30,
        clipPath: "inset(10% 0 0 0)"
      });
      
      gsap.to(el, {
        opacity: 1,
        y: 0,
        clipPath: "inset(0% 0 0 0)",
        duration: 0.8,
        delay: delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%", 
          toggleActions: "play none none none"
        },
        onComplete: () => {
          el.style.willChange = 'auto';
        }
      });
    });

    // 3D Tilt Effect for Cards
    const tiltCards = document.querySelectorAll('.unified-card, .hover-lift');
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const tiltX = ((y - centerY) / centerY) * -5;
        const tiltY = ((x - centerX) / centerX) * 5;
        
        gsap.to(card, {
          rotationX: tiltX,
          rotationY: tiltY,
          transformPerspective: 1000,
          ease: 'power2.out',
          duration: 0.4
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          ease: 'power3.out',
          duration: 0.6
        });
      });
    });
  });

  // For mobile (fallback)
  mm.add("(max-width: 767px)", () => {
    const aosElements = document.querySelectorAll('[data-aos]');
    aosElements.forEach(el => {
      gsap.set(el, { opacity: 1, y: 0 });
    });
  });

  // Hero Section Stagger Animation
  const heroElements = document.querySelectorAll('#hero .hero-eyebrow, #hero .hero-title, #hero .hero-lead, #hero .hero-actions');
  if (heroElements.length > 0) {
    gsap.from(heroElements, {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.5
    });
  }

  // Back-to-top logic
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    // Initial state
    gsap.set(backToTop, { opacity: 0, display: 'none' });
    
    let isVisible = false;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300 && !isVisible) {
        isVisible = true;
        gsap.to(backToTop, { opacity: 1, display: 'flex', duration: 0.3 });
      } else if (window.scrollY <= 300 && isVisible) {
        isVisible = false;
        gsap.to(backToTop, { opacity: 0, display: 'none', duration: 0.3 });
      }
    });
    backToTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // Team Hover GSAP Micro-interactions
  const teamIllustrations = document.querySelectorAll('.team-illustration, .team-img');
  teamIllustrations.forEach(img => {
    img.addEventListener('mouseenter', () => {
      gsap.to(img, {
        scale: 1.05,
        rotation: 2,
        duration: 0.3,
        ease: "power3.out"
      });
    });
    img.addEventListener('mouseleave', () => {
      gsap.to(img, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "power3.out"
      });
    });
  });

  // World Map Hover Interactivity
  const mapPulses = document.querySelectorAll('.map-pulse');
  mapPulses.forEach((pulse, i) => {
    pulse.addEventListener('mouseenter', () => {
      gsap.to(pulse, {
        scale: 2,
        boxShadow: "0 0 0 15px rgba(79, 70, 229, 0.2)",
        duration: 0.5,
        ease: "power3.out"
      });
      // Tooltip effect (assuming we append a label)
      const label = document.createElement('span');
      label.className = 'map-tooltip position-absolute bg-dark text-white rounded px-2 py-1 small shadow-sm';
      label.textContent = "Global Node " + (i + 1);
      label.style.top = "-30px";
      label.style.left = "-20px";
      label.style.whiteSpace = "nowrap";
      pulse.appendChild(label);
      gsap.fromTo(label, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
    });
    pulse.addEventListener('mouseleave', () => {
      gsap.to(pulse, {
        scale: 1,
        boxShadow: "0 0 0 0 rgba(79, 70, 229, 0)",
        duration: 0.5,
        ease: "power3.out"
      });
      const label = pulse.querySelector('.map-tooltip');
      if (label) {
        gsap.to(label, { y: 10, opacity: 0, duration: 0.2, onComplete: () => label.remove() });
      }
    });
  });
}


/* --- validation.js --- */
function initValidation() {
  const form = document.getElementById('multiStepForm');
  if (!form) return;

  const inputs = form.querySelectorAll('input[required]');
  
  // Inject AI tooltip container
  const aiTooltip = document.createElement('div');
  aiTooltip.id = 'ai-form-tooltip';
  aiTooltip.className = 'position-absolute glass shadow-lg rounded-3 p-2 d-none align-items-center gap-2';
  aiTooltip.style.cssText = 'z-index: 1000; border: 1px solid var(--color-primary); font-size: 0.75rem; color: var(--color-gray-700); transform: translateY(-100%); transition: all 0.3s ease;';
  aiTooltip.innerHTML = '<i class="fa-solid fa-sparkles text-primary"></i> <span id="ai-form-text">AI is thinking...</span>';
  document.body.appendChild(aiTooltip);

  const showAITooltip = (inputEl, message) => {
    const rect = inputEl.getBoundingClientRect();
    const textSpan = document.getElementById('ai-form-text');
    textSpan.textContent = message;
    
    aiTooltip.style.left = `${rect.left + window.scrollX}px`;
    aiTooltip.style.top = `${rect.top + window.scrollY - 10}px`;
    aiTooltip.classList.remove('d-none');
    aiTooltip.classList.add('d-flex');
  };

  const hideAITooltip = () => {
    aiTooltip.classList.remove('d-flex');
    aiTooltip.classList.add('d-none');
  };

  inputs.forEach(input => {
    const validateInput = () => {
      if (input.type === 'radio' || input.type === 'file') return;
      
      const val = input.value.trim();

      if (input.checkValidity() && val !== '') {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        
        // AI Contextual Feedback
        if (input.type === 'email') {
          showAITooltip(input, "Valid email format detected. We'll send updates here.");
        } else if (input.id === 'leaderName' || input.id === 'teamName') {
          if (val.length > 5) showAITooltip(input, `Great name, ${val}!`);
          else showAITooltip(input, "Keep typing...");
        } else {
          hideAITooltip();
        }

      } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        
        if (val.length > 0) {
           if (input.type === 'email') showAITooltip(input, "Hmm, that email doesn't look quite right.");
           else showAITooltip(input, "Please complete this field.");
        } else {
           hideAITooltip();
        }
      }
    };
    
    input.addEventListener('input', validateInput);
    input.addEventListener('keyup', validateInput);
    input.addEventListener('blur', hideAITooltip);
  });
}


/* --- dashboard.js --- */
function initDashboard() {
  // Load user data from localStorage
  const userData = JSON.parse(localStorage.getItem('novaMindUser'));
  if (userData) {
    const dashWelcomeTitle = document.getElementById('dashWelcomeTitle');
    if (dashWelcomeTitle) dashWelcomeTitle.textContent = `Hello, ${userData.leaderName}.`;
    
    const dashWelcomeSubtitle = document.getElementById('dashWelcomeSubtitle');
    if (dashWelcomeSubtitle) dashWelcomeSubtitle.textContent = `Welcome to your NovaMind portal. ${userData.teamName} (${userData.category})`;
    
    const notifWelcome = document.getElementById('notificationWelcome');
    if (notifWelcome) notifWelcome.textContent = `Welcome, ${userData.teamName}`;
  }

  // Single source of truth for the next submission deadline.
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const targetDate = new Date('2026-10-17T23:59:59+07:00').getTime();

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        countdownEl.textContent = 'Deadline passed';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      countdownEl.textContent = `${days}d ${hours}h ${minutes}m`;
    }
    
    setInterval(updateCountdown, 1000 * 60);
    updateCountdown();
  }


  // Counter-Up Animation Logic
  try {
    if (typeof gsap !== 'undefined') {
      const counters = document.querySelectorAll('.counter-up');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || '0', 10);
        // Animate counting up from 0
        gsap.to(counter, {
          innerHTML: target,
          duration: 2,
          snap: { innerHTML: 1 },
          ease: "power3.out",
          scrollTrigger: {
            trigger: counter,
            start: "top 90%",
            toggleActions: "play none none none"
          }
        });
      });
    }
  } catch (err) {
    console.warn('Counter-up animation failed:', err);
  }

  // Initialize Interactive Chart
  try {
    const ctx = document.getElementById('teamActivityChart');
  if (ctx && typeof Chart !== 'undefined') {
    
    // Get primary color from CSS variables or default
    const computedStyle = getComputedStyle(document.documentElement);
    let primaryColor = computedStyle.getPropertyValue('--color-primary').trim() || window.getThemeToken('--primary');
    // Remove # if hex for rgba parsing, though Chart.js can handle hex or rgba directly
    // Assuming primaryColor is hex like #4f46e5
    
    const dataSets = {
      daily: [85, 70, 90, 80, 60],
      monthly: [75, 80, 85, 70, 80],
      yearly: [90, 85, 95, 90, 85]
    };

    const radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Innovation', 'Technical Depth', 'Design', 'Feasibility', 'Presentation'],
        datasets: [{
          label: 'Your Team',
          data: [...dataSets.daily],
          fill: true,
          backgroundColor: window.getTokenRgba('--primary', 0.2), // Could also use JS to convert hex to rgba
          borderColor: primaryColor,
          pointBackgroundColor: primaryColor,
          pointBorderColor: window.getThemeToken('--bg-primary'),
          pointHoverBackgroundColor: window.getThemeToken('--bg-primary'),
          pointHoverBorderColor: primaryColor
        }, {
          label: 'Avg Top Contender',
          data: [80, 90, 85, 85, 90],
          fill: true,
          backgroundColor: window.getTokenRgba('--success', 0.2),
          borderColor: window.getTokenRgba('--success', 1),
          pointBackgroundColor: window.getTokenRgba('--success', 1),
          pointBorderColor: window.getThemeToken('--bg-primary'),
          pointHoverBackgroundColor: window.getThemeToken('--bg-primary'),
          pointHoverBorderColor: window.getTokenRgba('--success', 1)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 20
        },
        scales: {
          r: {
            angleLines: { display: false },
            grid: { display: false },
            pointLabels: { color: window.getTokenRgba('--text-secondary', 1), font: { family: 'Inter, sans-serif' } },
            ticks: { display: false }
          }
        },
        plugins: {
          legend: {
            labels: { color: window.getTokenRgba('--text-secondary', 1), font: { family: 'Inter, sans-serif' }, usePointStyle: true, boxWidth: 8 }
          },
          tooltip: {
            backgroundColor: window.getTokenRgba('--text-primary', 0.85),
            titleFont: { family: 'Inter, sans-serif', size: 16, weight: 'bold' },
            bodyFont: { family: 'Inter, sans-serif', size: 14 },
            padding: 16,
            cornerRadius: 12,
            displayColors: true,
            boxPadding: 8,
            caretPadding: 12
          }
        }
      }
    });

    // Chart Filter Logic
    const buttons = {
      daily: document.getElementById('filter-daily'),
      monthly: document.getElementById('filter-monthly'),
      yearly: document.getElementById('filter-yearly')
    };

    let currentPeriod = 'daily';

    const updateChart = (period) => {
      currentPeriod = period;
      // Update active class
      Object.values(buttons).forEach(btn => btn?.classList.remove('active'));
      buttons[period]?.classList.add('active');

      // Update data and animate
      radarChart.data.datasets[0].data = [...dataSets[period]];
      radarChart.update();
    };

    buttons.daily?.addEventListener('click', () => updateChart('daily'));
    buttons.monthly?.addEventListener('click', () => updateChart('monthly'));
    buttons.yearly?.addEventListener('click', () => updateChart('yearly'));

    // Real-time Data Stream Simulation (Fungsionalitas Premium)
    setInterval(() => {
      // Slightly fluctuate the current period's data
      const currentData = radarChart.data.datasets[0].data;
      const baseData = dataSets[currentPeriod];
      
      for(let i=0; i<currentData.length; i++) {
        // Fluctuate randomly between -3 and +3 around base, clamped 0-100
        let shift = Math.floor(Math.random() * 7) - 3; 
        currentData[i] = Math.max(0, Math.min(100, baseData[i] + shift));
      }
      
      radarChart.update('none'); // Update without full animation for a live feel
    }, 2500);
  }
  } catch (err) {
    console.warn('Dashboard Chart initialization failed:', err);
  }
}


/* --- ai.js --- */
function initAI() {
  try {
    // 1. Inject Global AI FAB & Modal UI
    const aiHTML = `
      <!-- Global AI FAB -->
      <button id="global-ai-fab" class="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center" style="position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; z-index: 1040; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <i class="fa-solid fa-sparkles fs-4"></i>
      </button>

      <!-- Global AI Modal -->
      <div id="global-ai-modal" class="position-fixed shadow-xl rounded-4 overflow-hidden" style="bottom: 100px; right: 24px; width: 350px; max-width: calc(100vw - 48px); height: 500px; max-height: calc(100vh - 120px); background: var(--card-bg); z-index: 1050; display: none; flex-direction: column; opacity: 0; transform: translateY(20px); border: 1px solid rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div class="bg-gradient text-white p-3 d-flex justify-content-between align-items-center" style="background: var(--gradient-primary) !important;">
          <div class="d-flex align-items-center gap-2">
            <img src="assets/logo.svg" alt="NovaMind Logo" width="24" height="24">
            <h6 class="mb-0 fw-bold text-white">NovaMind AI</h6>
          </div>
          <button id="close-global-ai" class="btn btn-sm btn-link text-white p-0"><i class="fa-solid fa-xmark fs-5"></i></button>
        </div>

        <!-- Chat Body -->
        <div id="global-ai-messages" class="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3" style="background: var(--color-gray-50);">
          <div class="chat-bot">
            <span class="chat-text" style="background: var(--card-bg); border: 1px solid rgba(0,0,0,0.05); padding: 12px; border-radius: 12px; border-top-left-radius: 4px; display: inline-block; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              Hello! I'm your contextual AI guide. How can I help you today?
            </span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-3 border-top border-opacity-25" style="background: var(--card-bg); border-color: var(--color-gray-200) !important;">
          <form id="global-ai-form" class="position-relative">
            <input type="text" id="global-ai-input" class="form-control rounded-pill pe-5" placeholder="Ask anything..." style="font-size: 0.9rem; border: 1px solid var(--color-gray-300); background: var(--color-gray-50); box-shadow: none !important;">
            <button type="submit" class="btn btn-primary rounded-circle position-absolute top-50 end-0 translate-middle-y me-1 d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px; min-width: 32px;">
              <i class="fa-solid fa-arrow-up" style="font-size: 0.8rem;"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    const isAIAssistantPage = window.location.pathname.includes('ai-assistant.html');
    
    // Only inject if it doesn't exist and we are NOT on the dedicated AI page
    if (!document.getElementById('global-ai-fab') && !isAIAssistantPage) {
      document.body.insertAdjacentHTML('beforeend', aiHTML);
    }

    // 2. Logic & Interactions
    const fab = document.getElementById('global-ai-fab');
    const modal = document.getElementById('global-ai-modal');
    const closeBtn = document.getElementById('close-global-ai');
    const form = document.getElementById('global-ai-form');
    const input = document.getElementById('global-ai-input');
    const messages = document.getElementById('global-ai-messages');

    if (fab && modal && closeBtn && form && input && messages) {
      let isOpen = false;

      // Toggle Modal using GSAP
      fab.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
          modal.style.display = 'flex';
          gsap.to(modal, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
          gsap.to(fab, { scale: 0.8, rotate: 45, duration: 0.3 });
        } else {
          gsap.to(modal, { 
            opacity: 0, 
            y: 20, 
            duration: 0.3, 
            ease: "power2.in",
            onComplete: () => { modal.style.display = 'none'; }
          });
          gsap.to(fab, { scale: 1, rotate: 0, duration: 0.3 });
        }
      });

      closeBtn.addEventListener('click', () => {
        isOpen = false;
        gsap.to(modal, { opacity: 0, y: 20, duration: 0.3, onComplete: () => { modal.style.display = 'none'; }});
        gsap.to(fab, { scale: 1, rotate: 0, duration: 0.3 });
      });

      // OpenAI-backed chat logic. The browser only calls our local endpoint;
      // the API key remains on the server.
      const chatHistory = [];
      const submitButton = form.querySelector('button[type="submit"]');

      function appendMessage(text, isUser = false) {
        const msg = document.createElement('div');
        msg.className = isUser ? 'chat-user align-self-end text-end d-flex gap-2' : 'chat-bot align-self-start d-flex gap-2';
        
        const avatar = document.createElement('div');
        if (isUser) {
          const i = document.createElement('i');
          i.className = 'fa-solid fa-user text-primary';
          avatar.appendChild(i);
        } else {
          avatar.className = 'bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 p-1 border border-primary border-opacity-25';
          const img = document.createElement('img');
          img.src = 'assets/logo.svg';
          img.alt = 'AI';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          avatar.appendChild(img);
        }

        const messageStyle = isUser 
          ? `background: var(--color-primary); color: white; padding: 12px; border-radius: 12px; border-bottom-right-radius: 4px; display: inline-block; font-size: 0.9rem; max-width: 85%; box-shadow: 0 2px 8px rgba(37,99,235,0.2);`
          : `background: var(--card-bg); color: var(--color-gray-900); border: 1px solid rgba(0,0,0,0.05); padding: 12px; border-radius: 12px; border-top-left-radius: 4px; display: inline-block; font-size: 0.9rem; max-width: 85%; box-shadow: 0 2px 8px rgba(0,0,0,0.02);`;

        const messageText = document.createElement('span');
        messageText.className = 'chat-text';
        messageText.style.cssText = messageStyle;
        messageText.textContent = text;

        msg.appendChild(messageText);
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
      }

      async function requestAI(text) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 50_000);

        try {
          const response = await fetch('api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              history: chatHistory.slice(-10)
            }),
            signal: controller.signal
          });
          const data = await response.json().catch(() => ({}));

          if (!response.ok || !data.answer) {
            throw new Error(data.error || 'AI belum dapat menjawab.');
          }

          return data.answer;
        } finally {
          window.clearTimeout(timeout);
        }
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || input.disabled) return;
        
        appendMessage(text, true);
        input.value = '';
        input.disabled = true;
        if (submitButton) submitButton.disabled = true;

        const typing = document.createElement('div');
        typing.className = 'chat-bot align-self-start typing-wrapper w-100';
        typing.innerHTML = `
          <div class="chat-text" style="background: var(--card-bg); border: 1px solid rgba(0,0,0,0.05); padding: 16px; border-radius: 12px; border-top-left-radius: 4px; display: inline-block; width: 80%; max-width: 400px;">
            <div class="skeleton-shimmer skeleton-text"></div>
            <div class="skeleton-shimmer skeleton-text"></div>
            <div class="skeleton-shimmer skeleton-text short"></div>
          </div>
        `;
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        try {
          const answer = await requestAI(text);
          if (messages.contains(typing)) messages.removeChild(typing);
          appendMessage(answer, false);
          chatHistory.push(
            { role: 'user', content: text },
            { role: 'assistant', content: answer }
          );
        } catch (error) {
          if (messages.contains(typing)) messages.removeChild(typing);
          const message = error.name === 'AbortError'
            ? 'Jawaban AI terlalu lama. Silakan coba lagi.'
            : error.message;
          appendMessage(message, false);
        } finally {
          input.disabled = false;
          if (submitButton) submitButton.disabled = false;
          input.focus();
        }
      });
    }

  } catch (err) {
    console.warn("AI module init error:", err);
  }
}


/* --- app.js --- */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAnimations();
  initValidation();
  initDashboard();
  initAI();
});


})();
