/** Options for text-to-speech synthesis */
export interface TTSOptions {
  /** Voice model name (default: 'en_US-amy-medium') */
  voice?: string;
  /** Speaking rate multiplier (0.5 - 2.0) */
  speed?: number;
  /** Optional file output path */
  outputPath?: string;
  /** Output format (WAV only for v1) */
  format?: 'wav';
  /** Synthesis timeout in ms (default: 30000) */
  timeout?: number;
}

/** Result of a TTS synthesis operation */
export interface TTSResult {
  /** WAV audio data */
  audio: Buffer;
  /** Audio duration in seconds */
  duration: number;
  /** Sample rate (typically 22050) */
  sampleRate: number;
}

/** Progress updates during synthesis pipeline */
export interface SynthesisProgress {
  status: 'preparing' | 'downloading' | 'synthesizing' | 'complete' | 'error';
  message?: string;
  /** 0-100 for download progress */
  percent?: number;
}

/** Piper TTS engine configuration */
export interface PiperConfig {
  /** Resolved at runtime */
  binaryPath: string;
  /** Resolved at runtime */
  modelsDir: string;
  defaultVoice: string;
  defaultSpeed: number;
  /** Synthesis timeout in ms */
  synthesisTimeout: number;
}

/** Detected platform information for binary selection */
export interface PlatformInfo {
  os: 'darwin' | 'win32' | 'linux';
  arch: 'x64' | 'arm64';
  /** e.g., 'macos_x64', 'linux_x64' */
  piperPlatformKey: string;
  /** '' or '.exe' */
  binaryExtension: string;
  archiveFormat: 'tar.gz' | 'zip';
  needsGatekeeperFix: boolean;
  needsChmodExecutable: boolean;
}

/** Download progress callback data */
export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  /** 0-100 */
  percent: number;
}
