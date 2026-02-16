import { TTSError, TTSErrorCode } from '@tts-local/types';

export interface ProcessRunnerOptions {
  binaryPath: string;
  modelPath: string;
  text: string;
  speed?: number;
  timeout?: number;
}

/**
 * Isolated module for spawning Piper process.
 * Uses execa with array args (no shell injection possible).
 */
export class PiperProcessRunner {
  /** Run Piper synthesis, returning WAV buffer from stdout */
  async run(options: ProcessRunnerOptions): Promise<Buffer> {
    const { binaryPath, modelPath, text, speed = 1.0, timeout = 30_000 } = options;

    // Piper Python package uses -m for model, --output-raw for stdout, --length-scale for speed
    const args = ['-m', modelPath, '--output-raw', '--length-scale', String(1.0 / speed)];

    try {
      const { execa } = await import('execa');

      const result = await execa(binaryPath, args, {
        input: text,
        timeout,
        encoding: 'buffer',
        reject: true,
        stripFinalNewline: false,
        all: true, // Capture combined stdout+stderr for better error messages
      });

      const audioBuffer = Buffer.from(result.stdout);

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new TTSError(TTSErrorCode.SYNTHESIS_FAILED, 'No audio output from Piper process');
      }

      return audioBuffer;
    } catch (err) {
      if (err instanceof TTSError) throw err;

      const error = err as NodeJS.ErrnoException & {
        timedOut?: boolean;
        stderr?: string | Buffer;
        all?: string | Buffer;
      };

      if (error.code === 'ENOENT') {
        throw new TTSError(
          TTSErrorCode.BINARY_NOT_FOUND,
          `Piper binary not found: ${binaryPath}`,
          error,
        );
      }
      if (error.code === 'EACCES') {
        throw new TTSError(
          TTSErrorCode.BINARY_PERMISSION_DENIED,
          `Permission denied: ${binaryPath}`,
          error,
        );
      }
      if (error.timedOut) {
        throw new TTSError(
          TTSErrorCode.SYNTHESIS_TIMEOUT,
          `Synthesis timed out after ${timeout}ms`,
          error,
        );
      }

      // Check for macOS library dependency errors
      const stderrText = error.stderr ? String(error.stderr) : '';
      const messageText = error.message || String(err);
      const allText = error.all ? String(error.all) : '';
      const errorMsg = stderrText || allText || messageText;

      if (errorMsg.includes('libespeak-ng') || errorMsg.includes('Library not loaded')) {
        throw new TTSError(
          TTSErrorCode.BINARY_PERMISSION_DENIED,
          `Piper requires espeak-ng library. Install via: brew install espeak-ng`,
          error,
        );
      }

      throw new TTSError(
        TTSErrorCode.SYNTHESIS_FAILED,
        `Piper synthesis failed: ${errorMsg}`,
        error,
      );
    }
  }
}
