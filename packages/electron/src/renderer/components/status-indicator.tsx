import React from 'react';

interface StatusIndicatorProps {
  status: 'idle' | 'synthesizing' | 'playing' | 'error';
  error?: string | null;
}

export function StatusIndicator({ status, error }: StatusIndicatorProps): React.ReactElement {
  const getStatusDisplay = () => {
    switch (status) {
      case 'idle':
        return { text: 'Ready', color: '#22c55e', icon: '●' };
      case 'synthesizing':
        return { text: 'Synthesizing...', color: '#eab308', icon: '◐' };
      case 'playing':
        return { text: 'Playing', color: '#3b82f6', icon: '▶' };
      case 'error':
        return { text: 'Error', color: '#ef4444', icon: '⚠' };
      default:
        return { text: 'Unknown', color: '#6b7280', icon: '?' };
    }
  };

  const display = getStatusDisplay();

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: display.color, fontSize: '16px' }}>{display.icon}</span>
        <span style={{ fontWeight: 500, color: '#1f2937' }}>{display.text}</span>
      </div>
      {error && status === 'error' && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#fee2e2',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
