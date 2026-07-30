import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import StrategyConfig from './components/StrategyConfig';
import LiveMonitor from './components/LiveMonitor';
import ExtensionGenerator from './components/ExtensionGenerator';
import Simulator from './components/Simulator';
import ActivityLog from './components/ActivityLog';

export default function App() {
  const [state, setState] = useState({
    isMonitoring: false,
    isAutoVoting: true,
    targetUrl: 'https://pollev.com/demouser',
    intervalSeconds: 30,
    strategy: 'random',
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
      question: 'Initializing monitor...',
      options: [],
      selectedOption: null,
      aiReasoning: null
    },
    logs: []
  });

  const [activeTab, setActiveTab] = useState('control');
  const [targetInput, setTargetInput] = useState('https://pollev.com/demouser');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    fetchStatus();

    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'init' || data.type === 'stateUpdate') {
          setState(data.state);
          if (data.state.targetUrl) setTargetInput(data.state.targetUrl);
          if (data.type === 'stateUpdate') {
            setSecondsLeft(data.state.intervalSeconds || 30);
          }
        } else if (data.type === 'log') {
          setState(prev => ({
            ...prev,
            stats: data.stats || prev.stats,
            currentPoll: data.currentPoll || prev.currentPoll,
            logs: [data.log, ...(prev.logs || [])].slice(0, 200)
          }));
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (state.isMonitoring) {
      countdownTimerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            return state.intervalSeconds || 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownTimerRef.current);
      setSecondsLeft(state.intervalSeconds || 30);
    }

    return () => clearInterval(countdownTimerRef.current);
  }, [state.isMonitoring, state.intervalSeconds]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setState(data);
      if (data.targetUrl) setTargetInput(data.targetUrl);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  };

  const handleStart = async () => {
    try {
      const res = await fetch('/api/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setState(prev => ({ ...prev, isMonitoring: true }));
        setSecondsLeft(state.intervalSeconds || 30);
      }
    } catch (e) {
      console.error('Failed to start:', e);
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch('/api/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setState(prev => ({ ...prev, isMonitoring: false }));
      }
    } catch (e) {
      console.error('Failed to stop:', e);
    }
  };

  const handleManualScan = async () => {
    try {
      await fetch('/api/manual-scan', { method: 'POST' });
      setSecondsLeft(state.intervalSeconds || 30);
    } catch (e) {
      console.error('Failed manual scan:', e);
    }
  };

  const handleManualVote = async (index) => {
    try {
      await fetch('/api/manual-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      });
    } catch (e) {
      console.error('Failed manual vote:', e);
    }
  };

  const handleUpdateConfig = async (configUpdate) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configUpdate)
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        if (configUpdate.intervalSeconds) setSecondsLeft(configUpdate.intervalSeconds);
      }
    } catch (e) {
      console.error('Failed to update config:', e);
    }
  };

  const handleUrlChange = (newUrl) => {
    handleUpdateConfig({ targetUrl: newUrl });
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setState(prev => ({ ...prev, logs: [] }));
    } catch (e) {}
  };

  return (
    <div className="app-container">
      
      {/* Header Bar */}
      <Header 
        state={state}
        onStart={handleStart}
        onStop={handleStop}
        onManualScan={handleManualScan}
        onUrlChange={handleUrlChange}
        targetInput={targetInput}
        setTargetInput={setTargetInput}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Tab Views */}
      {activeTab === 'control' && (
        <>
          <StatsOverview state={state} secondsLeft={secondsLeft} />
          
          <StrategyConfig 
            state={state} 
            onUpdateConfig={handleUpdateConfig} 
          />

          <LiveMonitor 
            state={state} 
            onManualVote={handleManualVote} 
          />

          <ActivityLog 
            logs={state.logs} 
            onClearLogs={handleClearLogs} 
          />
        </>
      )}

      {activeTab === 'extension' && (
        <ExtensionGenerator 
          targetUrl={state.targetUrl}
          intervalSeconds={state.intervalSeconds}
          strategy={state.strategy}
          geminiApiKey={state.geminiApiKey}
        />
      )}

      {activeTab === 'simulator' && (
        <Simulator 
          strategy={state.strategy}
          isAutoVoting={state.isAutoVoting}
        />
      )}

      {/* Footer Credit */}
      <footer style={{
        marginTop: '2.5rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <div>
          poll.core • Gemini AI Auto-Responder Engine (30s Polling Cycle)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          Crafted by <strong style={{ color: 'var(--text-main)' }}>david bondarescu</strong>
        </div>
      </footer>

    </div>
  );
}
