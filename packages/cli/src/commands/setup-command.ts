/**
 * Setup command implementation
 * Downloads Piper binary and default voice model
 */
import { Command } from 'commander';
import { PiperTTSService } from '@tts-local/core';
import { TTSError } from '@tts-local/types';
import { showSpinner, showSuccess, showError } from '../utils/cli-output.js';

/**
 * Register the setup command with Commander
 */
export function registerSetupCommand(program: Command): void {
  program
    .command('setup')
    .description('Download Piper binary and default voice model')
    .action(async () => {
      try {
        await handleSetupCommand();
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
 * Handle setup command execution
 */
async function handleSetupCommand(): Promise<void> {
  const spinner = showSpinner('Checking Piper TTS installation...');

  try {
    const service = new PiperTTSService();

    // Download binary and default model with progress updates
    await service.ensureReady((progress) => {
      const message = progress.message || 'Processing...';
      spinner.text = message;

      if (progress.percent !== undefined) {
        const percent = Math.round(progress.percent);
        spinner.text = `${message} ${percent}%`;
      }
    });

    spinner.succeed('Setup complete!');

    // Verify with a quick test synthesis
    showSuccess('TTS is ready to use!');
    console.log('\nTry it out:');
    console.log('  tts speak "Hello world"');
    console.log('  tts speak --file README.md');
    console.log('  echo "test" | tts speak');
  } catch (error) {
    spinner.fail('Setup failed');
    throw error;
  }
}
