import React from 'react';
import { Monitor, CheckCircle2, Clock, MousePointerClick, Sparkles, Brain } from 'lucide-react';

export default function LiveMonitor({ state, onManualVote }) {
  const { currentPoll, lastScreenshot, targetUrl } = state;

  return (
    <div className="card-light" style={{ marginBottom: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Live Poll Everywhere Monitor Viewport
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Live feed from <strong style={{ color: 'var(--text-main)' }}>{targetUrl}</strong>
          </p>
        </div>

        {currentPoll.active ? (
          <span className="badge-minimal badge-green">
            <Sparkles size={13} /> Active Poll Detected
          </span>
        ) : (
          <span className="badge-minimal badge-amber">
            <Clock size={13} /> Waiting for Presenter
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Side: Screenshot Viewport */}
        <div>
          <div style={{
            position: 'relative',
            aspectRatio: '16/10',
            backgroundColor: '#141416',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            {lastScreenshot ? (
              <img 
                src={lastScreenshot} 
                alt="Poll Everywhere Live Feed" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa' }}>
                <Monitor size={44} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem', color: '#e4e4e7', fontWeight: '600' }}>No live feed captured yet</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Start the 30s monitor to load page view.</p>
              </div>
            )}

            {/* Live Indicator Overlay */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(20, 20, 22, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-pill)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              <span className={state.isMonitoring ? 'pulse-dot-dark' : ''} style={{ background: state.isMonitoring ? '#10b981' : '#a1a1aa' }}></span>
              {state.isMonitoring ? 'LIVE 30s REFRESH' : 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* Right Side: Options Grid & AI Reasoning */}
        <div>
          <div style={{
            background: 'var(--bg-card-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.25rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              CURRENT QUESTION DETECTED
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.3rem' }}>
              {currentPoll.question || 'Waiting for presenter to open a poll...'}
            </h3>

            {currentPoll.selectedOption && (
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem'
              }}>
                <CheckCircle2 size={16} /> Selected Response: "{currentPoll.selectedOption}"
              </div>
            )}

            {/* Gemini AI Reasoning Box matching site charcoal design */}
            {currentPoll.aiReasoning && (
              <div style={{
                background: 'var(--text-main)',
                color: '#ffffff',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem'
              }}>
                <Brain size={18} color="#ffffff" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '800', color: '#ffffff', marginBottom: '0.2rem' }}>Gemini AI Reasoning:</div>
                  <div style={{ opacity: 0.85, lineHeight: '1.4' }}>{currentPoll.aiReasoning}</div>
                </div>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {currentPoll.options && currentPoll.options.length > 0 ? (
              currentPoll.options.map((opt, idx) => {
                const isSelected = opt.isSelected || currentPoll.selectedOption === opt.text;
                const mockPercentage = isSelected ? 100 : Math.max(15, Math.floor(80 / (idx + 1)));

                return (
                  <div
                    key={idx}
                    style={{
                      background: isSelected ? 'var(--text-main)' : 'var(--bg-card-secondary)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '110px',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? 'var(--shadow-md)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.7 }}>
                        OPTION {String.fromCharCode(65 + idx)}
                      </div>
                      <button
                        onClick={() => onManualVote(idx)}
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.2)' : '#ffffff',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          border: 'none',
                          borderRadius: 'var(--radius-pill)',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                        title="Manual Click"
                      >
                        <MousePointerClick size={12} /> Click
                      </button>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: '700', margin: '0.4rem 0' }}>
                      {opt.text}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', opacity: 0.8, marginBottom: '0.25rem' }}>
                        <span>{isSelected ? 'SELECTED' : 'CHOICE'}</span>
                        <span>{mockPercentage}%</span>
                      </div>
                      <div style={{ height: '4px', background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${mockPercentage}%`, background: isSelected ? '#ffffff' : 'var(--text-main)', borderRadius: '2px' }}></div>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-card-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                No response options detected yet. When a presenter starts a poll, options will appear here and be auto-clicked.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
