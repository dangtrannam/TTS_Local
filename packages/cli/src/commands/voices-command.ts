/**
 * Voices command implementation
 * Lists installed voice models
 */
import { Command } from 'commander';
import { PiperVoiceManager } from '@tts-local/core';
import { TTSError } from '@tts-local/types';
import { showError, showInfo, showWarning } from '../utils/cli-output.js';
import { getConfig } from '../utils/config-manager.js';
import { stat } from 'node:fs/promises';
import { getAppPaths } from '@tts-local/core';
import { join } from 'node:path';

/**
 * Register the voices command with Commander
 */
export function registerVoicesCommand(program: Command): void {
  program
    .command('voices')
    .description('List installed voice models')
    .action(async () => {
      try {
        await handleVoicesCommand();
      } catch (error) {
        if (error instanceof TTSError) {
          showError(error);
          process.exit(1);
        }
        throw error;
      }
    });
}

/**
 * Handle voices command execution
 */
async function handleVoicesCommand(): Promise<void> {
  const voiceManager = new PiperVoiceManager();
  const config = await getConfig();
  const installedVoices = await voiceManager.listInstalledModels();

  if (installedVoices.length === 0) {
    showWarning('No voice models installed.');
    showInfo('Run "tts setup" to install the default voice model.');
    return;
  }

  console.log('\nInstalled Voice Models:\n');

  const { models } = getAppPaths();

  for (const voice of installedVoices) {
    const isDefault = voice === config.defaultVoice;
    const marker = isDefault ? '* ' : '  ';

    // Get file size
    const modelPath = join(models, `${voice}.onnx`);
    let size = 0;
    try {
      const stats = await stat(modelPath);
      size = stats.size;
    } catch {
      // Ignore size errors
    }

    const sizeStr = formatSize(size);
    const defaultStr = isDefault ? ' (default)' : '';

    console.log(`${marker}${voice}${defaultStr} - ${sizeStr}`);
  }

  console.log('\n');
  showInfo(`Total: ${installedVoices.length} voice model(s)`);

  if (!installedVoices.includes(config.defaultVoice)) {
    showWarning(
      `Default voice "${config.defaultVoice}" is not installed. Run "tts setup" to download it.`,
    );
  }
}

/**
 * Format file size in bytes to human-readable format
 */
function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
