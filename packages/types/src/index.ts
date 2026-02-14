/** Voice model configuration */
export interface VoiceConfig {
  modelPath: string;
  speakerId?: number;
  lengthScale?: number;
  noiseScale?: number;
  noiseW?: number;
  sampleRate?: number;
}

/** TTS synthesis options */
export interface SynthesisOptions {
  text: string;
  voice: VoiceConfig;
  outputPath?: string;
}

/** TTS synthesis result */
export interface SynthesisResult {
  audioBuffer: Buffer;
  sampleRate: number;
  durationMs: number;
}
