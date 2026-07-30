import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

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

  const parsed = JSON.parse(rawText);
  let chosenIndex = parseInt(parsed.chosenIndex);

  if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= options.length) {
    chosenIndex = 0;
  }

  return {
    chosenIndex,
    reasoning: parsed.reasoning || `Gemini selected option #${chosenIndex + 1}`
  };
}

async function scanAndVote() {
  state.stats.checksPerformed++;
  state.stats.lastCheckTime = new Date().toISOString();
  
  addLog('scan', `Checking Poll Everywhere target: ${state.targetUrl}`);

  try {
    if (!browser || !browser.connected) {
      addLog('info', `Initializing Puppeteer browser (${state.headful ? 'Visible window' : 'Headless mode'})...`);
      
      const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800'
      ];

      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || null;

      browser = await puppeteer.launch({
        headless: !state.headful,
        executablePath: executablePath || undefined,
        args: launchArgs
      });
      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    const currentUrl = page.url();
    const formattedTarget = formatUrl(state.targetUrl);

    if (!currentUrl || currentUrl === 'about:blank' || !currentUrl.includes(new URL(formattedTarget).hostname)) {
      addLog('info', `Navigating to ${formattedTarget}...`);
      await page.goto(formattedTarget, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
    } else {
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        addLog('warn', `Reload timeout, checking existing page DOM.`);
      }
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
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    let screenshotBase64 = null;
    try {
      screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
      state.lastScreenshot = `data:image/jpeg;base64,${screenshotBase64}`;
    } catch (e) {
      console.error('Screenshot error:', e.message);
    }

    const pollResult = await page.evaluate(() => {
      const cleanText = (str) => str ? str.trim().replace(/\s+/g, ' ') : '';

      const waitingEl = document.querySelector('[data-test-id="waiting-screen"], .component-waiting-screen, .pe-waiting-screen');
      const waitingTextFound = document.body.innerText.toLowerCase().includes('waiting for presenter') || 
                               document.body.innerText.toLowerCase().includes('no active poll') ||
                               document.body.innerText.toLowerCase().includes('presenter is offline');

      const questionEl = document.querySelector(
        '[data-test-id="question-title"], .component-poll-header__title, .pe-question-title, [role="heading"], h1, h2, .component-response-header__title'
      );
      const questionText = questionEl ? cleanText(questionEl.innerText) : (waitingTextFound ? 'Waiting for presenter to start...' : 'Poll Everywhere Page');

      const optionSelectors = [
        '.component-response-option',
        '[data-test-id*="response-option"]',
        'button[class*="response-option"]',
        'button[class*="component-response-option"]',
        '.pe-response-option__button',
        '.component-response-multiple-choice__option',
        'button[data-test-id*="option"]',
        '[role="button"][class*="option"]',
        '.component-response-clickable-image__target'
      ];

      let rawOptions = [];
      for (const sel of optionSelectors) {
        const found = Array.from(document.querySelectorAll(sel));
        if (found.length > 0) {
          rawOptions = found;
          break;
        }
      }

      if (rawOptions.length === 0) {
        const responseContainer = document.querySelector('.component-response, .pe-response-body, main');
        if (responseContainer) {
          rawOptions = Array.from(document.querySelectorAll('button')).filter(btn => {
            const txt = btn.innerText || '';
            return txt.trim().length > 0 && !txt.toLowerCase().includes('submit') && !txt.toLowerCase().includes('clear');
          });
        }
      }

      const options = rawOptions.map((el, index) => {
        const isSelected = el.classList.contains('component-response-option--selected') || 
                           el.getAttribute('aria-pressed') === 'true' ||
                           el.getAttribute('data-selected') === 'true' ||
                           el.querySelector('.component-response-option__selected-icon') !== null;
        return {
          index,
          text: cleanText(el.innerText) || `Option ${index + 1}`,
          isSelected,
          className: el.className
        };
      });

      const selectedOptionIndex = options.findIndex(o => o.isSelected);

      return {
        isWaiting: waitingEl !== null || (options.length === 0 && waitingTextFound),
        hasOptions: options.length > 0,
        question: questionText,
        options,
        selectedOptionIndex: selectedOptionIndex >= 0 ? selectedOptionIndex : null,
        selectedOptionText: selectedOptionIndex >= 0 ? options[selectedOptionIndex].text : null
      };
    });

    if (pollResult.hasOptions) {
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
      } else if (state.isAutoVoting) {
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
            const main = document.querySelector('.component-response, .pe-response-body, main');
            if (main) els = Array.from(main.querySelectorAll('button'));
          }

          if (els[idx]) {
            els[idx].click();
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
      state.currentPoll = {
        active: false,
        question: pollResult.question || 'Waiting for presenter...',
        options: [],
        selectedOption: null,
        aiReasoning: null
      };
      addLog('info', `No active poll found on ${state.targetUrl} (Status: ${pollResult.question})`);
    }

  } catch (err) {
    addLog('error', `Scan error: ${err.message}`);
    console.error('Scan error:', err);
  }

  broadcastSSE({
    type: 'stateUpdate',
    state: {
      isMonitoring: state.isMonitoring,
      isAutoVoting: state.isAutoVoting,
      targetUrl: state.targetUrl,
      screenName: state.screenName,
      intervalSeconds: state.intervalSeconds,
      strategy: state.strategy,
      optionIndex: state.optionIndex,
      geminiApiKey: state.geminiApiKey,
      stats: state.stats,
      currentPoll: state.currentPoll,
      lastScreenshot: state.lastScreenshot
    }
  });
}

function startMonitoring() {
  if (state.isMonitoring) return;
  state.isMonitoring = true;
  addLog('info', `Monitoring started. Scanning every ${state.intervalSeconds} seconds.`);
  
  scanAndVote();
  
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (state.isMonitoring) {
      scanAndVote();
    }
  }, state.intervalSeconds * 1000);
}

function stopMonitoring() {
  state.isMonitoring = false;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  addLog('info', `Monitoring paused.`);
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json(state);
});

app.post('/api/start', (req, res) => {
  startMonitoring();
  res.json({ success: true, isMonitoring: state.isMonitoring });
});

app.post('/api/stop', (req, res) => {
  stopMonitoring();
  res.json({ success: true, isMonitoring: state.isMonitoring });
});

app.post('/api/config', async (req, res) => {
  const { targetUrl, screenName, intervalSeconds, strategy, optionIndex, geminiApiKey, isAutoVoting, headful } = req.body;
  
  let resetBrowser = false;

  if (targetUrl !== undefined) state.targetUrl = targetUrl;
  if (screenName !== undefined) state.screenName = screenName;
  if (intervalSeconds !== undefined) {
    state.intervalSeconds = Math.max(5, parseInt(intervalSeconds) || 30);
    if (state.isMonitoring) {
      clearInterval(timerId);
      timerId = setInterval(scanAndVote, state.intervalSeconds * 1000);
    }
  }
  if (strategy !== undefined) state.strategy = strategy;
  if (optionIndex !== undefined) state.optionIndex = parseInt(optionIndex) || 0;
  if (geminiApiKey !== undefined) state.geminiApiKey = geminiApiKey;
  if (isAutoVoting !== undefined) state.isAutoVoting = Boolean(isAutoVoting);

  if (headful !== undefined && Boolean(headful) !== state.headful) {
    state.headful = Boolean(headful);
    resetBrowser = true;
  }

  addLog('info', `Configuration updated: Name="${state.screenName}", Interval=${state.intervalSeconds}s, Strategy=${state.strategy.toUpperCase()}`);

  if (resetBrowser && browser) {
    try {
      await browser.close();
      browser = null;
      page = null;
    } catch (e) {}
  }

  res.json({ success: true, state });
});

app.post('/api/manual-scan', async (req, res) => {
  addLog('info', `Manual scan triggered by user.`);
  scanAndVote();
  res.json({ success: true, message: 'Scan initiated' });
});

app.post('/api/manual-vote', async (req, res) => {
  const { index } = req.body;
  if (index === undefined || !state.currentPoll.options[index]) {
    return res.status(400).json({ error: 'Invalid option index' });
  }

  addLog('info', `Manual vote triggered for option index ${index}: "${state.currentPoll.options[index].text}"`);

  if (page) {
    try {
      const clicked = await page.evaluate((idx) => {
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
        if (els[idx]) {
          els[idx].click();
          return true;
        }
        return false;
      }, index);

      if (clicked) {
        state.stats.votesSubmitted++;
        state.stats.lastVoteTime = new Date().toISOString();
        state.currentPoll.selectedOption = state.currentPoll.options[index].text;
        addLog('success', `Manual vote successful: "${state.currentPoll.options[index].text}"`);
        
        await new Promise(r => setTimeout(r, 1000));
        try {
          const screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 });
          state.lastScreenshot = `data:image/jpeg;base64,${screenshotBase64}`;
        } catch (e) {}
      }
    } catch (e) {
      addLog('error', `Manual vote failed: ${e.message}`);
    }
  }

  res.json({ success: true, state });
});

app.post('/api/logs/clear', (req, res) => {
  state.logs = [];
  addLog('info', 'Activity logs cleared.');
  res.json({ success: true });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  res.write(`data: ${JSON.stringify({ type: 'init', state })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});

app.listen(PORT, () => {
  console.log(`🚀 Poll Everywhere Auto-Responder Backend running on http://localhost:${PORT}`);
});
