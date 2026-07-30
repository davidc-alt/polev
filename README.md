# ⚡ poll.core — Poll Everywhere Auto-Responder & Gemini AI Solver

> **by david bondarescu**

An automated 30-second DOM monitor, Puppeteer auto-clicker, and Gemini AI quiz solver for **Poll Everywhere** (`pollev.com`).

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v20%2B-green.svg)
![Vite](https://img.shields.io/badge/Vite-v6-purple.svg)

---

## ✨ Features

- **⚡ 30-Second Polling Cycle**: Automatically scans your target Poll Everywhere presenter page every 30 seconds (configurable 5s–120s).
- **🧠 Gemini AI Auto-Answer**: Uses Google Gemini 2.5 Flash to read live questions and select the best/most accurate answer option automatically.
- **🎯 Multiple Selection Strategies**:
  - 🎲 **Random Choice**: Picks a random option when a poll opens.
  - ↗ **Option 1 (A)**: Always picks Choice A.
  - 🔢 **Choice Number**: Picks a specific option index (#1, #2, #3, etc.).
  - ✨ **Gemini AI**: Solves question text using AI reasoning.
- **🖥️ Live Viewport Stream**: Base64 screenshot stream displaying live Poll Everywhere presenter screen in real-time with manual override click buttons.
- **🌐 1-Click Browser Bookmarklet & UserScript**: Includes in-tab Tampermonkey script and draggable bookmarklet to run auto-clicker directly inside your browser.
- **🧪 Interactive Test Sandbox**: Built-in simulator to test auto-clicker logic on dummy presenter polls.
- **🚀 Replit Ready**: Configured out of the box with `.replit` and `replit.nix` for 1-click cloud deployment.

---

## 🛠️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/davidc-alt/polev.git
   cd polev
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Application**:
   ```bash
   npm run dev
   ```
   - Open **Dashboard**: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

---

## 🌐 1-Click Replit Hosting

1. Open [Replit.com](https://replit.com) and click **+ Create Repl**.
2. Select **Import from GitHub** and paste `https://github.com/davidc-alt/polev.git`.
3. Replit will automatically read `.replit` and `replit.nix` to start the server!

---

## 📜 License
MIT License • Created by **david bondarescu**
