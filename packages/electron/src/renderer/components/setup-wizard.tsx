import React, { useState, useEffect } from 'react';
import type { DownloadProgress } from '@tts-local/types';

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function SetupWizard({ isOpen, onComplete }: SetupWizardProps): React.ReactElement | null {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to setup progress
    const unsubscribe = window.ttsAPI.onSetupProgress((prog) => {
      setProgress(prog);
    });

    return unsubscribe;
  }, [isOpen]);

  const handleStart = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const result = await window.ttsAPI.setup();
      if (result.success) {
        onComplete();
      } else {
        setError(result.message);
        setIsRunning(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          minWidth: '500px',
          maxWidth: '600px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 600 }}>
          Welcome to TTS Local
        </h1>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>
          Before you can start using text-to-speech, we need to download the Piper TTS engine and a
          voice model. This is a one-time setup that will take a few moments.
        </p>

        {progress && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              {`Downloading... ${progress.bytesDownloaded.toLocaleString()} / ${progress.totalBytes.toLocaleString()} bytes`}
            </div>
            {progress.percent !== undefined && (
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress.percent}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: '24px',
              padding: '12px',
              backgroundColor: '#fee2e2',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleStart}
            disabled={isRunning}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              backgroundColor: isRunning ? '#d1d5db' : '#3b82f6',
              color: '#ffffff',
              cursor: isRunning ? 'not-allowed' : 'pointer',
            }}
          >
            {isRunning ? 'Setting up...' : error ? 'Retry Setup' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
