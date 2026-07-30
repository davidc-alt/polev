import React, { useState } from 'react';
import { Code, Copy, Check, Bookmark, Layers, Sparkles, Key } from 'lucide-react';

export default function ExtensionGenerator({ targetUrl, intervalSeconds, strategy, geminiApiKey }) {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedUserscript, setCopiedUserscript] = useState(false);

  const keyToUse = geminiApiKey || 'YOUR_GEMINI_API_KEY';

  const bookmarkletJs = `javascript:(function(){if(window.__pollevBotActive)return alert('PollEverywhere Auto-Responder is already active!');window.__pollevBotActive=true;let intervalSec=${intervalSeconds||30};let strategy='${strategy||'ai'}';let apiKey='${keyToUse}';let votes=0;let countdown=intervalSec;console.log('🚀 PollEverywhere Gemini AI Bot Active! Checking every '+intervalSec+'s...');let hud=document.createElement('div');hud.id='pollev-bot-hud';hud.style.cssText='position:fixed;bottom:20px;right:20px;z-index:999999;background:#141416;border-radius:16px;padding:16px 20px;color:#fff;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.4);display:flex;flex-direction:column;gap:8px;min-width:260px;font-size:13px;';hud.innerHTML='<div style="display:flex;align-items:center;justify-space-between;font-weight:800;"><span>✨ poll.core AI bot</span><span id="pe-countdown" style="background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:10px;font-size:11px;">Next: '+intervalSec+'s</span></div><div id="pe-status" style="color:#a1a1aa;">Status: Initializing...</div><div style="font-size:11px;color:#71717a;">Strategy: '+strategy.toUpperCase()+' | Votes: <span id="pe-votes" style="color:#10b981;font-weight:bold;">0</span></div><button id="pe-close" style="margin-top:4px;background:rgba(255,255,255,0.1);border:none;color:#fff;padding:4px;border-radius:6px;cursor:pointer;font-size:11px;">Close HUD</button>';document.body.appendChild(hud);document.getElementById('pe-close').onclick=function(){clearInterval(botTimer);hud.remove();delete window.__pollevBotActive;};async function scanAndClick(){let options=Array.from(document.querySelectorAll('.component-response-option,[data-test-id*="response-option"],button[class*="response-option"],.pe-response-option__button,.component-response-multiple-choice__option'));if(options.length===0){let container=document.querySelector('.component-response,.pe-response-body,main');if(container)options=Array.from(container.querySelectorAll('button')).filter(b=>(b.innerText||'').trim().length>0&&!b.innerText.toLowerCase().includes('submit'));}let statusEl=document.getElementById('pe-status');let votesEl=document.getElementById('pe-votes');if(options.length>0){let selectedIdx=options.findIndex(el=>el.classList.contains('component-response-option--selected')||el.getAttribute('aria-pressed')==='true');if(selectedIdx!==-1){statusEl.innerText='🟢 Option already clicked!';}else{let targetIdx=0;if(strategy==='ai'&&apiKey&&apiKey!=='YOUR_GEMINI_API_KEY'){try{statusEl.innerText='🧠 Asking Gemini AI...';let qEl=document.querySelector('[data-test-id="question-title"],.component-poll-header__title,h1,h2');let qTxt=qEl?qEl.innerText:'Poll Question';let prompt='Analyze question and options. Return ONLY JSON: {"chosenIndex": number}.\nQuestion: "'+qTxt+'"\nOptions:\n'+options.map((o,i)=>i+': "'+(o.innerText||'').trim()+'"').join('\n');let res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json'}})});let data=await res.json();let raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;if(raw){let parsed=JSON.parse(raw);if(parsed.chosenIndex!==undefined)targetIdx=parseInt(parsed.chosenIndex);}}catch(e){console.error(e);targetIdx=0;}}else if(strategy==='random'){targetIdx=Math.floor(Math.random()*options.length);}options[targetIdx].click();votes++;votesEl.innerText=votes;statusEl.innerText='✨ AI Auto-Clicked Choice #'+(targetIdx+1);}}else{statusEl.innerText='⏳ Waiting for presenter...';}}scanAndClick();let botTimer=setInterval(()=>{countdown--;if(countdown<=0){countdown=intervalSec;scanAndClick();}let cEl=document.getElementById('pe-countdown');if(cEl)cEl.innerText='Next: '+countdown+'s';},1000);})();`;

  const tampermonkeyScript = `// ==UserScript==
// @name         PollEverywhere 30s Gemini AI Auto-Responder
// @namespace    http://pollev-bot/
// @version      2.0
// @description  Uses Gemini AI to automatically answer Poll Everywhere questions every 30 seconds!
// @author       david bondarescu
// @match        https://pollev.com/*
// @match        https://www.pollev.com/*
// @grant        none
// ==UserScript==

(function() {
    'use strict';

    const CHECK_INTERVAL_SECONDS = ${intervalSeconds || 30};
    const STRATEGY = '${strategy || 'ai'}';
    const GEMINI_API_KEY = '${keyToUse}';
    let votesSubmitted = 0;
    let secondsRemaining = CHECK_INTERVAL_SECONDS;

    console.log('[poll.core] Gemini AI UserScript Loaded. Interval:', CHECK_INTERVAL_SECONDS, 's');

    // Create Minimalist Dark HUD Overlay
    const hud = document.createElement('div');
    hud.id = 'pollev-bot-hud';
    hud.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;background:#141416;border-radius:16px;padding:16px 20px;color:#fff;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.4);display:flex;flex-direction:column;gap:8px;min-width:260px;font-size:13px;';
    hud.innerHTML = \`
      <div style="display:flex;align-items:center;justify-content:space-between;font-weight:800;">
        <span>✨ poll.core Gemini AI</span>
        <span id="pe-timer" style="background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:10px;font-size:11px;">Next: \${CHECK_INTERVAL_SECONDS}s</span>
      </div>
      <div id="pe-status" style="color:#a1a1aa;">Status: Initializing scan...</div>
      <div style="font-size:11px;color:#71717a;">Strategy: \${STRATEGY.toUpperCase()} | Votes: <span id="pe-votes-count" style="color:#10b981;font-weight:bold;">0</span></div>
    \`;
    document.body.appendChild(hud);

    async function scanAndClick() {
        const statusEl = document.getElementById('pe-status');
        const votesEl = document.getElementById('pe-votes-count');

        const optionSelectors = [
            '.component-response-option',
            '[data-test-id*="response-option"]',
            'button[class*="response-option"]',
            '.pe-response-option__button',
            '.component-response-multiple-choice__option'
        ];

        let options = [];
        for (const sel of optionSelectors) {
            const found = Array.from(document.querySelectorAll(sel));
            if (found.length > 0) { options = found; break; }
        }

        if (options.length === 0) {
            const container = document.querySelector('.component-response, .pe-response-body, main');
            if (container) {
                options = Array.from(container.querySelectorAll('button')).filter(b => (b.innerText || '').trim().length > 0 && !b.innerText.toLowerCase().includes('submit'));
            }
        }

        if (options.length > 0) {
            const alreadyVoted = options.some(el => 
                el.classList.contains('component-response-option--selected') || 
                el.getAttribute('aria-pressed') === 'true'
            );

            if (alreadyVoted) {
                if (statusEl) statusEl.innerText = '🟢 Option already selected!';
            } else {
                let targetIdx = 0;
                if (STRATEGY === 'ai' && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
                    try {
                        if (statusEl) statusEl.innerText = '🧠 Asking Gemini AI...';
                        const qEl = document.querySelector('[data-test-id="question-title"],.component-poll-header__title,h1,h2');
                        const qTxt = qEl ? qEl.innerText : 'Poll Question';
                        const prompt = \`Analyze the question and options. Return ONLY JSON: {"chosenIndex": number, "reasoning": "string"}.\nQuestion: "\${qTxt}"\nOptions:\n\` + options.map((o, i) => \`\${i}: "\${(o.innerText || '').trim()}"\`).join('\\n');
                        
                        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${GEMINI_API_KEY}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { responseMimeType: 'application/json' }
                            })
                        });
                        const data = await res.json();
                        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (parsed.chosenIndex !== undefined) targetIdx = parseInt(parsed.chosenIndex);
                        }
                    } catch (e) {
                        console.error('Gemini error:', e);
                        targetIdx = 0;
                    }
                } else if (STRATEGY === 'random') {
                    targetIdx = Math.floor(Math.random() * options.length);
                }

                options[targetIdx].click();
                votesSubmitted++;
                if (votesEl) votesEl.innerText = votesSubmitted;
                if (statusEl) statusEl.innerText = \`✨ Gemini AI Clicked Option #\${targetIdx + 1}\`;
            }
        } else {
            if (statusEl) statusEl.innerText = '⏳ Waiting for presenter...';
        }
    }

    scanAndClick();
    setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining <= 0) {
            secondsRemaining = CHECK_INTERVAL_SECONDS;
            scanAndClick();
        }
        const timerEl = document.getElementById('pe-timer');
        if (timerEl) timerEl.innerText = \`Next: \${secondsRemaining}s\`;
    }, 1000);
})();`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'bookmarklet') {
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2000);
    } else {
      setCopiedUserscript(true);
      setTimeout(() => setCopiedUserscript(false), 2000);
    }
  };

  return (
    <div className="card-light" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
            In-Browser Injector & Bookmarklet
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Direct tab auto-responder powering Gemini AI answers in your browser
          </p>
        </div>
        <span className="badge-minimal badge-purple">
          <Sparkles size={12} /> Gemini AI Enabled
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Option A: Bookmarklet */}
        <div style={{
          background: 'var(--bg-card-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              <Bookmark size={18} /> Option A: 1-Click Bookmarklet
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Drag the button below to your browser bookmarks bar. Click it on any <strong>pollev.com</strong> tab to trigger 30s Gemini AI auto-clicks!
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={bookmarkletJs}
                onClick={(e) => e.preventDefault()}
                className="btn-dark"
                style={{ textDecoration: 'none', cursor: 'grab' }}
                title="Drag to Bookmarks Bar!"
              >
                ✨ Drag Me: poll.core Gemini AI
              </a>

              <button
                onClick={() => copyToClipboard(bookmarkletJs, 'bookmarklet')}
                className="btn-outline-pill"
              >
                {copiedBookmarklet ? <Check size={15} color="var(--accent-green)" /> : <Copy size={15} />}
                {copiedBookmarklet ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Option B: Tampermonkey Script */}
        <div style={{
          background: 'var(--bg-card-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1rem', color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
              <Layers size={18} /> Option B: Tampermonkey UserScript
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Copy this UserScript into Tampermonkey. It automatically uses your Gemini API key to solve live Poll Everywhere questions every 30 seconds!
            </p>

            <button
              onClick={() => copyToClipboard(tampermonkeyScript, 'userscript')}
              className="btn-dark"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {copiedUserscript ? <Check size={16} /> : <Copy size={16} />}
              {copiedUserscript ? 'UserScript Copied to Clipboard!' : 'Copy Tampermonkey UserScript'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
