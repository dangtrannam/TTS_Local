import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TTSError, TTSErrorCode } from '@tts-local/types';

const MAX_FILE_SIZE = 1_048_576; // 1MB

/** Read a text file and return its content as a string.
 * Throws TTSError on access, size, or read failures. */
export async function readTextFile(filePath: string): Promise<string> {
  // Expand ~/ to home directory (only ~/path, not ~username)
  const expanded =
    filePath === '~'
      ? os.homedir()
      : /^~\//.test(filePath)
        ? filePath.replace(/^~/, os.homedir())
        : filePath;
  const resolved = path.resolve(expanded);

  try {
    await fs.access(resolved, fs.constants.R_OK);
  } catch {
    throw new TTSError(TTSErrorCode.FILE_NOT_FOUND, `File not found or not readable: ${resolved}`);
  }

  const stat = await fs.stat(resolved);
  if (stat.size > MAX_FILE_SIZE) {
    throw new TTSError(
      TTSErrorCode.INPUT_TOO_LARGE,
      `File too large: ${resolved} (${stat.size} bytes, max 1MB)`,
    );
  }

  try {
    return await fs.readFile(resolved, 'utf-8');
  } catch (cause) {
    throw new TTSError(
      TTSErrorCode.FILE_READ_ERROR,
      `Failed to read file: ${resolved}`,
      cause instanceof Error ? cause : undefined,
    );
  }
}
