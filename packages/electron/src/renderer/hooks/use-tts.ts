import { useState, useEffect, useCallback } from 'react';
import type { TTSOptions } from '@tts-local/types';
import { useAudioPlayer } from './use-audio-player.js';

type TTSStatus = 'idle' | 'synthesizing' | 'playing' | 'error';

interface UseTTSReturn {
  status: TTSStatus;
  isReady: boolean;
  error: string | null;
  speak: (text: string, options?: Partial<TTSOptions>) => Promise<void>;
  stop: () => void;
  refreshReady: () => Promise<void>;
}

/**
 * Hook for managing TTS synthesis and playback state
 */
export function useTTS(): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { play, stop: stopAudio } = useAudioPlayer();

  /**
   * Check if TTS system is ready on mount
   */
  useEffect(() => {
    window.ttsAPI.isReady().then((ready) => {
      setIsReady(ready);
    });
  }, []);

  /**
   * Synthesize text and play audio
   */
  const speak = useCallback(
    async (text: string, options?: Partial<TTSOptions>) => {
      try {
        setStatus('synthesizing');
        setError(null);

        // Synthesize text to audio
        const audioBuffer = await window.ttsAPI.synthesize(text, options);

        // Play audio
        setStatus('playing');
        await play(audioBuffer);

        // Playback complete
        setStatus('idle');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Synthesis failed';
        setError(errorMessage);
        setStatus('error');
        console.error('TTS error:', err);
      }
    },
    [play],
  );

  /**
   * Stop playback and reset state
   */
  const stop = useCallback(() => {
    stopAudio();
    setStatus('idle');
    setError(null);
  }, [stopAudio]);

  /**
   * Re-check TTS ready state — call after setup wizard completes
   */
  const refreshReady = useCallback(async () => {
    const ready = await window.ttsAPI.isReady();
    setIsReady(ready);
  }, []);

  return {
    status,
    isReady,
    error,
    speak,
    stop,
    refreshReady,
  };
}
