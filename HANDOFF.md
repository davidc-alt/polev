# 🚀 Project Handoff: Poll Everywhere Automator (`pollcore`)

**Author**: David Bondarescu  
**Repository**: [https://github.com/davidc-alt/polev.git](https://github.com/davidc-alt/polev.git)  
**Branch**: `main`  
**Latest Commit**: `e817a4b`  
**Local Codebase Directory**: `/Users/davidbondarescu/pollev-auto-responder`  

---

## 📌 Project Overview
`pollcore` is a full-stack automated responder and AI solver for Poll Everywhere live quizzes. It uses **Node.js + Express + Puppeteer** to monitor target Poll Everywhere pages every 30 seconds, auto-register participant screen names, log into user accounts, inspect question DOM elements, and submit votes using configurable strategies including **Gemini 2.5 Flash AI**.

---

## 🛠️ Technology Stack
- **Frontend**: React 19 + Vite + Vanilla CSS (Minimalist Light/Neutral Theme with `#eeebe5` background, charcoal cards, and modern typography)
- **Icons**: Lucide React
- **Backend Engine**: Node.js ES Modules + Express + Server-Sent Events (SSE)
- **Browser Automator**: Puppeteer v25 (Headless & Headful mode support with multi-frame inspection & React native input setter)
- **AI Engine**: Gemini 2.5 Flash API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`)

---

## 🎯 Completed Features & Recent Enhancements

### 1. **Automated 30s Monitoring & Voting**:
   - Background interval loop scans Poll Everywhere target pages every 30 seconds.
   - Live countdown timer with interactive Pause / Resume controls.

### 2. **Gemini AI Solver**:
   - Integrates Gemini 2.5 Flash to analyze question titles and response options.
   - Automatically selects the most accurate answer and records a 1-sentence reasoning summary.
   - API Key field displays conditionally only when `Gemini AI Answer` strategy is selected.

### 3. **Editable Participant Profile & Account Credentials**:
   - **Editable Screen Name**: Fully editable across both the top header bar and the Strategy Config card (defaults to `David Bondarescu`).
   - **Account Email & Password**: Added Account Email (e.g., `bond011@ucr.edu`) and optional Account Password fields with a show/hide password toggle.

### 4. **Deep DOM `Responding as ... ✏️` Pencil Icon Auto-Sync**:
   - Automatically detects default/anonymous names on Poll Everywhere (e.g. `Responding as Respectful Sparrow ✏️`).
   - **Node Precision Filtering**: Filters candidate nodes with text containing `"responding as"` and sorts them by text length ascending to target the exact small badge (preventing outer page body selection).
   - Simulates native `mousedown`, `mouseup`, and `click` event sequences on the pencil icon ✏️.
   - Uses `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` to force React controlled inputs to accept the new name, followed by `input`, `change`, and `blur` events.

### 5. **Account Email & Password Login Automation**:
   - Inspects page and frame DOM for "Log in" / "Sign in" buttons and top-left "Guest" header menus.
   - Fills in user account email and password using React native setters and submits the login form automatically.

### 6. **Background Browser Pre-Warming & Zero-Delay Start**:
   - Added `prewarmBrowser()` to initialize Chromium and navigate to the Poll Everywhere target URL on server startup, target URL entry, or profile update.
   - Removed artificial sleep delays so clicking **Start 30s Monitor** triggers profile sync and poll voting instantly.

### 7. **Cloud Hosting & Puppeteer Resilience**:
   - Fixed Express 5 `path-to-regexp` wildcard route matching (`PathError: Missing parameter name at index 1: *`).
   - Created `.puppeteerrc.cjs` to store Chrome binaries inside `./.cache/puppeteer` in the project root so Render preserves Chrome across build and runtime phases.
   - Implemented dynamic on-demand Chrome binary installation (`npx puppeteer browsers install chrome`) in `server.js` if Chrome is missing.

### 8. **Pre-flight Profile Sync & Login Enforcement**:
   - Guaranteed that participant screen name and login credentials are fully synced, typed, and submitted to Poll Everywhere *prior* to starting the 30-second interval timer and prior to scanning active poll options.
   - Added automatic viewport screenshot broadcast upon profile sync so the UI instantly reflects updated screen names.

---

## 🌐 Deployment Configuration & Status

### 1. **Render.com Hosting**
- **Service URLs**:
  - `https://polev.onrender.com`
  - `https://polev-1.onrender.com`
- **Render Build Command**: `npm install && npx puppeteer browsers install chrome && npm run build`
- **Render Start Command**: `node server.js`
- **Render Environment Variables**:
  - `PUPPETEER_CACHE_DIR`: `/opt/render/project/src/.cache/puppeteer`
  - `NODE_VERSION`: `20.18.0`

### 2. **Replit.app Hosting**
- **Live URL**: `https://polev--bondarescudavid.replit.app/`
- **Replit Config**: Included `.replit` and `replit.nix` files setting Node 20 environment.

---

## 📁 Key File Structure

```
pollev-auto-responder/
├── server.js                     # Express server, Puppeteer engine, Gemini solver, SSE streaming, profile sync
├── .puppeteerrc.cjs              # Puppeteer cache directory configuration (./.cache/puppeteer)
├── render.yaml                   # Render.com deployment Blueprint configuration
├── package.json                  # Dependencies, start scripts & chrome install build step
├── .gitignore                    # Ignored files (node_modules, .cache, logs, env)
├── README.md                     # Setup guide and instructions
├── HANDOFF.md                    # Project handoff documentation
└── src/
    ├── App.jsx                   # Main application state, SSE listener & tab router
    ├── index.css                 # CSS Design System & design tokens
    └── components/
        ├── Header.jsx            # Header, editable participant name, target URL auto-set, credit badge
        ├── StatsOverview.jsx     # 30s countdown cycle card & stat counters
        ├── StrategyConfig.jsx    # Click strategies, Gemini API key, Screen Name, Email & Password profile
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
