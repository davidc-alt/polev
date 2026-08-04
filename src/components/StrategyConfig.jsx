import React, { useState } from 'react';
import { Sliders, Dices, ArrowUpRight, Hash, Sparkles, Eye, EyeOff, Power, Key, CheckCircle2, User, Mail, Lock } from 'lucide-react';

export default function StrategyConfig({ state, onUpdateConfig }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleStrategyChange = (newStrategy) => {
    onUpdateConfig({ strategy: newStrategy });
  };

  return (
    <div className="card-light" style={{ marginBottom: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Automation Strategy & Participant Profile
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure your registered name and how Poll Everywhere options are selected every 30s
          </p>
        </div>

        <button 
          onClick={() => onUpdateConfig({ isAutoVoting: !state.isAutoVoting })}
          className="badge-minimal"
          style={{
            background: state.isAutoVoting ? '#dcfce7' : '#fee2e2',
            color: state.isAutoVoting ? '#15803d' : '#991b1b',
            border: 'none',
            padding: '0.4rem 0.85rem',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          <Power size={13} />
          {state.isAutoVoting ? 'AUTO-CLICK ENABLED' : 'AUTO-CLICK DISABLED'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Strategy Pills Grid */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            SELECT CLICK STRATEGY
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            
            {/* Strategy 1: Random */}
            <button
              onClick={() => handleStrategyChange('random')}
              style={{
                background: state.strategy === 'random' ? 'var(--text-main)' : 'var(--bg-card-secondary)',
                color: state.strategy === 'random' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem' }}>
                <Dices size={16} /> Random Choice
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                Picks a random available answer
              </p>
            </button>

            {/* Strategy 2: First Option */}
            <button
              onClick={() => handleStrategyChange('first')}
              style={{
                background: state.strategy === 'first' ? 'var(--text-main)' : 'var(--bg-card-secondary)',
                color: state.strategy === 'first' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem' }}>
                <ArrowUpRight size={16} /> Option 1 (A)
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                Always selects Choice A
              </p>
            </button>

            {/* Strategy 3: Choice Number */}
            <button
              onClick={() => handleStrategyChange('index')}
              style={{
                background: state.strategy === 'index' ? 'var(--text-main)' : 'var(--bg-card-secondary)',
                color: state.strategy === 'index' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem' }}>
                <Hash size={16} /> Choice Number
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                Selects specific option #
              </p>
            </button>

            {/* Strategy 4: Gemini AI Auto-Answer */}
            <button
              onClick={() => handleStrategyChange('ai')}
              style={{
                background: state.strategy === 'ai' ? 'var(--text-main)' : 'var(--bg-card-secondary)',
                color: state.strategy === 'ai' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.9rem' }}>
                <Sparkles size={16} /> Gemini AI Answer
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                AI analyzes question & picks best answer
              </p>
            </button>

          </div>

          {/* Sub-control 1: Target Choice Index */}
          {state.strategy === 'index' && (
            <div style={{ marginTop: '1rem', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Target Option Index:</label>
              <select
                className="input-minimal"
                value={state.optionIndex}
                onChange={(e) => onUpdateConfig({ optionIndex: parseInt(e.target.value) })}
                style={{ marginTop: '0.3rem', background: 'var(--bg-card-secondary)' }}
              >
                <option value={0}>Option #1 (A)</option>
                <option value={1}>Option #2 (B)</option>
                <option value={2}>Option #3 (C)</option>
                <option value={3}>Option #4 (D)</option>
              </select>
            </div>
          )}

          {/* Sub-control 2: Gemini API Key Box (pops up when 'ai' strategy is selected) */}
          {state.strategy === 'ai' && (
            <div style={{
              marginTop: '1rem',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Key size={15} /> Enter Gemini API Key:
                </label>
                {state.geminiApiKey ? (
                  <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle2 size={13} /> Key Saved
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Key Required
                  </span>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="input-minimal"
                  placeholder="AIzaSy..."
                  value={state.geminiApiKey || ''}
                  onChange={(e) => onUpdateConfig({ geminiApiKey: e.target.value })}
                  style={{ paddingRight: '2.5rem', background: 'var(--bg-card-secondary)', border: '1px solid var(--border-subtle)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                  title={showApiKey ? 'Hide Key' : 'Show Key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Participant Name, Email & Password Profile */}
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              REGISTERED PARTICIPANT & ACCOUNT LOGIN
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Screen Name */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-minimal"
                  placeholder="Screen Name (e.g. David Bondarescu)"
                  value={state.screenName || ''}
                  onChange={(e) => onUpdateConfig({ screenName: e.target.value })}
                  style={{ paddingLeft: '2.2rem', background: 'var(--bg-card-secondary)' }}
                  title="Registered Participant Name"
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

              {/* Email Address & Password Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Email Address */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-minimal"
                    placeholder="Account Email (e.g. david@example.com)"
                    value={state.participantEmail || ''}
                    onChange={(e) => onUpdateConfig({ participantEmail: e.target.value })}
                    style={{ paddingLeft: '2.2rem', background: 'var(--bg-card-secondary)' }}
                    title="Account Email Address"
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                {/* Password (Optional) */}
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-minimal"
                    placeholder="Password (Optional)"
                    value={state.participantPassword || ''}
                    onChange={(e) => onUpdateConfig({ participantPassword: e.target.value })}
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.2rem', background: 'var(--bg-card-secondary)' }}
                    title="Account Password (Optional)"
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)'
                    }}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Auto-syncs screen name (clicks pencil ✏️ icon on "Responding as...") and auto-logs in with your email/password when prompted.
            </p>
          </div>

          {/* Scan Interval Slider */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SCAN INTERVAL: <strong style={{ color: 'var(--text-main)' }}>{state.intervalSeconds} SECONDS</strong>
              </label>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[10, 15, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onUpdateConfig({ intervalSeconds: sec })}
                    style={{
                      background: state.intervalSeconds === sec ? 'var(--text-main)' : 'var(--bg-card-secondary)',
                      color: state.intervalSeconds === sec ? '#ffffff' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-pill)',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={state.intervalSeconds || 30}
              onChange={(e) => onUpdateConfig({ intervalSeconds: parseInt(e.target.value) })}
              style={{
                width: '100%',
                accentColor: 'var(--text-main)',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Browser Window Mode */}
          <div style={{
            background: 'var(--bg-card-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Eye size={18} color="var(--text-main)" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>Show Browser Window</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {state.headful ? 'Visible Chromium window active' : 'Headless background runner'}
                </div>
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ headful: !state.headful })}
              className="btn-outline-pill"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              {state.headful ? 'VISIBLE' : 'HEADLESS'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
