import React, { useRef, useEffect, useState } from 'react';

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
  const [preprocessEnabled, setPreprocessEnabled] = useState(false);
  const [preprocessMode, setPreprocessMode] = useState<'narrate' | 'summarize'>('narrate');
  const [preprocessStatus, setPreprocessStatus] = useState<string | null>(null);
  const [preprocessing, setPreprocessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && !preprocessing && value.trim()) {
          handleSpeak();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, value, preprocessEnabled, preprocessMode, preprocessing]);

  async function handleSpeak() {
    if (!preprocessEnabled) {
      onSpeak();
      return;
    }
    setPreprocessing(true);
    setPreprocessStatus('Preprocessing with Gemini AI...');
    try {
      const result = await window.ttsAPI.preprocessText(value, preprocessMode);
      if (result.fallback) {
        setPreprocessStatus(
          `⚠ Preprocessing failed: ${result.error?.message ?? 'Unknown error'}. Using original text.`,
        );
      } else {
        onChange(result.text);
        setPreprocessStatus('✓ Preprocessing complete');
      }
    } catch (err) {
      setPreprocessStatus(
        `⚠ ${err instanceof Error ? err.message : 'Preprocessing failed'}. Using original text.`,
      );
    } finally {
      setPreprocessing(false);
      onSpeak();
    }
  }

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;
  const isDisabled = disabled || preprocessing;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <textarea
        data-testid="text-input"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
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
          backgroundColor: isDisabled ? '#f9fafb' : '#ffffff',
          color: isDisabled ? '#9ca3af' : '#1f2937',
        }}
      />

      {/* Gemini preprocessing toggle row */}
      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preprocessEnabled}
            onChange={(e) => {
              setPreprocessEnabled(e.target.checked);
              setPreprocessStatus(null);
            }}
            disabled={isDisabled}
          />
          Preprocess with Gemini AI
        </label>
        {preprocessEnabled && (
          <select
            value={preprocessMode}
            onChange={(e) => setPreprocessMode(e.target.value as 'narrate' | 'summarize')}
            disabled={isDisabled}
            style={{ fontSize: '12px', padding: '2px 4px', borderRadius: '4px' }}
          >
            <option value="narrate">Narrate</option>
            <option value="summarize">Summarize</option>
          </select>
        )}
        {preprocessStatus && (
          <span
            style={{
              marginLeft: '4px',
              color: preprocessStatus.startsWith('⚠') ? '#eab308' : '#22c55e',
            }}
          >
            {preprocessStatus}
          </span>
        )}
      </div>

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
