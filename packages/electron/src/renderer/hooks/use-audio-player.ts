import { useRef, useState, useCallback, useEffect } from 'react';

interface UseAudioPlayerReturn {
  play: (audioBuffer: ArrayBuffer) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
}

/**
 * Hook for playing audio using Web Audio API
 * Handles AudioContext lifecycle and playback state
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * Get or create AudioContext (lazy initialization for autoplay policy)
   */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  /**
   * Play audio from ArrayBuffer
   */
  const play = useCallback(
    async (audioBuffer: ArrayBuffer): Promise<void> => {
      // Stop any currently playing audio
      stop();

      const audioContext = getAudioContext();

      try {
        // Decode WAV data to AudioBuffer
        const buffer = await audioContext.decodeAudioData(audioBuffer.slice(0));

        // Create source node
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);

        // Track playback state
        source.onended = () => {
          setIsPlaying(false);
          sourceNodeRef.current = null;
        };

        // Store reference for stop functionality
        sourceNodeRef.current = source;
        setIsPlaying(true);

        // Start playback
        source.start(0);
      } catch (error) {
        setIsPlaying(false);
        throw new Error(
          `Audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
    [getAudioContext],
  );

  /**
   * Stop currently playing audio
   */
  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stop]);

  return { play, stop, isPlaying };
}
