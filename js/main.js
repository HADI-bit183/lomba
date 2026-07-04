/* /Users/user/Downloads/lomba/NovaMind/js/main.js */
/* Main interactive functionality: animations, swipers, charts, quiz, map, gallery, forms */

document.addEventListener('DOMContentLoaded', () => {
  // Particles.js background for hero section
  particlesJS('particles-js', {
    particles: {
      number: { value: 80 },
      color: { value: ['#2563EB', '#7C3AED', '#06B6D4'] },
      size: { value: 3 },
      move: { speed: 2 },
      line_linked: { enable: true, distance: 150, color: '#2563EB', opacity: 0.3 }
    },
    interactivity: {
      events: { onhover: { enable: true, mode: 'repulse' } }
    }
  });

  // Initialize Swiper instances for various sections
  const techSwiper = new Swiper('.technology-swiper', {
    slidesPerView: 4,
    spaceBetween: 20,
    loop: true,
    pagination: { el: '.technology-swiper .swiper-pagination', clickable: true },
    navigation: { nextEl: '.technology-swiper .swiper-button-next', prevEl: '.technology-swiper .swiper-button-prev' },
    breakpoints: {
      1200: { slidesPerView: 4 },
      992: { slidesPerView: 3 },
      768: { slidesPerView: 2 },
      0: { slidesPerView: 1 }
    }
  });

  const projectsSwiper = new Swiper('.projects-swiper', {
    slidesPerView: 3,
    spaceBetween: 30,
    loop: true,
    grabCursor: true,
    centeredSlides: false,
    speed: 800,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    pagination: { el: '.projects-swiper .swiper-pagination', clickable: true, dynamicBullets: true },
    navigation: { nextEl: '.projects-swiper .swiper-button-next', prevEl: '.projects-swiper .swiper-button-prev' },
    breakpoints: {
      1200: { slidesPerView: 3, spaceBetween: 30 },
      768: { slidesPerView: 2, spaceBetween: 20 },
      0: { slidesPerView: 1, spaceBetween: 16 }
    }
  });

  const eventsSwiper = new Swiper('.events-swiper', {
    slidesPerView: 2,
    spaceBetween: 20,
    loop: true,
    pagination: { el: '.events-swiper .swiper-pagination', clickable: true },
    navigation: { nextEl: '.events-swiper .swiper-button-next', prevEl: '.events-swiper .swiper-button-prev' },
    breakpoints: {
      1200: { slidesPerView: 2 },
      0: { slidesPerView: 1 }
    }
  });

  const testimonialSwiper = new Swiper('.testimonials-swiper', {
    slidesPerView: 1,
    loop: true,
    pagination: { el: '.testimonials-swiper .swiper-pagination', clickable: true },
    autoplay: { delay: 5000 }
  });

  // Chart.js removed for performance

  // Counter animation on scroll using IntersectionObserver
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = +(entry.target.dataset.count || entry.target.dataset.target || 0);
        let count = 0;
        const step = target / 120;
        const update = () => {
          count += step;
          if (count < target) {
            entry.target.textContent = Math.ceil(count);
            requestAnimationFrame(update);
          } else {
            entry.target.textContent = target;
          }
        };
        update();
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  // World map hub tooltips
  const mapHubs = document.querySelectorAll('.map-hub');
  const tooltip = document.getElementById('map-tooltip');
  if (tooltip && mapHubs.length) {
    mapHubs.forEach(hub => {
      hub.addEventListener('mouseenter', e => {
        const region = hub.dataset.region;
        const innovators = hub.dataset.innovators;
        const projects = hub.dataset.projects;
        tooltip.innerHTML = `<strong>${region}</strong><br><span style="color:rgba(255,255,255,0.7)"><i class="fa-solid fa-users me-1"></i>${innovators} Innovators</span><br><span style="color:rgba(255,255,255,0.7)"><i class="fa-solid fa-diagram-project me-1"></i>${projects} Projects</span>`;
        tooltip.style.display = 'block';
      });
      hub.addEventListener('mousemove', e => {
        const wrapper = hub.closest('.map-wrapper');
        const rect = wrapper.getBoundingClientRect();
        tooltip.style.left = `${e.clientX - rect.left + 16}px`;
        tooltip.style.top = `${e.clientY - rect.top + 16}px`;
      });
      hub.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  }

  // Innovation Quiz logic – 20 questions
  const quizData = [
    { q: "What does AI stand for?", a: ["Artificial Intelligence","Automated Interface","Advanced Integration","Artificial Insight"], c: 0 },
    { q: "Which technology enables quantum superposition?", a: ["Superconductors","Qubits","Nanotubes","Photovoltaics"], c: 1 },
    { q: "What is the main benefit of blockchain in supply chains?", a: ["Increased speed","Transparency","Lower cost","Automation"], c: 1 },
    { q: "What does IoT stand for?", a: ["Internet of Things","Interface of Technology","Integrated Online Tools","Internal Operations Tech"], c: 0 },
    { q: "Which programming language is most used in AI?", a: ["Java","C++","Python","Ruby"], c: 2 },
    { q: "What is machine learning?", a: ["Manual programming","AI learning from data","Database management","Network security"], c: 1 },
    { q: "What is a neural network inspired by?", a: ["Computer circuits","Human brain","Solar systems","Blockchain"], c: 1 },
    { q: "What does VR stand for?", a: ["Variable Reality","Virtual Reality","Visual Rendering","Vector Rotation"], c: 1 },
    { q: "Which technology powers Bitcoin?", a: ["AI","Blockchain","IoT","Cloud Computing"], c: 1 },
    { q: "What is edge computing?", a: ["Processing at data source","Cloud storage","Social media","Web design"], c: 0 },
    { q: "What does GDPR protect?", a: ["Intellectual property","Personal data","Software code","Financial markets"], c: 1 },
    { q: "Which energy source is renewable?", a: ["Coal","Natural gas","Solar","Nuclear fission"], c: 2 },
    { q: "What is 5G?", a: ["5th generation mobile network","5 gigabyte storage","5 GPU processing","5th game engine"], c: 0 },
    { q: "What is NLP in AI?", a: ["Network Layer Protocol","Natural Language Processing","Numeric Logic Programming","Neural Learning Path"], c: 1 },
    { q: "What is a smart city?", a: ["City with fast internet","Urban area using IoT & AI","City with many startups","Digital shopping mall"], c: 1 },
    { q: "What does AR stand for?", a: ["Artificial Reality","Augmented Reality","Advanced Rendering","Automated Response"], c: 1 },
    { q: "What is cloud computing?", a: ["Weather prediction","On-demand computing services","Satellite imaging","Data encryption"], c: 1 },
    { q: "What is cybersecurity?", a: ["Social media marketing","Protection of digital systems","Website design","Database management"], c: 1 },
    { q: "What is deep learning?", a: ["Learning from books","ML with neural networks","Basic coding","Data entry"], c: 1 },
    { q: "What is a digital twin?", a: ["Online avatar","Virtual replica of physical system","Duplicate website","Social media account"], c: 1 }
  ];
  const quizContent = document.getElementById('quiz-content');
  const startBtn = document.getElementById('start-quiz');
  const resultDiv = document.getElementById('quiz-result');
  const scoreSpan = document.getElementById('quiz-score');

  let currentIdx = 0;
  let score = 0;

  function renderQuestion() {
    const item = quizData[currentIdx];
    const answersHtml = item.a.map((ans, i) => `<div class="form-check"><input class="form-check-input" type="radio" name="quiz-opt" id="opt${i}" value="${i}"><label class="form-check-label" for="opt${i}">${ans}</label></div>`).join('');
    quizContent.innerHTML = `<h5 class="mb-3">Question ${currentIdx + 1} of ${quizData.length}</h5><p>${item.q}</p>${answersHtml}<button class="btn btn-primary mt-3" id="next-question">Next</button>`;
    document.getElementById('next-question').addEventListener('click', checkAnswer);
  }

  function checkAnswer() {
    const selected = document.querySelector('input[name="quiz-opt"]:checked');
    if (!selected) return;
    if (+selected.value === quizData[currentIdx].c) score++;
    currentIdx++;
    if (currentIdx < quizData.length) {
      renderQuestion();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    quizContent.innerHTML = '';
    resultDiv.classList.remove('d-none');
    scoreSpan.textContent = score;
  }

  startBtn?.addEventListener('click', () => {
    startBtn.style.display = 'none';
    renderQuestion();
  });

  // Certificate download (SVG)
  const certBtn = document.getElementById('download-certificate');
  if (certBtn) {
    certBtn.addEventListener('click', () => {
      const svg = `
        <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#2563EB;stop-opacity:1"/><stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1"/></linearGradient></defs>
          <rect width="600" height="400" fill="url(#grad)"/>
          <text x="300" y="80" font-family="Orbitron" font-size="32" fill="#fff" text-anchor="middle">NovaMind</text>
          <text x="300" y="130" font-family="Poppins" font-size="24" fill="#fff" text-anchor="middle">Certificate of Achievement</text>
          <text x="300" y="200" font-family="Poppins" font-size="18" fill="#fff" text-anchor="middle">This certifies that you have completed</text>
          <text x="300" y="240" font-family="Poppins" font-size="22" fill="#fff" text-anchor="middle">the Innovation Quiz</text>
          <text x="300" y="300" font-family="Poppins" font-size="20" fill="#fff" text-anchor="middle">Score: ${score} / ${quizData.length}</text>
          <text x="300" y="370" font-family="Inter" font-size="12" fill="rgba(255,255,255,0.6)" text-anchor="middle">Empowering Global Innovators for an Intelligent Future</text>
        </svg>`;
      const blob = new Blob([svg], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NovaMind_Innovation_Quiz_Certificate.svg';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Simple Lightbox for Gallery items
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `<img src="${item.href}" class="lightbox-img"><span class="close-lightbox">&times;</span>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.close-lightbox').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    });
  });

  // ============ FORM HANDLERS WITH TOAST NOTIFICATIONS ============

  // Toast notification utility
  function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.novamind-toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `novamind-toast novamind-toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
      </div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });

    // Auto-dismiss after 4s
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  // Inline feedback utility
  function showFeedback(feedbackEl, message, type = 'success') {
    feedbackEl.className = `mt-2 ${type === 'success' ? 'text-success' : 'text-danger'}`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove('d-none');
    setTimeout(() => feedbackEl.classList.add('d-none'), 5000);
  }

  // Newsletter form
  document.getElementById('newsletter-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value.trim();
    if (!email) return;
    const feedback = document.getElementById('newsletter-feedback');
    showFeedback(feedback, '✓ Thank you for subscribing! You will receive the latest updates from NovaMind.', 'success');
    showToast('Successfully subscribed to the NovaMind newsletter!');
    e.target.reset();
  });

  // Contact form
  document.getElementById('contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    if (!name || !email || !message) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const feedback = document.getElementById('contact-feedback');
    showFeedback(feedback, '✓ Your message has been sent successfully! We will get back to you soon.', 'success');
    showToast('Message sent successfully! We will respond within 24 hours.');
    e.target.reset();
  });

  // Footer newsletter
  document.getElementById('footer-newsletter')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value.trim();
    if (!email) return;
    const feedback = document.getElementById('footer-newsletter-feedback');
    showFeedback(feedback, '✓ Subscribed successfully!', 'success');
    showToast('Successfully subscribed to the NovaMind newsletter!');
    e.target.reset();
  });

  // Join Now form
  document.getElementById('join-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('join-name').value.trim();
    const email = document.getElementById('join-email').value.trim();
    if (!name || !email) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const tier = document.getElementById('join-tier').value;
    const tierNames = { student: 'Student Member', innovator: 'Innovator Member', partner: 'Global Partner' };
    const feedback = document.getElementById('join-feedback');
    showFeedback(feedback, `✓ Welcome to NovaMind as a ${tierNames[tier]}!`, 'success');
    showToast(`Welcome aboard, ${name}! You are now a ${tierNames[tier]}.`);
    e.target.reset();
    // Close modal after delay
    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('joinNowModal'));
      if (modal) modal.hide();
    }, 2000);
  });

  // Event registration form
  document.getElementById('event-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('event-name').value.trim();
    const email = document.getElementById('event-email').value.trim();
    if (!name || !email) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const feedback = document.getElementById('event-feedback');
    showFeedback(feedback, '✓ Registration confirmed! Check your email for details.', 'success');
    showToast(`Event registration confirmed for ${name}! Check your email for details.`);
    e.target.reset();
    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('eventRegisterModal'));
      if (modal) modal.hide();
    }, 2000);
  });
});
