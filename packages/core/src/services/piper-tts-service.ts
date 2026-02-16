import fs from 'node:fs/promises';
import type { PiperConfig, SynthesisProgress, TTSOptions, TTSResult } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { DEFAULT_CONFIG, MAX_TEXT_LENGTH } from '../config/default-config.js';
import { parseWavHeader } from '../utils/audio-utils.js';
import { getAppPaths } from '../utils/platform-paths.js';
import { PiperBinaryManager } from './piper-binary-manager.js';
import { PiperProcessRunner } from './piper-process-runner.js';
import { PiperVoiceManager } from './piper-voice-manager.js';

/**
 * Main TTS service orchestrator.
 * Coordinates binary management, voice models, and synthesis.
 * Pure business logic with no CLI/Electron dependencies.
 */
export class PiperTTSService {
  private binaryManager: PiperBinaryManager;
  private voiceManager: PiperVoiceManager;
  private processRunner: PiperProcessRunner;
  private ready = false;
  private config: PiperConfig;

  constructor(config?: Partial<PiperConfig>) {
    const paths = getAppPaths();
    this.config = {
      binaryPath: config?.binaryPath ?? '',
      modelsDir: config?.modelsDir ?? paths.models,
      defaultVoice: config?.defaultVoice ?? DEFAULT_CONFIG.defaultVoice,
      defaultSpeed: config?.defaultSpeed ?? DEFAULT_CONFIG.defaultSpeed,
      synthesisTimeout: config?.synthesisTimeout ?? DEFAULT_CONFIG.synthesisTimeout,
    };

    this.binaryManager = new PiperBinaryManager();
    this.voiceManager = new PiperVoiceManager(this.config.modelsDir);
    this.processRunner = new PiperProcessRunner();
  }

  /** Ensure binary and default voice model are ready */
  async ensureReady(onProgress?: (p: SynthesisProgress) => void): Promise<void> {
    if (this.ready) return;

    onProgress?.({ status: 'preparing', message: 'Checking Piper binary...' });

    const binaryPath = await this.binaryManager.ensureBinary((p) => {
      onProgress?.({
        status: 'downloading',
        message: 'Downloading Piper binary...',
        percent: p.percent,
      });
    });
    this.config.binaryPath = binaryPath;

    onProgress?.({ status: 'preparing', message: 'Checking voice model...' });

    await this.voiceManager.ensureModel(this.config.defaultVoice, (p) => {
      onProgress?.({
        status: 'downloading',
        message: 'Downloading voice model...',
        percent: p.percent,
      });
    });

    this.ready = true;
    onProgress?.({ status: 'complete', message: 'Ready' });
  }

  /** Synthesize text to WAV audio buffer */
  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    this.validateText(text);

    if (!this.ready) {
      await this.ensureReady();
    }

    const voice = options?.voice || this.config.defaultVoice;
    const speed = options?.speed || this.config.defaultSpeed;
    const timeout = options?.timeout || this.config.synthesisTimeout;

    // Ensure requested voice model is available
    const modelPath = await this.voiceManager.ensureModel(voice);

    const audioBuffer = await this.processRunner.run({
      binaryPath: this.config.binaryPath,
      modelPath,
      text,
      speed,
      timeout,
    });

    // Piper with --output-raw produces raw PCM, not WAV
    // Build a minimal WAV header for the raw data
    const sampleRate = 22050; // Piper default
    const wavBuffer = this.wrapRawPcmAsWav(audioBuffer, sampleRate);

    const wavInfo = parseWavHeader(wavBuffer);

    return {
      audio: wavBuffer,
      duration: wavInfo.duration,
      sampleRate: wavInfo.sampleRate,
    };
  }

  /** Synthesize text and save to file */
  async synthesizeToFile(text: string, outputPath: string, options?: TTSOptions): Promise<void> {
    const result = await this.synthesize(text, options);
    await fs.writeFile(outputPath, result.audio);
  }

  /** Check if service is ready */
  isReady(): boolean {
    return this.ready;
  }

  /** Get current configuration */
  getConfig(): PiperConfig {
    return { ...this.config };
  }

  /** Update configuration (in-memory only for now) */
  setConfig(key: keyof PiperConfig, value: unknown): void {
    if (key === 'defaultVoice') {
      this.config.defaultVoice = value as string;
    } else if (key === 'defaultSpeed') {
      this.config.defaultSpeed = value as number;
    } else if (key === 'synthesisTimeout') {
      this.config.synthesisTimeout = value as number;
    }
    // Note: binaryPath and modelsDir cannot be changed at runtime
  }

  private validateText(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new TTSError(TTSErrorCode.EMPTY_TEXT, 'Text input is empty');
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new TTSError(
        TTSErrorCode.TEXT_TOO_LONG,
        `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters (got ${text.length})`,
      );
    }
  }

  /** Wrap raw 16-bit PCM data in a WAV header */
  private wrapRawPcmAsWav(pcmData: Buffer, sampleRate: number): Buffer {
    const channels = 1;
    const bitDepth = 16;
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmData.length;
    const headerSize = 44;

    const header = Buffer.alloc(headerSize);
    header.write('RIFF', 0);
    header.writeUInt32LE(dataSize + headerSize - 8, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmData]);
  }
}
