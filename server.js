import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Prevent process exit on uncaught errors (vital for cloud hosting stability)
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception captured:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection captured:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Application State
let state = {
  isMonitoring: false,
  isAutoVoting: true,
  targetUrl: 'https://pollev.com/demouser',
  screenName: 'David Bondarescu',
  intervalSeconds: 30,
  strategy: 'random', // 'random' | 'first' | 'index' | 'ai'
  optionIndex: 0,
  geminiApiKey: '',
  headful: false,
  lastScreenshot: null,
  stats: {
    checksPerformed: 0,
    pollsDetected: 0,
    votesSubmitted: 0,
    lastCheckTime: null,
    lastVoteTime: null,
  },
  currentPoll: {
    active: false,
    question: 'No scan performed yet',
    options: [],
    selectedOption: null,
    aiReasoning: null
  },
  logs: []
};

let browser = null;
let page = null;
let timerId = null;
let sseClients = [];
let lastNavigatedUrl = null;

function addLog(type, message, details = {}) {
  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    type,
    message,
    ...details
  };
  
  state.logs.unshift(logEntry);
  if (state.logs.length > 200) state.logs.pop();
  
  broadcastSSE({ type: 'log', log: logEntry, stats: state.stats, currentPoll: state.currentPoll });
  return logEntry;
}

function broadcastSSE(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => client.res.write(payload));
}

function formatUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) return 'https://pollev.com';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

function isPollevDomain(urlStr) {
  if (!urlStr) return false;
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return host.includes('pollev.com') || host.includes('pe.app') || host.includes('poll-everywhere');
  } catch (e) {
    return false;
  }
}

let consecutiveMisses = 0;

async function askGeminiForAnswer(question, options, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please enter your key in settings.');
  }

  const promptText = `You are taking a Poll Everywhere live quiz. Analyze the question and options, and select the single best/most accurate response index (0-indexed).

Question: "${question}"
Options:
${options.map((opt, i) => `${i}: "${opt.text}"`).join('\n')}

Respond ONLY with a valid JSON object in this exact schema:
{
  "chosenIndex": number,
  "reasoning": "Short 1-sentence explanation of why this answer is correct"
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API HTTP Error ${response.status}: ${errorBody.substring(0, 150)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  let cleanedText = rawText.trim();
  if (cleanedText.includes('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?/gi, '').replace(/```$/gi, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (err) {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse Gemini JSON: ${cleanedText.substring(0, 100)}`);
    }
  }

  let chosenIndex = parseInt(parsed.chosenIndex);

  if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= options.length) {
    chosenIndex = 0;
  }

  return {
    chosenIndex,
    reasoning: parsed.reasoning || `Gemini selected option #${chosenIndex + 1}`
  };
}

function findChromeExecutableInDir(dir) {
  try {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findChromeExecutableInDir(fullPath);
        if (found) return found;
      } else if (entry.isFile()) {
        if (entry.name === 'chrome' || entry.name === 'chromium' || entry.name === 'chrome.exe') {
          return fullPath;
        }
      }
    }
  } catch (e) {}
  return null;
}

function searchAllChromeExecutables() {
  const custom = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (custom && fs.existsSync(custom)) return custom;

  const standardPaths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chrome',
    '/opt/google/chrome/chrome'
  ];
  for (const p of standardPaths) {
    if (fs.existsSync(p)) return p;
  }

  const searchDirs = [
    path.join(process.cwd(), '.cache', 'puppeteer'),
    '/opt/render/.cache/puppeteer',
    '/opt/render/project/src/.cache/puppeteer',
    path.join(process.env.HOME || '/root', '.cache', 'puppeteer')
  ];

  for (const dir of searchDirs) {
    const found = findChromeExecutableInDir(dir);
    if (found) return found;
  }

  return null;
}

async function getOrLaunchBrowser() {
  if (browser && browser.connected) return browser;

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1280,800'
  ];

  let launched = null;

  try {
    launched = await puppeteer.launch({
      headless: !state.headful,
      args: launchArgs
    });
  } catch (err1) {
    addLog('warn', `Standard launch failed (${err1.message}). Searching cached/system Chrome executables...`);
    
    let chromePath = searchAllChromeExecutables();
    
    if (chromePath) {
      try {
        launched = await puppeteer.launch({
          headless: true,
          executablePath: chromePath,
          args: launchArgs
        });
      } catch (e) {
        addLog('warn', `Launch with found executable at ${chromePath} failed: ${e.message}`);
      }
    }

    if (!launched) {
      addLog('warn', `No valid Chrome binary found. Triggering automatic on-demand browser installation...`);
      try {
        execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
        chromePath = searchAllChromeExecutables();
        if (chromePath) {
          launched = await puppeteer.launch({
            headless: true,
            executablePath: chromePath,
            args: launchArgs
          });
        }
      } catch (installErr) {
        addLog('error', `Automatic Chrome installation failed: ${installErr.message}`);
      }
    }
  }

  if (!launched) {
    throw new Error('Could not launch Chromium/Chrome browser session.');
  }

  browser = launched;
  return browser;
}

async function scanAndVote() {
  state.stats.checksPerformed++;
  state.stats.lastCheckTime = new Date().toISOString();
  
  addLog('scan', `Checking Poll Everywhere target: ${state.targetUrl}`);

  try {
    const activeBrowser = await getOrLaunchBrowser();
    
    if (!page || page.isClosed()) {
      page = await activeBrowser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      
      // Inject anti-bot evasion properties so Poll Everywhere WebSockets connect properly
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        window.chrome = window.chrome || { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
      });

      lastNavigatedUrl = null;
    }

    const currentUrl = page.url();
    const formattedTarget = formatUrl(state.targetUrl);

    // Force page navigation if URL changed, initial blank, or if we missed active polls 2 times consecutively
    const needsNavigation = !currentUrl || 
                             currentUrl === 'about:blank' || 
                             lastNavigatedUrl !== formattedTarget ||
                             (!isPollevDomain(currentUrl) && !isPollevDomain(formattedTarget)) ||
                             consecutiveMisses >= 2;

    if (needsNavigation) {
      addLog('info', `Navigating to ${formattedTarget}${consecutiveMisses >= 2 ? ' (Re-syncing page state...)' : ''}...`);
      await page.goto(formattedTarget, { waitUntil: 'domcontentloaded', timeout: 30000 });
      lastNavigatedUrl = formattedTarget;
      consecutiveMisses = 0;
      await new Promise(r => setTimeout(r, 3000));
    }

    // Auto-fill Screen / Participant Name if Poll Everywhere prompts for registration
    if (state.screenName) {
      const nameFilled = await page.evaluate((nameToSet) => {
        const nameSelectors = [
          'input[data-test-id*="screen-name"]',
          'input[name="screen_name"]',
          'input[name*="screen_name"]',
          'input[placeholder*="name" i]',
          'input[placeholder*="Name"]',
          '.component-screen-name-input',
          '#screen_name'
        ];
        let inputEl = null;
        for (const sel of nameSelectors) {
          const el = document.querySelector(sel);
          if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
            inputEl = el;
            break;
          }
        }

        if (inputEl && inputEl.value !== nameToSet) {
          inputEl.value = nameToSet;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));

          const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
          const submitBtn = btns.find(b => {
            const txt = (b.innerText || b.value || '').toLowerCase();
            return txt.includes('introduce') || txt.includes('save') || txt.includes('continue') || txt.includes('submit') || txt.includes('join') || txt.includes('done');
          });
          if (submitBtn) {
            submitBtn.click();
            return true;
          }
        }
        return false;
      }, state.screenName);

      if (nameFilled) {
        addLog('info', `Registered participant name on Poll Everywhere: "${state.screenName}"`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    let screenshotBase64 = null;
    try {
      screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
      state.lastScreenshot = `data:image/jpeg;base64,${screenshotBase64}`;
    } catch (e) {
      console.error('Screenshot error:', e.message);
    }

    // Comprehensive DOM Inspection across main document & any child frames
    const pollResult = await page.evaluate(() => {
      const cleanText = (str) => str ? str.trim().replace(/\s+/g, ' ') : '';

      // Check explicit waiting screen elements
      const waitingEl = document.querySelector('[data-test-id="waiting-screen"], .component-waiting-screen, .pe-waiting-screen, [class*="waiting-screen"]');
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, div, p'));
      const explicitWaitingMsg = headings.find(h => {
        const txt = (h.innerText || '').toLowerCase().trim();
        return (txt === 'waiting for presenter...' || txt === 'waiting for presenter' || txt === 'no active poll' || txt.includes('presenter is offline')) && h.offsetWidth > 0;
      });

      // Question title selectors
      const questionEl = document.querySelector([
        '[data-test-id="question-title"]',
        '[data-test-id*="question"]',
        '[data-test-id*="poll-header"]',
        '.component-poll-header__title',
        '.component-response-header__title',
        '.pe-question-title',
        '[class*="question-title"]',
        '[class*="poll-header"]',
        '[class*="response-header"]',
        '[class*="header__title"]',
        '.component-response-header',
        '[role="heading"]',
        'h1',
        'h2'
      ].join(','));

      const questionText = questionEl ? cleanText(questionEl.innerText) : (waitingEl || explicitWaitingMsg ? 'Waiting for presenter...' : 'Poll Everywhere Page');

      // Multiple choice option selectors
      const optionSelectors = [
        '[data-test-id*="response-option"]',
        '[data-test-id*="option"]',
        '.component-response-option',
        'button[class*="response-option"]',
        'button[class*="component-response-option"]',
        '.pe-response-option__button',
        '.component-response-multiple-choice__option',
        '.component-response-multiple-choice__option-button',
        'button[data-test-id*="option"]',
        '[role="button"][class*="option"]',
        '[class*="multiple-choice"] button',
        '[role="radiogroup"] button',
        '[role="radiogroup"] [role="radio"]',
        '[role="listbox"] [role="option"]',
        '.component-response-clickable-image__target',
        '[data-test-id*="clickable-image"]'
      ];

      let rawOptions = [];
      for (const sel of optionSelectors) {
        const found = Array.from(document.querySelectorAll(sel)).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
        if (found.length > 0) {
          rawOptions = found;
          break;
        }
      }

      if (rawOptions.length === 0) {
        const responseContainer = document.querySelector('.component-response, .pe-response-body, [data-test-id*="response"], main, #app');
        if (responseContainer) {
          rawOptions = Array.from(responseContainer.querySelectorAll('button, [role="button"]')).filter(btn => {
            const txt = (btn.innerText || '').trim();
            const lower = txt.toLowerCase();
            return txt.length > 0 && 
                   btn.offsetWidth > 0 &&
                   !lower.includes('submit') && 
                   !lower.includes('clear') && 
                   !lower.includes('introduce') &&
                   !lower.includes('continue');
          });
        }
      }

      // Check open-ended / text input poll types
      const freeTextInput = document.querySelector('textarea, input[type="text"][data-test-id*="response"], textarea.component-response-free-text__input');

      let options = rawOptions.map((el, index) => {
        const isSelected = el.classList.contains('component-response-option--selected') || 
                           el.getAttribute('aria-pressed') === 'true' ||
                           el.getAttribute('aria-selected') === 'true' ||
                           el.getAttribute('data-selected') === 'true' ||
                           el.querySelector('.component-response-option__selected-icon') !== null;
        return {
          index,
          text: cleanText(el.innerText) || `Option ${index + 1}`,
          isSelected,
          className: el.className
        };
      });

      if (options.length === 0 && freeTextInput && freeTextInput.offsetWidth > 0) {
        options = [{
          index: 0,
          text: 'Open-ended Text Response Input',
          isSelected: false,
          className: freeTextInput.className,
          isFreeText: true
        }];
      }

      const selectedOptionIndex = options.findIndex(o => o.isSelected);

      const hasActivePoll = options.length > 0 || (questionEl && questionText !== 'Waiting for presenter...' && questionText !== 'Poll Everywhere Page');

      return {
        isWaiting: (waitingEl !== null || explicitWaitingMsg !== null) && options.length === 0,
        hasOptions: options.length > 0,
        hasActivePoll,
        question: questionText,
        options,
        selectedOptionIndex: selectedOptionIndex >= 0 ? selectedOptionIndex : null,
        selectedOptionText: selectedOptionIndex >= 0 ? options[selectedOptionIndex].text : null
      };
    });

    if (pollResult.hasOptions || pollResult.hasActivePoll) {
      consecutiveMisses = 0;
      state.stats.pollsDetected++;
      state.currentPoll = {
        active: true,
        question: pollResult.question,
        options: pollResult.options,
        selectedOption: pollResult.selectedOptionText,
        aiReasoning: state.currentPoll.aiReasoning
      };

      addLog('info', `Active Poll Detected: "${pollResult.question}" (${pollResult.options.length} options)`);

      if (pollResult.selectedOptionIndex !== null) {
        addLog('info', `Option already selected: "${pollResult.selectedOptionText}"`);
      } else if (state.isAutoVoting && pollResult.options.length > 0) {
        let targetIndex = 0;
        let aiReason = null;

        if (state.strategy === 'ai') {
          addLog('info', `🧠 Asking Gemini AI to analyze question: "${pollResult.question}"...`);
          try {
            const aiRes = await askGeminiForAnswer(pollResult.question, pollResult.options, state.geminiApiKey);
            targetIndex = aiRes.chosenIndex;
            aiReason = aiRes.reasoning;
            state.currentPoll.aiReasoning = aiReason;
            addLog('success', `✨ Gemini AI Decision: Selected Option #${targetIndex + 1} ("${pollResult.options[targetIndex].text}"). Reasoning: ${aiReason}`);
          } catch (aiErr) {
            addLog('warn', `Gemini AI Error: ${aiErr.message}. Fallback to Option #1.`);
            targetIndex = 0;
          }
        } else if (state.strategy === 'random') {
          targetIndex = Math.floor(Math.random() * pollResult.options.length);
        } else if (state.strategy === 'first') {
          targetIndex = 0;
        } else if (state.strategy === 'index') {
          targetIndex = Math.min(Math.max(0, state.optionIndex), pollResult.options.length - 1);
        }

        const chosenOption = pollResult.options[targetIndex];

        addLog('info', `Auto-voting using strategy "${state.strategy.toUpperCase()}" -> Clicking "${chosenOption.text}" (Option #${targetIndex + 1})...`);

        const clickedSuccess = await page.evaluate((idx) => {
          const optionSelectors = [
            '[data-test-id*="response-option"]',
            '[data-test-id*="option"]',
            '.component-response-option',
            'button[class*="response-option"]',
            'button[class*="component-response-option"]',
            '.pe-response-option__button',
            '.component-response-multiple-choice__option',
            'button[data-test-id*="option"]',
            '[role="button"][class*="option"]',
            '[class*="multiple-choice"] button'
          ];
          let els = [];
          for (const sel of optionSelectors) {
            const found = Array.from(document.querySelectorAll(sel)).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
            if (found.length > 0) { els = found; break; }
          }
          if (els.length === 0) {
            const main = document.querySelector('.component-response, .pe-response-body, [data-test-id*="response"], main, #app');
            if (main) els = Array.from(main.querySelectorAll('button, [role="button"]')).filter(b => b.offsetWidth > 0);
          }

          if (els[idx]) {
            els[idx].click();

            // Click Submit button if present
            setTimeout(() => {
              const submitBtns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
              const submitBtn = submitBtns.find(b => {
                const txt = (b.innerText || b.value || '').toLowerCase();
                return txt.includes('submit') || txt.includes('send') || txt.includes('vote');
              });
              if (submitBtn) submitBtn.click();
            }, 300);

            return true;
          }
          return false;
        }, targetIndex);

        if (clickedSuccess) {
          state.stats.votesSubmitted++;
          state.stats.lastVoteTime = new Date().toISOString();
          state.currentPoll.selectedOption = chosenOption.text;

          addLog('success', `VOTE CONFIRMED: Clicked "${chosenOption.text}" for question "${pollResult.question}"`, {
            question: pollResult.question,
            optionClicked: chosenOption.text,
            strategy: state.strategy,
            aiReasoning: aiReason
          });

          await new Promise(r => setTimeout(r, 1000));
          try {
            screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
            state.lastScreenshot = `data:image/jpeg;base64,${screenshotBase64}`;
          } catch (e) {}
        } else {
          addLog('error', `Failed to click option #${targetIndex + 1} on page DOM.`);
        }
      }
    } else {
      consecutiveMisses++;
      state.currentPoll = {
        active: false,
        question: pollResult.question || 'Waiting for presenter...',
        options: [],
        selectedOption: null,
        aiReasoning: null
      };
      addLog('info', `No active poll found on ${state.targetUrl} (Status: ${pollResult.question})`);
    }

    broadcastSSE({ type: 'stateUpdate', state });
  } catch (error) {
    addLog('error', `Scan error: ${error.message}`);
    console.error('Scan error:', error);
  }
}

function startTimer() {
  if (timerId) clearInterval(timerId);
  const ms = Math.max(5000, (state.intervalSeconds || 30) * 1000);
  timerId = setInterval(scanAndVote, ms);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json(state);
});

app.post('/api/start', async (req, res) => {
  state.isMonitoring = true;
  startTimer();
  addLog('info', 'Started 30s monitoring loop.');
  scanAndVote();
  res.json({ success: true, state });
});

app.post('/api/stop', (req, res) => {
  state.isMonitoring = false;
  stopTimer();
  addLog('info', 'Stopped monitoring loop.');
  res.json({ success: true, state });
});

app.post('/api/manual-scan', (req, res) => {
  scanAndVote();
  res.json({ success: true });
});

app.post('/api/manual-vote', async (req, res) => {
  const { index } = req.body;
  if (!page || !browser) {
    return res.status(400).json({ error: 'Browser session not active.' });
  }

  try {
    const success = await page.evaluate((idx) => {
      const optionSelectors = [
        '.component-response-option',
        '[data-test-id*="response-option"]',
        'button[class*="response-option"]',
        'button[class*="component-response-option"]',
        '.pe-response-option__button',
        '.component-response-multiple-choice__option',
        'button[data-test-id*="option"]'
      ];
      let els = [];
      for (const sel of optionSelectors) {
        const found = Array.from(document.querySelectorAll(sel));
        if (found.length > 0) { els = found; break; }
      }
      if (els.length === 0) {
        const main = document.querySelector('.component-response, .pe-response-body, [data-test-id*="response"], main');
        if (main) els = Array.from(main.querySelectorAll('button, [role="button"]'));
      }
      if (els[idx]) {
        els[idx].click();
        return true;
      }
      return false;
    }, index);

    if (success) {
      state.stats.votesSubmitted++;
      state.stats.lastVoteTime = new Date().toISOString();
      addLog('success', `Manual vote submitted for option index #${index + 1}`);
      await new Promise(r => setTimeout(r, 800));
      try {
        const screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
        state.lastScreenshot = `data:image/jpeg;base64,${screenshotBase64}`;
      } catch (e) {}
      broadcastSSE({ type: 'stateUpdate', state });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to click option on page.' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/config', (req, res) => {
  const { isAutoVoting, targetUrl, intervalSeconds, strategy, optionIndex, geminiApiKey, headful, screenName } = req.body;
  
  let targetChanged = false;
  if (targetUrl !== undefined && targetUrl !== state.targetUrl) {
    state.targetUrl = targetUrl;
    targetChanged = true;
    lastNavigatedUrl = null;
  }
  if (isAutoVoting !== undefined) state.isAutoVoting = isAutoVoting;
  if (intervalSeconds !== undefined) state.intervalSeconds = parseInt(intervalSeconds);
  if (strategy !== undefined) state.strategy = strategy;
  if (optionIndex !== undefined) state.optionIndex = parseInt(optionIndex);
  if (geminiApiKey !== undefined) state.geminiApiKey = geminiApiKey;
  if (headful !== undefined) state.headful = headful;
  if (screenName !== undefined) state.screenName = screenName;

  if (state.isMonitoring) {
    startTimer();
  }

  addLog('info', 'Updated configuration.', req.body);
  
  if (targetChanged && state.isMonitoring) {
    scanAndVote();
  }

  broadcastSSE({ type: 'stateUpdate', state });
  res.json({ success: true, state });
});

app.post('/api/logs/clear', (req, res) => {
  state.logs = [];
  res.json({ success: true });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  res.write(`data: ${JSON.stringify({ type: 'init', state })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Serve static React build files
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Bind to 0.0.0.0 for Render / Cloud reverse proxy compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Poll Everywhere Automator running on http://0.0.0.0:${PORT}`);
});
