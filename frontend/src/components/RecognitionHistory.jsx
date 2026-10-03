import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Download, 
  Volume2, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  FileText,
  RefreshCw
} from 'lucide-react';
import apiService from '../services/api';
import ttsService from '../services/tts';

export default function RecognitionHistory({ historyList, onHistoryCleared, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isClearing, setIsClearing] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);

  const filteredHistory = historyList.filter(item => {
    const matchesSearch = 
      item.detected_movement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.generated_message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = 
      sourceFilter === 'all' || item.source === sourceFilter;

    return matchesSearch && matchesSource;
  });

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all recognition history from SQLite?')) {
      return;
    }

    setIsClearing(true);
    ttsService.playChime('alert');
    try {
      await apiService.clearHistory();
      if (onHistoryCleared) onHistoryCleared();
    } catch (e) {
      console.error('Error clearing history:', e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleSpeakItem = (item) => {
    setSpeakingId(item.id);
    ttsService.speak(item.generated_message, true);
    setTimeout(() => setSpeakingId(null), 2000);
  };

  const exportCSV = () => {
    ttsService.playChime('click');
    const headers = ['ID', 'Timestamp', 'Detected Movement', 'Confidence', 'Emoji', 'Generated Message', 'Source'];
    const rows = filteredHistory.map(h => [
      h.id,
      `"${h.timestamp}"`,
      `"${h.detected_movement}"`,
      h.confidence,
      `"${h.emoji}"`,
      `"${h.generated_message.replace(/"/g, '""')}"`,
      `"${h.source || 'live_camera'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `signvision_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    ttsService.playChime('click');
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredHistory, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `signvision_history_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="history-container" style={{
      maxWidth: '1280px',
      margin: '20px auto',
      padding: '0 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      
      {/* Header bar */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-indigo)'
          }}>
            <HistoryIcon size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Recognition History & Logs</h2>
              <span className="badge badge-live">
                {historyList.length} Records
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
              Audited event log stored in SQLite database (<code style={{ color: 'var(--accent-cyan)' }}>signvision.db</code>)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={onRefresh}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredHistory.length === 0}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={exportJSON}
            disabled={filteredHistory.length === 0}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} />
            <span>JSON</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={isClearing || historyList.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          flex: '1 1 300px',
          maxWidth: '480px'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by gesture or message phrase..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Source:</span>
          {['all', 'live_camera', 'simulation'].map(src => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                background: sourceFilter === src ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
                color: sourceFilter === src ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                textTransform: 'capitalize'
              }}
            >
              {src.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel" style={{
        overflow: 'hidden',
        border: '1px solid var(--border-color)'
      }}>
        {filteredHistory.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HistoryIcon size={44} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No Recognition Records Found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Move in front of the camera or test gestures in the Simulation Lab to log events.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '14px 20px' }}>Emoji</th>
                  <th style={{ padding: '14px 20px' }}>Detected Movement</th>
                  <th style={{ padding: '14px 20px' }}>Spoken Assistive Message</th>
                  <th style={{ padding: '14px 20px' }}>Confidence</th>
                  <th style={{ padding: '14px 20px' }}>Source</th>
                  <th style={{ padding: '14px 20px' }}>Timestamp</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Audio</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => {
                  const confPct = Math.round((item.confidence || 0) * 100);
                  const isSpeakingThis = speakingId === item.id;
                  const dateStr = item.timestamp 
                    ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : '--';

                  return (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: '1.8rem' }}>
                        {item.emoji}
                      </td>

                      <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.detected_movement}
                      </td>

                      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                        "{item.generated_message}"
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontWeight: 700,
                            color: confPct > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                            fontSize: '0.85rem'
                          }}>
                            {confPct}%
                          </span>
                          <div style={{ width: '48px', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }}>
                            <div style={{
                              width: `${confPct}%`,
                              height: '100%',
                              background: confPct > 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                              borderRadius: '3px'
                            }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${item.source === 'simulation' ? 'badge-sim' : 'badge-live'}`} style={{ fontSize: '0.7rem' }}>
                          {item.source === 'simulation' ? 'SIM' : 'CAMERA'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleSpeakItem(item)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isSpeakingThis ? 'var(--accent-emerald)' : 'rgba(99, 102, 241, 0.15)',
                            color: isSpeakingThis ? '#ffffff' : 'var(--accent-indigo)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Replay Voice Audio"
                        >
                          <Volume2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
