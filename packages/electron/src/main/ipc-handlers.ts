import { ipcMain, type BrowserWindow } from 'electron';
import { PiperTTSService, PiperVoiceManager, getAppPaths } from '@tts-local/core';
import type { VoiceInfo } from '@tts-local/types';
import { validateIPC } from './ipc-validator.js';
import { promises as fs } from 'node:fs';

// Lazy-initialized TTS service instances (avoid module-level side effects)
let ttsService: PiperTTSService | null = null;
let voiceManager: PiperVoiceManager | null = null;

function getTTSService(): PiperTTSService {
  if (!ttsService) {
    ttsService = new PiperTTSService();
  }
  return ttsService;
}

function getVoiceManager(): PiperVoiceManager {
  if (!voiceManager) {
    const paths = getAppPaths();
    voiceManager = new PiperVoiceManager(paths.models);
  }
  return voiceManager;
}

/**
 * Register all IPC handlers for TTS operations
 * @param mainWindow - Main browser window for sending events
 */
export function registerIPCHandlers(mainWindow: BrowserWindow): void {
  /**
   * Synthesize text to audio
   */
  ipcMain.handle(
    'tts:synthesize',
    async (_event, text: string, options?: Record<string, unknown>) => {
      validateIPC('tts:synthesize', [text, options]);

      const result = await getTTSService().synthesize(text, options);
      // Return ArrayBuffer for efficient IPC transfer
      return result.audio.buffer.slice(
        result.audio.byteOffset,
        result.audio.byteOffset + result.audio.byteLength,
      );
    },
  );

  /**
   * Check if TTS system is ready
   */
  ipcMain.handle('tts:is-ready', () => {
    return getTTSService().isReady();
  });

  /**
   * Initialize TTS system (download binary and models)
   */
  ipcMain.handle('tts:setup', async () => {
    try {
      await getTTSService().ensureReady((progress) => {
        mainWindow.webContents.send('tts:setup-progress', progress);
      });
      return { success: true, message: 'TTS system ready' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Setup failed',
      };
    }
  });

  /**
   * Get list of installed voice models
   */
  ipcMain.handle('tts:list-voices', async () => {
    const vm = getVoiceManager();
    const installedModels = await vm.listInstalledModels();

    // Convert model names to VoiceInfo objects
    const voices: VoiceInfo[] = await Promise.all(
      installedModels.map(async (name) => {
        const modelPath = vm.getModelPath(name);
        let sizeBytes = 0;

        try {
          const stats = await fs.stat(modelPath);
          sizeBytes = stats.size;
        } catch {
          // If we can't read the file, use 0
        }

        // Parse voice name (e.g., en_US-amy-medium)
        const parts = name.split('-');
        const language = parts[0] || 'unknown';
        const quality = parts[parts.length - 1] || 'unknown';

        return {
          name,
          language,
          quality,
          sizeBytes,
        };
      }),
    );

    return voices;
  });

  /**
   * Get current configuration
   */
  ipcMain.handle('tts:get-config', () => {
    return getTTSService().getConfig();
  });

  /**
   * Update configuration setting
   */
  ipcMain.handle('tts:set-config', async (_event, key: string, value: unknown) => {
    validateIPC('tts:set-config', [key, value]);

    // Update in-memory config (persistence can be added later)
    getTTSService().setConfig(key as keyof import('@tts-local/types').PiperConfig, value);
  });
}

/**
 * Unregister all IPC handlers
 */
export function unregisterIPCHandlers(): void {
  ipcMain.removeHandler('tts:synthesize');
  ipcMain.removeHandler('tts:is-ready');
  ipcMain.removeHandler('tts:setup');
  ipcMain.removeHandler('tts:list-voices');
  ipcMain.removeHandler('tts:get-config');
  ipcMain.removeHandler('tts:set-config');
}
