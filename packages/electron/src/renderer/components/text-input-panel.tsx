import React, { useRef, useEffect } from 'react';

interface TextInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSpeak: () => void;
  disabled: boolean;
  maxLength?: number;
}

export function TextInputPanel({
  value,
  onChange,
  onSpeak,
  disabled,
  maxLength = 100_000,
}: TextInputPanelProps): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to speak
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSpeak();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, value, onSpeak]);

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter text to speak... (Ctrl+Enter to speak)"
        style={{
          flex: 1,
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          resize: 'none',
          outline: 'none',
          backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          color: disabled ? '#9ca3af' : '#1f2937',
        }}
      />
      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
        }}
      >
        <span style={{ color: '#6b7280' }}>Ctrl+Enter to speak • Esc to stop</span>
        <span
          style={{
            color: isOverLimit ? '#ef4444' : isNearLimit ? '#eab308' : '#6b7280',
            fontWeight: isNearLimit ? 500 : 400,
          }}
        >
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
