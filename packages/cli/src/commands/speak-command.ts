/**
 * Speak command implementation
 * Synthesizes text to speech and plays or saves audio
 */
import { Command } from 'commander';
import { PiperTTSService } from '@tts-local/core';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { readInput } from '../utils/input-reader.js';
import { createAudioPlayer } from '../utils/audio-player.js';
import {
  showSpinner,
  showSuccess,
  showError,
  showInfo,
  formatDuration,
  formatFileSize,
} from '../utils/cli-output.js';
import { getConfig } from '../utils/config-manager.js';
import { writeFile } from 'node:fs/promises';
import { stat } from 'node:fs/promises';

interface SpeakOptions {
  file?: string;
  output?: string;
  voice?: string;
  speed?: string;
  timeout?: string;
}

/**
 * Register the speak command with Commander
 */
export function registerSpeakCommand(program: Command): void {
  program
    .command('speak [text]')
    .description('Synthesize and speak text aloud')
    .option('-f, --file <path>', 'Read text from file')
    .option('-o, --output <path>', 'Save audio to file instead of playing')
    .option('-v, --voice <name>', 'Voice model name')
    .option('-s, --speed <rate>', 'Speech rate (0.5-2.0)', '1.0')
    .option('-t, --timeout <ms>', 'Synthesis timeout in milliseconds (default: 30000)', '30000')
    .action(async (text: string | undefined, options: SpeakOptions) => {
      try {
        await handleSpeakCommand(text, options);
      } catch (error) {
        if (error instanceof TTSError) {
          showError(error);
          process.exit(error.code === 'BINARY_NOT_FOUND' ? 2 : 1);
        }
        throw error;
      }
    });
}

/**
 * Handle speak command execution
 */
async function handleSpeakCommand(
  textArg: string | undefined,
  options: SpeakOptions,
): Promise<void> {
  // Read input from argument, file, or stdin
  const text = await readInput(textArg, options.file);

  // Parse and validate speed
  const speed = parseFloat(options.speed || '1.0');
  if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
    throw new TTSError(TTSErrorCode.INVALID_INPUT, 'Speed must be a number between 0.5 and 2.0');
  }

  // Parse and validate timeout
  const timeout = parseInt(options.timeout || '30000', 10);
  if (isNaN(timeout) || timeout < 1000) {
    throw new TTSError(TTSErrorCode.INVALID_INPUT, 'Timeout must be at least 1000ms (1 second)');
  }

  // Load config for defaults
  const config = await getConfig();
  const voice = options.voice || config.defaultVoice;

  // Create TTS service
  const service = new PiperTTSService({
    defaultVoice: voice,
    defaultSpeed: speed,
  });

  // Ensure Piper is ready (download if needed)
  if (!service.isReady()) {
    const setupSpinner = showSpinner('Setting up Piper TTS...');

    try {
      await service.ensureReady((progress) => {
        const message = progress.message || 'Processing...';
        setupSpinner.text = message;
        if (progress.percent !== undefined) {
          setupSpinner.text = `${message} ${Math.round(progress.percent)}%`;
        }
      });
      setupSpinner.succeed('Piper TTS ready');
    } catch (error) {
      setupSpinner.fail('Failed to setup Piper TTS');
      throw error;
    }
  }

  // Synthesize speech
  const synthSpinner = showSpinner('Synthesizing speech...');

  try {
    const startTime = Date.now();
    const result = await service.synthesize(text, { voice, speed, timeout });
    const synthTime = Date.now() - startTime;

    synthSpinner.succeed(
      `Synthesized in ${formatDuration(synthTime)} (duration: ${formatDuration(result.duration)})`,
    );

    // Save to file or play
    if (options.output) {
      await writeFile(options.output, result.audio);
      const fileSize = (await stat(options.output)).size;
      showSuccess(`Audio saved to ${options.output} (${formatFileSize(fileSize)})`);
    } else {
      // Play audio
      showInfo('Playing audio...');
      const player = createAudioPlayer();
      await player.play(result.audio);
      showSuccess('Playback complete');
    }
  } catch (error) {
    synthSpinner.fail('Synthesis failed');
    throw error;
  }
}
