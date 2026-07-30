import React, { useState } from 'react';
import { Terminal, Search, Trash2, Download, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';

export default function ActivityLog({ logs = [], onClearLogs }) {
  const [filterText, setFilterText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter(log => {
    const matchesText = !filterText || 
      log.message.toLowerCase().includes(filterText.toLowerCase()) ||
      (log.question && log.question.toLowerCase().includes(filterText.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesText && matchesType;
  });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pollev_bot_logs_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Type', 'Message', 'Question', 'OptionClicked', 'Strategy'];
    const rows = logs.map(l => [
      `"${l.timestamp}"`,
      `"${l.type}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      `"${(l.question || '').replace(/"/g, '""')}"`,
      `"${(l.optionClicked || '').replace(/"/g, '""')}"`,
      `"${l.strategy || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pollev_bot_logs_${Date.now()}.csv`;
    a.click();
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={15} color="#10b981" />;
      case 'warn': return <AlertTriangle size={15} color="#f59e0b" />;
      case 'error': return <AlertTriangle size={15} color="#ef4444" />;
      case 'scan': return <Zap size={15} color="var(--text-main)" />;
      default: return <Info size={15} color="var(--text-muted)" />;
    }
  };

  return (
    <div className="card-light">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Live Audit & Activity Logs
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Execution history of all 30-second DOM scans and clicked options
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '180px' }}>
            <input
              type="text"
              className="input-minimal"
              placeholder="Search logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', fontSize: '0.8rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="input-minimal"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <option value="all">All Logs</option>
            <option value="success">Votes</option>
            <option value="scan">Scans</option>
            <option value="info">Info</option>
          </select>

          <button onClick={exportJSON} className="btn-outline-pill" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} title="JSON">
            <Download size={13} /> JSON
          </button>
          <button onClick={exportCSV} className="btn-outline-pill" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} title="CSV">
            <Download size={13} /> CSV
          </button>
          <button onClick={onClearLogs} className="btn-outline-pill" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#dc2626' }} title="Clear">
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      <div className="font-mono" style={{
        background: 'var(--bg-card-secondary)',
        borderRadius: 'var(--radius-md)',
        maxHeight: '300px',
        overflowY: 'auto',
        fontSize: '0.82rem'
      }}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: log.type === 'success' ? '#dcfce7' : 'transparent',
                color: log.type === 'success' ? '#15803d' : 'var(--text-main)'
              }}
            >
              <div>{getLogIcon(log.type)}</div>
              <div style={{ width: '85px', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ flexGrow: 1, wordBreak: 'break-word', fontWeight: log.type === 'success' ? '700' : '500' }}>
                {log.message}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No log entries recorded yet. Start monitoring to generate audit history.
          </div>
        )}
      </div>
    </div>
  );
}
