import fs from 'node:fs/promises';
import path from 'node:path';
import type { DownloadProgress } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { getVoiceModelUrls } from '../config/default-config.js';
import { downloadFile } from '../utils/download-helper.js';
import { getAppPaths } from '../utils/platform-paths.js';

/**
 * Manages voice model download, validation, and discovery.
 * Models stored in platform-specific app data directory.
 */
export class PiperVoiceManager {
  private modelsDir: string;

  constructor(modelsDir?: string) {
    this.modelsDir = modelsDir || getAppPaths().models;
  }

  /** Get path to a voice model's .onnx file */
  getModelPath(voiceName: string): string {
    this.validateVoiceName(voiceName);
    return path.join(this.modelsDir, `${voiceName}.onnx`);
  }

  /** Get path to a voice model's .onnx.json config */
  private getModelConfigPath(voiceName: string): string {
    return path.join(this.modelsDir, `${voiceName}.onnx.json`);
  }

  /** Ensure model exists, download if missing. Returns model path. */
  async ensureModel(
    voiceName: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string> {
    const modelPath = this.getModelPath(voiceName);

    if (await this.modelExists(voiceName)) {
      return modelPath;
    }

    await this.downloadModel(voiceName, onProgress);
    await this.validateModel(modelPath);

    return modelPath;
  }

  /** Download model files (.onnx + .onnx.json) from HuggingFace */
  async downloadModel(
    voiceName: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<void> {
    await fs.mkdir(this.modelsDir, { recursive: true });

    const urls = getVoiceModelUrls(voiceName);
    const onnxPath = this.getModelPath(voiceName);
    const configPath = this.getModelConfigPath(voiceName);

    try {
      // Download model file (large, reports progress)
      await downloadFile(urls.onnx, onnxPath, onProgress);
      // Download config file (small, no progress needed)
      await downloadFile(urls.config, configPath);
    } catch (err) {
      // Clean up partial downloads
      await fs.rm(onnxPath, { force: true }).catch(() => {});
      await fs.rm(configPath, { force: true }).catch(() => {});

      if (err instanceof TTSError) throw err;
      throw new TTSError(
        TTSErrorCode.MODEL_DOWNLOAD_FAILED,
        `Failed to download voice model '${voiceName}': ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  /** Validate model file exists and has non-zero size, config exists alongside */
  async validateModel(modelPath: string): Promise<void> {
    try {
      const stats = await fs.stat(modelPath);
      if (stats.size === 0) {
        throw new Error('Model file is empty');
      }

      const configPath = modelPath + '.json';
      await fs.access(configPath);
    } catch (err) {
      throw new TTSError(
        TTSErrorCode.MODEL_CORRUPT,
        `Voice model validation failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  /** List installed voice models by scanning models directory */
  async listInstalledModels(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.modelsDir);
      return files
        .filter((f) => f.endsWith('.onnx') && !f.endsWith('.onnx.json'))
        .map((f) => f.replace('.onnx', ''));
    } catch {
      return [];
    }
  }

  /** Validate voice name to prevent path traversal */
  private validateVoiceName(name: string): void {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
      throw new TTSError(
        TTSErrorCode.MODEL_NOT_FOUND,
        `Invalid voice name: ${name}. Only alphanumeric, hyphens, and underscores allowed.`,
      );
    }
  }

  private async modelExists(voiceName: string): Promise<boolean> {
    try {
      const modelPath = this.getModelPath(voiceName);
      const configPath = this.getModelConfigPath(voiceName);
      const [modelStats] = await Promise.all([fs.stat(modelPath), fs.access(configPath)]);
      return modelStats.size > 0;
    } catch {
      return false;
    }
  }
}
