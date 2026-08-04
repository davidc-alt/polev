# 🚀 Project Handoff: Poll Everywhere Automator (`pollcore`)

**Author**: David Bondarescu  
**Repository**: [https://github.com/davidc-alt/polev.git](https://github.com/davidc-alt/polev.git)  
**Branch**: `main`  
**Local Codebase Directory**: `/Users/davidbondarescu/pollev-auto-responder`  

---

## 📌 Project Overview
`pollcore` is a full-stack automated responder and AI solver for Poll Everywhere live quizzes. It uses **Node.js + Express + Puppeteer** to monitor target Poll Everywhere pages every 30 seconds, auto-register participant screen names, inspect question DOM elements, and submit votes using configurable strategies including **Gemini 2.5 Flash AI**.

---

## 🛠️ Technology Stack
- **Frontend**: React 19 + Vite + Vanilla CSS (Minimalist Light/Neutral Theme with `#eeebe5` background, charcoal cards, and modern typography)
- **Icons**: Lucide React
- **Backend Engine**: Node.js ES Modules + Express + Server-Sent Events (SSE)
- **Browser Automator**: Puppeteer v25 (Headless & Headful mode support)
- **AI Engine**: Gemini 2.5 Flash API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`)

---

## 🎯 Completed Features & User Directives

1. **Automated 30s Monitoring & Voting**:
   - Background interval loop scans Poll Everywhere target pages every 30 seconds.
   - Live countdown timer with interactive Pause / Resume controls.

2. **Gemini AI Solver**:
   - Integrates Gemini 2.5 Flash to analyze question titles and response options.
   - Automatically selects the most accurate answer and records a 1-sentence reasoning summary.
   - API Key field displays conditionally only when `Gemini AI Answer` is selected.

3. **Participant Screen Name Auto-Registration**:
   - Configurable screen name (defaults to `David Bondarescu`).
   - Automatically detects Poll Everywhere name prompts ("Introduce Yourself") and registers the name.

4. **Instant Target URL Auto-Setting**:
   - Real-time `targetUrl` update on typing or pasting (redundant "Set URL" button removed).
   - Domain redirect handler prevents refresh loops when entering `pe.app/username` or `pollev.com/username`.

5. **Design & Aesthetics**:
   - Minimalist neutral palette with dark featured cards and pill controls.
   - Static, non-editable developer credit badge: `by david bondarescu`.

6. **Deployment Ready**:
   - Pre-built production bundle (`dist/`) tracked in git for direct serving on Render & Replit.
   - Express server bound to `0.0.0.0` with global exception handlers.

---

## 🌐 Deployment Configuration & Status

### 1. **Render.com Hosting**
- **Service URLs**:
  - `https://polev.onrender.com`
  - `https://polev-1.onrender.com`
- **Render Build Command**: `npm install && npx puppeteer browsers install chrome && npm run build`
- **Render Start Command**: `node server.js`
- **Render Environment Variables**:
  - `PUPPETEER_CACHE_DIR`: `/opt/render/.cache/puppeteer`
  - `NODE_VERSION`: `20.18.0`

### 2. **Replit.app Hosting**
- **Live URL**: `https://polev--bondarescudavid.replit.app/`
- **Replit Config**: Included `.replit` and `replit.nix` files setting Node 20 environment.

---

## 📁 Key File Structure

```
pollev-auto-responder/
├── server.js                     # Express server, Puppeteer engine, Gemini solver, SSE streaming
├── render.yaml                   # Render.com deployment Blueprint configuration
├── package.json                  # Dependencies, start scripts & chrome install build step
├── .gitignore                    # Ignored files (node_modules, logs, env)
├── README.md                     # Setup guide and instructions
├── HANDOFF.md                    # This handoff documentation
└── src/
    ├── App.jsx                   # Main application state, SSE listener & tab router
    ├── index.css                 # CSS Design System & design tokens
    └── components/
        ├── Header.jsx            # Header, target URL auto-set, static credit badge
        ├── StatsOverview.jsx     # 30s countdown cycle card & stat counters
        ├── StrategyConfig.jsx    # Click strategies & Gemini API key card
        ├── LiveMonitor.jsx       # Viewport feed screenshot & AI reasoning box
        ├── ExtensionGenerator.jsx # Bookmarklet & Tampermonkey script generator
        ├── Simulator.jsx         # Interactive sandbox simulator
        └── ActivityLog.jsx       # Audit event log table
```

---

## 💻 Local Development Commands

```bash
# Install dependencies
npm install

# Start local server + Vite client (Development)
npm run dev

# Test production build
npm run build

# Start production server
npm start
```

---

## 🔄 Git Push Command (macOS Xcode Bypass)
```bash
DEVELOPER_DIR=/Library/Developer/CommandLineTools git add .
DEVELOPER_DIR=/Library/Developer/CommandLineTools git commit -m "Commit description"
DEVELOPER_DIR=/Library/Developer/CommandLineTools git push origin main
```
