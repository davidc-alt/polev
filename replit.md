# poll.core — Poll Everywhere Auto-Responder

A Poll Everywhere automation tool with a React + Vite frontend and an Express backend. It uses Puppeteer to control a headless browser and optionally Google Gemini AI to automatically answer polls.

## How to run

The workflow **Start app** handles everything:

```
npm run build && node server.js
```

This builds the React frontend into `dist/`, then starts the Express server on **port 3001**, which serves both the API and the static frontend.

## Stack

- **Frontend**: React 19, Vite 8
- **Backend**: Express 5, Node 20
- **Browser automation**: Puppeteer 25 (headless Chromium)
- **AI**: Google Gemini 2.5 Flash (API key entered in the app's Settings UI — not a Replit secret)

## Notes

- The Gemini AI strategy requires a Google Gemini API key entered in the dashboard Settings panel.
- Puppeteer downloads Chromium on first use; the initial monitor start may be slow.
- The `server.js` wildcard catch-all uses Express 5 syntax (`/{*path}`).

## User preferences

<!-- Add any persistent preferences here -->
