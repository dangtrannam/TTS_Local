/**
 * Input reader utility for CLI
 * Handles reading text from various sources: direct argument, file, or stdin
 */
import { readFile } from 'node:fs/promises';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { resolve } from 'node:path';

const MAX_INPUT_SIZE = 100_000; // 100K characters
const LARGE_INPUT_WARNING = 50_000; // Warn at 50K characters
const STDIN_TIMEOUT_MS = 5000; // 5 second timeout for stdin

/**
 * Read input text from argument, file, or stdin
 * Priority: argument > file > stdin
 *
 * @param textArg Direct text argument (highest priority)
 * @param filePath Path to file to read
 * @returns Input text
 * @throws TTSError if no input provided, input too large, or read fails
 */
export async function readInput(textArg?: string, filePath?: string): Promise<string> {
  // Priority 1: Direct text argument
  if (textArg) {
    validateInputSize(textArg, 'argument');
    return textArg.trim();
  }

  // Priority 2: File input
  if (filePath) {
    return await readFromFile(filePath);
  }

  // Priority 3: Stdin (if not a TTY)
  if (!process.stdin.isTTY) {
    return await readFromStdin();
  }

  // No input provided
  throw new TTSError(
    TTSErrorCode.NO_INPUT,
    'No input text provided. Use: tts speak "text", --file <path>, or pipe stdin',
  );
}

/**
 * Read text from a file with validation
 * @param filePath Path to file
 * @returns File contents as string
 * @throws TTSError if file doesn't exist, is binary, or too large
 */
async function readFromFile(filePath: string): Promise<string> {
  try {
    const absolutePath = resolve(filePath);
    const content = await readFile(absolutePath, 'utf-8');

    // Check if file appears to be binary
    if (content.includes('\0')) {
      throw new TTSError(TTSErrorCode.INVALID_INPUT, `File appears to be binary: ${filePath}`);
    }

    validateInputSize(content, 'file');
    return content.trim();
  } catch (error) {
    if (error instanceof TTSError) {
      throw error;
    }

    // Handle file read errors
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new TTSError(TTSErrorCode.FILE_NOT_FOUND, `File not found: ${filePath}`);
    }

    throw new TTSError(
      TTSErrorCode.FILE_READ_ERROR,
      `Failed to read file: ${(error as Error).message}`,
    );
  }
}

/**
 * Read text from stdin with timeout
 * @returns Stdin contents as string
 * @throws TTSError if stdin is empty or read fails
 */
async function readFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new TTSError(TTSErrorCode.STDIN_TIMEOUT, 'No data received from stdin after 5 seconds'),
      );
    }, STDIN_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeoutId);
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('end');
      process.stdin.removeAllListeners('error');
    };

    process.stdin.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      totalSize += chunk.length;

      // Check size limit
      if (totalSize > MAX_INPUT_SIZE * 4) {
        // Bytes (UTF-8 can be up to 4 bytes per char)
        cleanup();
        reject(
          new TTSError(
            TTSErrorCode.INPUT_TOO_LARGE,
            `Stdin input exceeds maximum size of ${MAX_INPUT_SIZE} characters`,
          ),
        );
      }
    });

    process.stdin.on('end', () => {
      cleanup();

      if (chunks.length === 0) {
        reject(new TTSError(TTSErrorCode.NO_INPUT, 'No data received from stdin'));
        return;
      }

      const content = Buffer.concat(chunks).toString('utf-8');
      validateInputSize(content, 'stdin');
      resolve(content.trim());
    });

    process.stdin.on('error', (error) => {
      cleanup();
      reject(new TTSError(TTSErrorCode.STDIN_READ_ERROR, `Failed to read stdin: ${error.message}`));
    });
  });
}

/**
 * Validate input size and warn if large
 * @param text Input text to validate
 * @param source Source of input (for error messages)
 * @throws TTSError if input exceeds maximum size
 */
function validateInputSize(text: string, source: string): void {
  const length = text.length;

  if (length === 0) {
    throw new TTSError(TTSErrorCode.NO_INPUT, `Empty ${source} provided`);
  }

  if (length > MAX_INPUT_SIZE) {
    throw new TTSError(
      TTSErrorCode.INPUT_TOO_LARGE,
      `Input from ${source} is too large (${length} chars). Maximum is ${MAX_INPUT_SIZE} characters.`,
    );
  }

  // Warn if input is large but still within limits
  if (length > LARGE_INPUT_WARNING) {
    console.warn(`⚠ Large input detected (${length} chars). Processing may take some time.`);
  }
}
