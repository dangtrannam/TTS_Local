import fs from 'node:fs/promises';
import path from 'node:path';
import type { DownloadProgress } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { getVoiceModelUrls } from '../config/default-config.js';
import { downloadFile } from '../utils/download-helper.js';
import { getAppPaths } from '../utils/platform-paths.js';
import { getElectronResourcesPath } from '../utils/electron-helper.js';

/**
 * Manages voice model download, validation, and discovery.
 * Models stored in platform-specific app data directory.
 */
export class PiperVoiceManager {
  private modelsDir: string;

  constructor(modelsDir?: string) {
    this.modelsDir = modelsDir || getAppPaths().models;
  }

  /** Get path to a voice model's .onnx file, checking bundled models first */
  getModelPath(voiceName: string): string {
    this.validateVoiceName(voiceName);

    // Check bundled models first (in packaged Electron app)
    const resourcesPath = getElectronResourcesPath();
    if (resourcesPath) {
      const bundledModelPath = path.join(resourcesPath, 'piper', 'models', `${voiceName}.onnx`);
      // Return bundled path if it might exist (actual existence checked in ensureModel)
      return bundledModelPath;
    }

    return path.join(this.modelsDir, `${voiceName}.onnx`);
  }

  /** Get path to a voice model's .onnx.json config, checking bundled configs first */
  private getModelConfigPath(voiceName: string): string {
    // Check bundled configs first (in packaged Electron app)
    const resourcesPath = getElectronResourcesPath();
    if (resourcesPath) {
      return path.join(resourcesPath, 'piper', 'models', `${voiceName}.onnx.json`);
    }
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

    // If bundled model doesn't exist but we're in packaged app, try downloading to user data dir
    // This allows users to add more voices after installation
    if (getElectronResourcesPath()) {
      // Download to user data directory instead of bundled resources
      const userModelsDir = this.modelsDir;
      const userModelPath = path.join(userModelsDir, `${voiceName}.onnx`);

      // Check if already downloaded to user directory
      try {
        await fs.access(userModelPath);
        const configPath = userModelPath + '.json';
        await fs.access(configPath);
        return userModelPath;
      } catch {
        // Not in user directory, download it
        await this.downloadModelToUserDir(voiceName, onProgress);
        await this.validateModel(userModelPath);
        return userModelPath;
      }
    }

    await this.downloadModel(voiceName, onProgress);
    await this.validateModel(modelPath);

    return modelPath;
  }

  /** Download model to user data directory (for packaged apps) */
  private async downloadModelToUserDir(
    voiceName: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<void> {
    await fs.mkdir(this.modelsDir, { recursive: true });

    const urls = getVoiceModelUrls(voiceName);
    const onnxPath = path.join(this.modelsDir, `${voiceName}.onnx`);
    const configPath = path.join(this.modelsDir, `${voiceName}.onnx.json`);

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

  /** List installed voice models by scanning models directory (including bundled) */
  async listInstalledModels(): Promise<string[]> {
    const models = new Set<string>();

    // Check bundled models first (in packaged Electron app)
    const resourcesPath = getElectronResourcesPath();
    if (resourcesPath) {
      try {
        const bundledModelsDir = path.join(resourcesPath, 'piper', 'models');
        const bundledFiles = await fs.readdir(bundledModelsDir);
        bundledFiles
          .filter((f) => f.endsWith('.onnx') && !f.endsWith('.onnx.json'))
          .forEach((f) => models.add(f.replace('.onnx', '')));
      } catch {
        // Bundled models dir doesn't exist, that's okay
      }
    }

    // Check user-downloaded models
    try {
      const files = await fs.readdir(this.modelsDir);
      files
        .filter((f) => f.endsWith('.onnx') && !f.endsWith('.onnx.json'))
        .forEach((f) => models.add(f.replace('.onnx', '')));
    } catch {
      // User models dir doesn't exist yet, that's okay
    }

    return Array.from(models);
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
