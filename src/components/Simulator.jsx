import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, RefreshCw, Sparkles, Clock } from 'lucide-react';

export default function Simulator({ strategy, isAutoVoting }) {
  const [simState, setSimState] = useState('waiting');
  const [selectedOption, setSelectedOption] = useState(null);
  const [autoVoteLog, setAutoVoteLog] = useState([]);
  const [simCountdown, setSimCountdown] = useState(30);

  const mcOptions = [
    'Option A: Python & Node.js Automation',
    'Option B: React & Vite Frontend Engine',
    'Option C: Headless Puppeteer Browser',
    'Option D: Microsecond Websocket SSE Stream'
  ];

  const tfOptions = [
    'True: Poll Everywhere is polled every 30 seconds',
    'False: Poll Everywhere is never refreshed'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSimCountdown((prev) => {
        if (prev <= 1) {
          handleSimScan();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [simState, selectedOption, strategy, isAutoVoting]);

  const handleSimScan = () => {
    const timestamp = new Date().toLocaleTimeString();
    if (simState === 'waiting') {
      setAutoVoteLog(prev => [`[${timestamp}] ⏳ Scan: Waiting for presenter to open poll...`, ...prev]);
    } else {
      const opts = simState === 'poll_mc' ? mcOptions : tfOptions;
      if (selectedOption !== null) {
        setAutoVoteLog(prev => [`[${timestamp}] 🟢 Scan: Active poll open, option "${opts[selectedOption]}" already clicked!`, ...prev]);
      } else if (isAutoVoting) {
        let chosenIdx = 0;
        if (strategy === 'random') {
          chosenIdx = Math.floor(Math.random() * opts.length);
        }
        setSelectedOption(chosenIdx);
        setAutoVoteLog(prev => [`[${timestamp}] 🎉 AUTO-CLICK SUCCESS! Clicked Option #${chosenIdx + 1}: "${opts[chosenIdx]}"`, ...prev]);
      } else {
        setAutoVoteLog(prev => [`[${timestamp}] ⚠️ Scan: Active poll detected, but Auto-Voting disabled.`, ...prev]);
      }
    }
  };

  return (
    <div className="card-light" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Interactive Poll Everywhere Test Sandbox
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Test auto-clicker logic with simulated presenter state changes
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
          Scan Cycle: <strong>{simCountdown}s</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Side: Mock Presenter Control & Screen */}
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSimState('waiting'); setSelectedOption(null); }}
              className="btn-outline-pill"
              style={{ background: simState === 'waiting' ? 'var(--text-main)' : undefined, color: simState === 'waiting' ? '#fff' : undefined }}
            >
              Waiting Screen
            </button>
            <button
              onClick={() => { setSimState('poll_mc'); setSelectedOption(null); }}
              className="btn-outline-pill"
              style={{ background: simState === 'poll_mc' ? 'var(--text-main)' : undefined, color: simState === 'poll_mc' ? '#fff' : undefined }}
            >
              Start Multiple Choice
            </button>
            <button
              onClick={() => { setSimState('poll_tf'); setSelectedOption(null); }}
              className="btn-outline-pill"
              style={{ background: simState === 'poll_tf' ? 'var(--text-main)' : undefined, color: simState === 'poll_tf' ? '#fff' : undefined }}
            >
              Start True / False
            </button>
          </div>

          <div style={{
            background: 'var(--bg-card-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '0.85rem' }}>Poll Everywhere Presenter</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pollev.com/demouser</span>
            </div>

            {simState === 'waiting' ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <Clock size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>Waiting for presenter to start...</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Checks for options every 30 seconds.</p>
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  {simState === 'poll_mc' ? 'Which technology stack powers fast auto-responders?' : 'Is Poll Everywhere scanned every 30 seconds?'}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(simState === 'poll_mc' ? mcOptions : tfOptions).map((opt, idx) => {
                    const isClicked = selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        style={{
                          background: isClicked ? 'var(--text-main)' : '#ffffff',
                          color: isClicked ? '#ffffff' : 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.65rem 0.9rem',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{opt}</span>
                        {isClicked && <CheckCircle2 size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Powered by Poll Everywhere</span>
              <span>{selectedOption !== null ? '1 Response Recorded' : '0 Responses'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Simulator Log Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SANDBOX AUDIT LOGS</span>
            <button
              onClick={handleSimScan}
              className="btn-dark"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={12} /> Trigger 30s Check
            </button>
          </div>

          <div className="font-mono" style={{
            background: 'var(--bg-dark-card)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            maxHeight: '260px',
            overflowY: 'auto',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            {autoVoteLog.length > 0 ? (
              autoVoteLog.map((log, i) => (
                <div key={i} style={{ color: log.includes('AUTO-CLICK') ? '#34d399' : log.includes('Waiting') ? '#a1a1aa' : '#ffffff' }}>
                  {log}
                </div>
              ))
            ) : (
              <div style={{ color: '#71717a', textAlign: 'center', paddingTop: '2rem' }}>
                Simulator logs will appear here when the 30s scan runs.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
