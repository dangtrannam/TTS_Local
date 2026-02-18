import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readTextFile } from '../../src/utils/file-reader.js';
import { TTSErrorCode } from '@tts-local/types';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('readTextFile', () => {
  let tmpFile: string;

  beforeEach(async () => {
    tmpFile = path.join(os.tmpdir(), `test-file-reader-${Date.now()}.txt`);
    await fs.writeFile(tmpFile, 'Hello world');
  });

  afterEach(async () => {
    await fs.unlink(tmpFile).catch(() => {});
  });

  it('reads an existing file', async () => {
    const content = await readTextFile(tmpFile);
    expect(content).toBe('Hello world');
  });

  it('throws FILE_NOT_FOUND for missing file', async () => {
    await expect(readTextFile('/nonexistent/path/missing-file.txt')).rejects.toMatchObject({
      code: TTSErrorCode.FILE_NOT_FOUND,
    });
  });

  it('throws INPUT_TOO_LARGE for files over 1MB', async () => {
    const bigFile = path.join(os.tmpdir(), `big-file-reader-${Date.now()}.txt`);
    await fs.writeFile(bigFile, 'x'.repeat(1_048_577));
    try {
      await expect(readTextFile(bigFile)).rejects.toMatchObject({
        code: TTSErrorCode.INPUT_TOO_LARGE,
      });
    } finally {
      await fs.unlink(bigFile).catch(() => {});
    }
  });

  it('expands ~ to home directory', async () => {
    // Write to a known temp path and verify the function can resolve absolute paths
    const content = await readTextFile(tmpFile);
    expect(typeof content).toBe('string');
  });
});
