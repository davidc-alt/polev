import React from 'react';
import { Activity, Radio, CheckSquare, Clock, ArrowUpRight } from 'lucide-react';

export default function StatsOverview({ state, secondsLeft }) {
  const percent = Math.max(0, Math.min(100, (secondsLeft / (state.intervalSeconds || 30)) * 100));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.25rem',
      marginBottom: '2rem'
    }}>
      
      {/* Featured Dark Card: 30s Countdown Monitor */}
      <div className="card-dark" style={{
        background: 'linear-gradient(145deg, #141416 0%, #2e1065 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '180px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.02em', color: '#e4e4e7', textTransform: 'uppercase' }}>
            Scan Cycle
          </span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
            {state.intervalSeconds}s Interval
          </span>
        </div>

        <div>
          <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1', letterSpacing: '-0.03em' }}>
            {state.isMonitoring ? `${secondsLeft}s` : 'Paused'}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: '0.4rem' }}>
            {state.isMonitoring ? 'Next DOM scan running automatically' : 'Click Start Monitor to resume auto-clicks'}
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            background: '#ffffff',
            borderRadius: '3px',
            transition: 'width 1s linear'
          }}></div>
        </div>
      </div>

      {/* Card 2: Total Scans Conducted */}
      <div className="card-light" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Scans Conducted
          </span>
          <Activity size={18} color="var(--text-muted)" />
        </div>

        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {state.stats.checksPerformed}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            {state.stats.lastCheckTime ? `Last scan: ${new Date(state.stats.lastCheckTime).toLocaleTimeString()}` : '0 scans executed'}
          </div>
        </div>

        <div style={{ height: '6px', background: 'var(--bg-card-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: 'var(--text-main)', borderRadius: '3px' }}></div>
        </div>
      </div>

      {/* Card 3: Polls Detected */}
      <div className="card-light" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Polls Detected
          </span>
          <Radio size={18} color="var(--accent-purple)" />
        </div>

        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {state.stats.pollsDetected}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            {state.currentPoll.active ? '🟢 Poll currently active' : '⚪ Waiting for presenter'}
          </div>
        </div>

        <div style={{ height: '6px', background: 'var(--bg-card-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: state.currentPoll.active ? '100%' : '20%', background: 'var(--accent-purple)', borderRadius: '3px' }}></div>
        </div>
      </div>

      {/* Card 4: Votes Submitted */}
      <div className="card-light" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
            Votes Auto-Clicked
          </span>
          <CheckSquare size={18} color="var(--accent-green)" />
        </div>

        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {state.stats.votesSubmitted}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            {state.stats.lastVoteTime ? `Last click: ${new Date(state.stats.lastVoteTime).toLocaleTimeString()}` : '0 votes sent'}
          </div>
        </div>

        <div style={{ height: '6px', background: 'var(--bg-card-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: state.stats.votesSubmitted > 0 ? '100%' : '5%', background: 'var(--accent-green)', borderRadius: '3px' }}></div>
        </div>
      </div>

    </div>
  );
}
