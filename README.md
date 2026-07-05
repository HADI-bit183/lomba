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
├─ config/
│  ├─ env.js
│  └─ database.js
├─ database/
│  ├─ errors.js
│  └─ schema.sql
├─ controllers/
├─ routes/
├─ models/
├─ services/
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
- **OpenAI-Powered Assistant**: A server-side Responses API integration with persistent Supabase chat history and web search for current factual questions.
- **Supabase PostgreSQL Persistence**: Registration profiles, chat history, and daily challenge progress are stored through server-only data services.
- **Modern Animations**: Powered by GSAP, AOS, and Swiper.js to bring the UI to life smoothly.
- **Responsive Layout**: Optimized for mobile, tablet, and desktop viewing.

## Development & Usage
- Create a Supabase project and run [`database/schema.sql`](database/schema.sql) in its SQL Editor.
- Copy `.env.example` to `.env.local`, then set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a long random `SESSION_SECRET`.
- Set `OPENAI_API_KEY` to enable the AI assistant.
- Keep the Supabase service-role key server-side; never place it in HTML or browser JavaScript.
- Install dependencies with `npm install`.
- Run `npm start`, then open `http://localhost:4173`.
- Do not open the HTML files directly when testing database or AI features; their `/api/*` routes are provided by `server.js`.
- Styling is primarily handled in `css/style.css`, utilizing a strict Design System with custom properties defined in `css/variables.css` (Design tokens for colors, typography, spacing).
- Core logic, animations, and theme interactivity have been refactored and consolidated into a single, efficient `js/bundle.js` file.

## Backend API

Routes delegate HTTP handling to controllers, while all Supabase queries stay in
the service layer.

- `POST /api/users` — create a user
- `GET /api/users/:id` — read the current session's user
- `PUT /api/users/:id` — update the current session's user
- `DELETE /api/users/:id` — delete the current session's user
- `POST /api/chat` — create a stored chat, directly or through the AI assistant
- `GET /api/chat/history` — read stored chat history
- `DELETE /api/chat/:id` — delete a stored chat

The legacy `GET /api/users/me` and `GET /api/chat-history` routes remain available
for the existing frontend.
