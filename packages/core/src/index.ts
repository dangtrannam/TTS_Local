// Core services
export { PiperTTSService } from './services/piper-tts-service.js';
export { PiperBinaryManager } from './services/piper-binary-manager.js';
export { PiperVoiceManager } from './services/piper-voice-manager.js';

// Utilities
export { getAppPaths } from './utils/platform-paths.js';
export { detectPlatform } from './utils/platform-detector.js';
export { formatErrorForUser } from './utils/error-handler.js';

// Re-export types for convenience
export type {
  TTSOptions,
  TTSResult,
  SynthesisProgress,
  PiperConfig,
  PlatformInfo,
  DownloadProgress,
} from '@tts-local/types';
export { TTSError, TTSErrorCode } from '@tts-local/types';
