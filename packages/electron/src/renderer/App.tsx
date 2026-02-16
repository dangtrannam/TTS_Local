import React, { useState, useEffect } from 'react';
import { useTTS } from './hooks/use-tts.js';
import { StatusIndicator } from './components/status-indicator.js';
import { TextInputPanel } from './components/text-input-panel.js';
import { PlaybackControls } from './components/playback-controls.js';
import { SettingsPanel } from './components/settings-panel.js';
import { SetupWizard } from './components/setup-wizard.js';

export function App(): React.ReactElement {
  const { status, isReady, error, speak, stop } = useTTS();
  const [text, setText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  /**
   * Check if setup wizard should be shown on mount
   */
  useEffect(() => {
    if (!isReady) {
      setShowSetupWizard(true);
    }
  }, [isReady]);

  /**
   * Handle Escape key to stop playback
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'playing') {
        stop();
      }

      // Ctrl/Cmd + , to open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, stop]);

  const handleSpeak = () => {
    if (text.trim()) {
      speak(text);
    }
  };

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    // Refresh ready state
    window.ttsAPI.isReady().then(() => {
      // Ready state will be updated by the hook
    });
  };

  const canPlay = isReady && text.trim().length > 0 && status === 'idle';
  const isDisabled = status === 'synthesizing' || status === 'playing';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Status Bar */}
      <StatusIndicator status={status} error={error} />

      {/* Text Input Area */}
      <TextInputPanel
        value={text}
        onChange={setText}
        onSpeak={handleSpeak}
        disabled={isDisabled}
        maxLength={100_000}
      />

      {/* Playback Controls */}
      <PlaybackControls
        onPlay={handleSpeak}
        onStop={stop}
        isPlaying={status === 'playing'}
        isSynthesizing={status === 'synthesizing'}
        canPlay={canPlay}
      />

      {/* Footer with Settings Button */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <span>TTS Local - Privacy-first text-to-speech</span>
        <button
          onClick={() => setIsSettingsOpen(true)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            color: '#6b7280',
          }}
        >
          ⚙ Settings
        </button>
      </div>

      {/* Modals */}
      <SetupWizard isOpen={showSetupWizard} onComplete={handleSetupComplete} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
