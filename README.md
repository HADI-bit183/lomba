# NovaMind Hub

Welcome to **NovaMind Hub**, a premium futuristic website showcasing global innovation and artificial intelligence.

## Project Structure

This project is built as a **Multi-Page Application (MPA)** with 10 distinct routes, each optimized for seamless navigation, SEO, and an enhanced user experience. 

```
NovaMind/
├─ index.html
├─ about.html
├─ ai-assistant.html
├─ competition.html
├─ contact.html
├─ dashboard.html
├─ faq.html
├─ innovators.html
├─ register.html
├─ resources.html
├─ sitemap.xml
├─ server.js
├─ package.json
├─ .env.example
├─ css/
│  ├─ variables.css
│  ├─ style.css
│  ├─ responsive.css
│  └─ animation.css
├─ js/
│  └─ bundle.js
├─ assets/
│  ├─ vendor/
│  └─ images/
└─ README.md
```

## Features
- **Multi-Page Architecture**: 10 dedicated HTML pages interconnected with unified styling and logic.
- **Dynamic Theming (Dark/Light)**: A robust, centrally managed theme toggler synchronized perfectly with Bootstrap 5.3 Color Modes and user `localStorage` preferences.
- **Interactive AI Demos**: Try our built-in Image Color Classifier directly in your browser.
- **OpenAI-Powered Assistant**: A server-side Responses API integration with short conversation memory and web search for current factual questions.
- **Modern Animations**: Powered by GSAP, AOS, and Swiper.js to bring the UI to life smoothly.
- **Responsive Layout**: Optimized for mobile, tablet, and desktop viewing.

## Important Note on Functionality
Most competition flows remain a **Frontend Simulation**.
- The registration flow (e.g., `register.html` submitting to `dashboard.html` via `GET`) is intended purely to demonstrate the user journey and interface state changes. 
- There is no database processing registration data.
- The AI assistant requires the included Node server so the API key stays private.

## Development & Usage
- Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. The secure Codex setup flow can do this without exposing the key.
- Run `npm start`, then open `http://localhost:4173`.
- Do not open the HTML files directly when testing the AI assistant; `/api/chat` is provided by `server.js`.
- Styling is primarily handled in `css/style.css`, utilizing a strict Design System with custom properties defined in `css/variables.css` (Design tokens for colors, typography, spacing).
- Core logic, animations, and theme interactivity have been refactored and consolidated into a single, efficient `js/bundle.js` file.
