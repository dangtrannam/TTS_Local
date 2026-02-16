import { ipcMain, type BrowserWindow } from 'electron';
import { PiperTTSService, PiperVoiceManager, getAppPaths } from '@tts-local/core';
import type { VoiceInfo } from '@tts-local/types';
import { validateIPC } from './ipc-validator.js';
import { promises as fs } from 'node:fs';

// Global TTS service instance
const ttsService = new PiperTTSService();
const paths = getAppPaths();
const voiceManager = new PiperVoiceManager(paths.models);

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

      const result = await ttsService.synthesize(text, options);
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
    return ttsService.isReady();
  });

  /**
   * Initialize TTS system (download binary and models)
   */
  ipcMain.handle('tts:setup', async () => {
    try {
      await ttsService.ensureReady((progress) => {
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
    const installedModels = await voiceManager.listInstalledModels();

    // Convert model names to VoiceInfo objects
    const voices: VoiceInfo[] = await Promise.all(
      installedModels.map(async (name) => {
        const modelPath = voiceManager.getModelPath(name);
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
    return ttsService.getConfig();
  });

  /**
   * Update configuration setting
   */
  ipcMain.handle('tts:set-config', async (_event, key: string, value: unknown) => {
    validateIPC('tts:set-config', [key, value]);

    // Update in-memory config (persistence can be added later)
    ttsService.setConfig(key as keyof import('@tts-local/types').PiperConfig, value);
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
