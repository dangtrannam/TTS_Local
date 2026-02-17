import React from 'react';

interface PlaybackControlsProps {
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  isSynthesizing: boolean;
  canPlay: boolean;
}

export function PlaybackControls({
  onPlay,
  onStop,
  isPlaying,
  isSynthesizing,
  canPlay,
}: PlaybackControlsProps): React.ReactElement {
  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    backgroundColor: enabled ? '#3b82f6' : '#d1d5db',
    color: enabled ? '#ffffff' : '#9ca3af',
    transition: 'all 0.2s',
    opacity: enabled ? 1 : 0.6,
  });

  const stopButtonStyle: React.CSSProperties = {
    ...buttonStyle(isPlaying),
    backgroundColor: isPlaying ? '#ef4444' : '#d1d5db',
  };

  return (
    <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
      <button
        data-testid="speak-button"
        onClick={onPlay}
        disabled={!canPlay || isSynthesizing || isPlaying}
        style={buttonStyle(canPlay && !isSynthesizing && !isPlaying)}
        onMouseEnter={(e) => {
          if (canPlay && !isSynthesizing && !isPlaying) {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }
        }}
        onMouseLeave={(e) => {
          if (canPlay && !isSynthesizing && !isPlaying) {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }
        }}
      >
        {isSynthesizing ? 'Synthesizing...' : '▶ Speak'}
      </button>

      <button
        data-testid="stop-button"
        onClick={onStop}
        disabled={!isPlaying}
        style={stopButtonStyle}
        onMouseEnter={(e) => {
          if (isPlaying) {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }
        }}
        onMouseLeave={(e) => {
          if (isPlaying) {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }
        }}
      >
        ■ Stop
      </button>
    </div>
  );
}
