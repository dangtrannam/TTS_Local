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

    const args = ['--model', modelPath, '--output-raw', '--length-scale', String(1.0 / speed)];

    try {
      const { execa } = await import('execa');
      const result = await execa(binaryPath, args, {
        input: text,
        timeout,
        encoding: 'buffer',
        reject: true,
        stripFinalNewline: false,
      });

      const audioBuffer = Buffer.from(result.stdout);

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new TTSError(TTSErrorCode.SYNTHESIS_FAILED, 'No audio output from Piper process');
      }

      return audioBuffer;
    } catch (err) {
      if (err instanceof TTSError) throw err;

      const error = err as NodeJS.ErrnoException & { timedOut?: boolean; stderr?: string };

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

      throw new TTSError(
        TTSErrorCode.SYNTHESIS_FAILED,
        `Piper synthesis failed: ${error.stderr || error.message || String(err)}`,
        error,
      );
    }
  }
}
