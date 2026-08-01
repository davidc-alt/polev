import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Zap, ExternalLink, User, Check, Edit2 } from 'lucide-react';

export default function Header({ 
  state, 
  onStart, 
  onStop, 
  onManualScan, 
  onUrlChange, 
  targetInput, 
  setTargetInput, 
  activeTab,
  setActiveTab,
  onNameChange
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.screenName || 'David Bondarescu');

  const getInitials = (name) => {
    if (!name) return 'PE';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSaveName = (e) => {
    if (e) e.preventDefault();
    onNameChange(nameInput);
    setEditingName(false);
  };

  const handleUrlInputChange = (e) => {
    const val = e.target.value;
    setTargetInput(val);
    onUrlChange(val);
  };

  return (
    <header style={{ marginBottom: '2rem' }}>
      
      {/* Top Navbar Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--text-main)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={20} fill="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            poll<span style={{ color: 'var(--accent-purple)' }}>core</span>
          </span>
        </div>

        {/* Center Nav Pills */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          background: 'rgba(0,0,0,0.03)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            className={`nav-pill ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            Overview
          </button>
          <button
            className={`nav-pill ${activeTab === 'extension' ? 'active' : ''}`}
            onClick={() => setActiveTab('extension')}
          >
            Extension
          </button>
          <button
            className={`nav-pill ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            Sandbox
          </button>
        </div>

        {/* Top Right: Custom Name Credit Badge & Edit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {editingName ? (
            <form onSubmit={handleSaveName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="text"
                className="input-minimal"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', width: '160px' }}
              />
              <button type="submit" className="btn-dark" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                <Check size={14} /> Save
              </button>
            </form>
          ) : (
            <div 
              className="credit-badge" 
              onClick={() => { setNameInput(state.screenName || ''); setEditingName(true); }}
              style={{ cursor: 'pointer' }}
              title="Click to edit your name"
            >
              <div className="credit-avatar">{getInitials(state.screenName)}</div>
              <span>by <strong>{state.screenName || 'David Bondarescu'}</strong></span>
              <Edit2 size={12} style={{ opacity: 0.6, marginLeft: '0.2rem' }} />
            </div>
          )}

          <button 
            onClick={onManualScan}
            className="btn-icon-circle"
            title="Scan Now"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Main Page Title & Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              Poll Everywhere Automator
            </h1>
            {state.isMonitoring ? (
              <span className="badge-minimal badge-green">
                <span className="pulse-dot-dark"></span> 30s Scan Active
              </span>
            ) : (
              <span className="badge-minimal badge-amber">
                Standby Mode
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Automates Poll Everywhere responses for <strong>{state.screenName || 'David Bondarescu'}</strong> every {state.intervalSeconds}s
          </p>
        </div>

        {/* Target URL & Participant Name Controls (Instant Auto-Set on Type/Paste) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Participant Name Input */}
          <div style={{ position: 'relative', width: '180px' }}>
            <input
              type="text"
              className="input-minimal"
              placeholder="Your Name"
              value={state.screenName || ''}
              onChange={(e) => onNameChange(e.target.value)}
              style={{ paddingLeft: '2rem' }}
              title="Poll Everywhere Registered Name"
            />
            <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Instant Auto-Setting Target URL Input (No Redundant Button) */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              className="input-minimal"
              placeholder="pollev.com/username"
              value={targetInput}
              onChange={handleUrlInputChange}
              style={{ paddingRight: '2.2rem' }}
            />
            <a 
              href={targetInput.startsWith('http') ? targetInput : `https://${targetInput}`}
              target="_blank"
              rel="noreferrer"
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              title="Open in browser"
            >
              <ExternalLink size={15} />
            </a>
          </div>

          {state.isMonitoring ? (
            <button onClick={onStop} className="btn-danger-minimal">
              <Pause size={16} /> Pause Monitor
            </button>
          ) : (
            <button onClick={onStart} className="btn-dark">
              <Play size={16} /> Start 30s Monitor
            </button>
          )}
        </div>
      </div>

    </header>
  );
}
