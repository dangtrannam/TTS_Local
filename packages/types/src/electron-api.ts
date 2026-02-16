import type { TTSOptions, SynthesisProgress, PiperConfig, DownloadProgress } from './tts-types.js';

/** Voice model information */
export interface VoiceInfo {
  /** Voice model identifier (e.g., en_US-amy-medium) */
  name: string;
  /** Language code (e.g., en_US) */
  language: string;
  /** Quality tier (low/medium/high) */
  quality: string;
  /** Model file size in bytes */
  sizeBytes: number;
}

/** Setup result from TTS initialization */
export interface SetupResult {
  success: boolean;
  message: string;
}

/** Electron IPC API exposed to renderer via contextBridge */
export interface ElectronTTSAPI {
  /** Synthesize text to audio */
  synthesize: (text: string, options?: Partial<TTSOptions>) => Promise<ArrayBuffer>;
  /** Check if TTS system is ready */
  isReady: () => Promise<boolean>;
  /** Initialize TTS system (download binary and models) */
  setup: () => Promise<SetupResult>;
  /** Get list of installed voice models */
  listVoices: () => Promise<VoiceInfo[]>;
  /** Get current configuration */
  getConfig: () => Promise<PiperConfig>;
  /** Update configuration setting */
  setConfig: (key: string, value: unknown) => Promise<void>;
  /** Subscribe to synthesis progress events */
  onProgress: (callback: (progress: SynthesisProgress) => void) => () => void;
  /** Subscribe to setup progress events */
  onSetupProgress: (callback: (progress: DownloadProgress) => void) => () => void;
}

declare global {
  interface Window {
    ttsAPI: ElectronTTSAPI;
  }
}
