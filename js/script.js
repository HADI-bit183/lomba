/* /Users/user/Downloads/lomba/NovaMind/js/script.js */
document.addEventListener('DOMContentLoaded', () => {
  // Preloader simulation using GSAP
  const preloader = document.getElementById('preloader');
  const progressBar = document.querySelector('.preloader-progress');
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += Math.random() * 10 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      gsap.to(preloader, { opacity: 0, duration: 0.8, onComplete: () => preloader.remove() });
    }
    progressBar.style.width = progress + '%';
  }, 120);

  // Dark mode toggle with localStorage persistence
  const toggle = document.getElementById('dark-mode-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('theme');
  const updateToggleIcon = (isDark) => {
    const icon = toggle?.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  };
  if (savedTheme === 'dark' || (!savedTheme && prefersDark.matches)) {
    document.body.classList.add('dark-theme');
    updateToggleIcon(true);
  } else {
    updateToggleIcon(false);
  }
  toggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateToggleIcon(isDark);
  });

  // Back‑to‑top button visibility & click handler
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    backToTop.style.display = (window.scrollY > 300) ? 'flex' : 'none';
  });
  backToTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Initialize AOS (animate on scroll) library
  AOS.init({
    once: true,
    duration: 800,
    easing: 'ease-out-cubic'
  });

  // Hero Typed.js Initialization
  if (document.querySelector('.hero-title')) {
    new Typed('.hero-title', {
      strings: ['Empowering Global Innovators for an Intelligent Future', 'Connecting Minds for Sustainable Solutions', 'Pioneering the Next Era of Technology'],
      typeSpeed: 40,
      backSpeed: 20,
      backDelay: 2000,
      loop: true,
      showCursor: false
    });
  }
});
// ==================== AI LAB FUNCTIONALITY ====================

// Utility to open/close modals
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('aria-hidden', 'false');
  el.classList.add('show');
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('aria-hidden', 'true');
  el.classList.remove('show');
  document.body.classList.remove('modal-open');
}

// ---------- Chatbot ----------
const chatResponses = [
  "Hello! How can I assist you today?",
  "Our AI can help with innovations across many fields.",
  "Did you know? AI adoption is growing 30% annually.",
  "Feel free to ask about AI, cloud, or quantum technologies.",
  "We also offer consulting services for digital transformation.",
  "Our lab includes simulations, forecasting, and more.",
  "Check out our featured projects for real-world impact.",
  "Stay tuned for upcoming events on AI ethics.",
  "Would you like a recommendation on learning resources?",
  "Our sentiment analysis can gauge public opinion.",
  "The future forecast shows a rise in IoT deployments.",
  "Explore our gallery for AI-inspired visuals.",
  "Join our community to collaborate on global innovations.",
  "Remember, security is paramount in all tech solutions.",
  "Thank you for chatting! Visit our blog for more insights."
];
let chatIdx = 0;
const chatBtn = document.querySelector('.open-chatbot');
if (chatBtn) chatBtn.addEventListener('click', () => openModal('chat-modal'));
const closeChat = document.getElementById('close-chat');
if (closeChat) closeChat.addEventListener('click', () => closeModal('chat-modal'));
const minimizeChat = document.getElementById('minimize-chat');
if (minimizeChat) minimizeChat.addEventListener('click', () => closeModal('chat-modal'));
// Restore modal display when opened
const chatModal = document.getElementById('chat-modal');
if (chatModal) {
  const observer = new MutationObserver(() => {
    if (chatModal.getAttribute('aria-hidden') === 'false') chatModal.style.display = '';
  });
  observer.observe(chatModal, { attributes: true, attributeFilter: ['aria-hidden'] });
}
function appendChatMessage(content, sender = 'bot') {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const msg = document.createElement('div');
  msg.className = `chat-${sender}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  msg.innerHTML = `<span class="chat-text">${content}</span> <span class="chat-time text-muted small">${time}</span>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}
function simulateBotReply() {
  const reply = chatResponses[chatIdx % chatResponses.length];
  chatIdx++;
  const typing = document.createElement('div');
  typing.className = 'chat-bot typing';
  typing.innerHTML = '<span class="chat-text">...</span>';
  const container = document.getElementById('chat-messages');
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  setTimeout(() => {
    container.removeChild(typing);
    appendChatMessage(reply, 'bot');
  }, 1200);
}
const sendChatBtn = document.getElementById('send-chat');
if (sendChatBtn) {
  sendChatBtn.addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    appendChatMessage(text, 'user');
    input.value = '';
    simulateBotReply();
  });
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChatBtn.click();
      }
    });
  }
}

// ---------- Voice Interaction ----------
const voiceBtn = document.getElementById('start-voice');
const voiceStatus = document.getElementById('voice-status');
const voiceTranscript = document.getElementById('voice-transcript');
const closeVoice = document.getElementById('close-voice');
if (voiceBtn) {
  voiceBtn.addEventListener('click', () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceStatus.textContent = 'SpeechRecognition not supported – using simulated input.';
      setTimeout(() => {
        const simulated = 'Artificial Intelligence is transforming industries.';
        voiceTranscript.textContent = simulated;
        appendChatMessage('You said (simulated): ' + simulated, 'user');
        simulateBotReply();
      }, 2000);
      return;
    }
    const recognizer = new SpeechRecognition();
    recognizer.lang = 'en-US';
    recognizer.interimResults = false;
    recognizer.onstart = () => { voiceStatus.textContent = 'Listening...'; };
    recognizer.onresult = event => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join(' ');
      voiceTranscript.textContent = transcript;
      voiceStatus.textContent = 'Processing...';
      appendChatMessage('You said: ' + transcript, 'user');
      setTimeout(() => { voiceStatus.textContent = ''; simulateBotReply(); }, 500);
    };
    recognizer.onerror = err => { voiceStatus.textContent = 'Error: ' + err.error; };
    recognizer.start();
  });
}
if (closeVoice) closeVoice.addEventListener('click', () => closeModal('voice-modal'));

// ---------- Image Classification ----------
const classifyImgInput = document.getElementById('classify-image');
const classifyPreview = document.getElementById('classify-preview');
const startClassifyBtn = document.getElementById('start-classify');
const classifyResultDiv = document.getElementById('classify-result');
if (classifyImgInput) {
  classifyImgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    classifyPreview.innerHTML = `<img src="${url}" alt="Preview" class="img-fluid" style="max-height:200px;"/>`;
  });
}
const classes = ['Robot', 'Computer', 'Person', 'Landscape', 'Technology', 'Vehicle', 'Animal'];
if (startClassifyBtn) {
  startClassifyBtn.addEventListener('click', () => {
    if (!classifyImgInput.files.length) {
      classifyResultDiv.innerHTML = '<div class="text-danger">Please upload an image first.</div>';
      return;
    }
    classifyResultDiv.innerHTML = `<div class="progress mb-2"><div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width:0%"></div></div>`;
    const bar = classifyResultDiv.querySelector('.progress-bar');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 10;
      if (progress >= 100) {
        clearInterval(interval);
        const predClass = classes[Math.floor(Math.random() * classes.length)];
        const confidence = (Math.random() * 30 + 70).toFixed(1);
        classifyResultDiv.innerHTML = `<p><strong>Prediction:</strong> ${predClass} (${confidence}% confidence)</p>`;
      } else {
        bar.style.width = Math.min(progress, 100) + '%';
      }
    }, 300);
  });
}
if (document.getElementById('close-classify')) {
  document.getElementById('close-classify').addEventListener('click', () => closeModal('classify-modal'));
}

// ---------- Sentiment Analysis ----------
const analyzeBtn = document.getElementById('run-analyze');
const analyzeInput = document.getElementById('analyze-input');
const analyzeResult = document.getElementById('analyze-result');
if (analyzeBtn) {
  analyzeBtn.addEventListener('click', () => {
    const text = analyzeInput.value.trim();
    if (!text) {
      analyzeResult.innerHTML = '<div class="text-danger">Enter some text first.</div>';
      return;
    }
    const positive = ['good','great','awesome','fantastic','positive','love','excellent'];
    const negative = ['bad','terrible','hate','awful','negative','poor','worst'];
    const lower = text.toLowerCase();
    let score = 0;
    positive.forEach(w => { if (lower.includes(w)) score++; });
    negative.forEach(w => { if (lower.includes(w)) score--; });
    let sentiment = 'Neutral';
    if (score > 0) sentiment = 'Positive';
    else if (score < 0) sentiment = 'Negative';
    const confidence = Math.min(100, Math.abs(score) * 20 + 50).toFixed(0);
    const highlighted = text.replace(/(good|great|awesome|fantastic|positive|love|excellent|bad|terrible|hate|awful|negative|poor|worst)/gi, m => `<mark>${m}</mark>`);
    analyzeResult.innerHTML = `<p><strong>Sentiment:</strong> ${sentiment} (${confidence}% confidence)</p><p>${highlighted}</p>`;
  });
}
if (document.getElementById('close-analyze')) {
  document.getElementById('close-analyze').addEventListener('click', () => closeModal('analyze-modal'));
}

// ---------- Recommendations ----------
const recommendations = [
  {title:'Artificial Intelligence',desc:'Explore AI breakthroughs and applications.'},
  {title:'Machine Learning',desc:'Dive into models, data, and training techniques.'},
  {title:'Cloud Computing',desc:'Learn about scalable infrastructure and services.'},
  {title:'Cyber Security',desc:'Protect systems with modern security practices.'},
  {title:'Robotics',desc:'Discover autonomous machines and their impact.'},
  {title:'Quantum Computing',desc:'Understand qubits, superposition, and future potentials.'}
];
function renderRecommendations(){
  const container = document.getElementById('recommendations-cards');
  if(!container) return;
  container.innerHTML = recommendations.map(item=>`
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card glass h-100 p-3">
        <h6 class="card-title">${item.title}</h6>
        <p class="card-text">${item.desc}</p>
      </div>
    </div>`).join('');
}
if (document.getElementById('close-recommendations')) {
  document.getElementById('close-recommendations').addEventListener('click', () => closeModal('recommendations-section'));
}
const openRecs = document.querySelectorAll('.open-recommendations');
openRecs.forEach(btn => btn.addEventListener('click', () => { renderRecommendations(); openModal('recommendations-section'); }));

// ---------- Forecast Chart ----------
function initForecastChart(){
  const ctx = document.getElementById('forecastChart')?.getContext('2d');
  if(!ctx) return;
  if (window.forecastChartInstance) {
    window.forecastChartInstance.destroy();
  }
  window.forecastChartInstance = new Chart(ctx, {
    type:'line',
    data:{
      labels:['2022','2023','2024','2025','2026','2027','2028'],
      datasets:[
        {label:'AI Adoption (%)',data:[45,55,63,70,78,85,90],borderColor:'#2563EB',backgroundColor:'rgba(38,99,235,0.15)',fill:true,tension:0.3},
        {label:'Cloud Growth (%)',data:[30,38,45,53,60,68,75],borderColor:'#06B6D4',backgroundColor:'rgba(6,182,212,0.15)',fill:true,tension:0.3},
        {label:'IoT Devices (B)',data:[10,12,15,19,24,30,38],borderColor:'#7C3AED',backgroundColor:'rgba(124,58,213,0.15)',fill:true,tension:0.3}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false}
  });
}
if (document.getElementById('forecast-section')) {
  document.getElementById('close-forecast').addEventListener('click', () => closeModal('forecast-section'));
}

// Generic close handlers for any modal
['close-chat','close-voice','close-classify','close-analyze','close-recommendations','close-forecast'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',()=>{closeModal(el.id.replace('close-',''));});
});

document.querySelectorAll('.modal').forEach(mod => {
  mod.addEventListener('click', e => {
    if (e.target === mod) {
      const id = mod.id;
      closeModal(id);
    }
  });
});

// ---------- Mouse Tracking Glow Effect ----------
document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.glass-card, .card.glass').forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});
