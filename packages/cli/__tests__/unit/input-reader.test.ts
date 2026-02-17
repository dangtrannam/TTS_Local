import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readInput } from '../../src/utils/input-reader.js';
import { TTSErrorCode } from '@tts-local/types';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('input-reader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('reading from text argument', () => {
    it('returns text argument as highest priority', async () => {
      const result = await readInput('Hello world');

      expect(result).toBe('Hello world');
    });

    it('trims whitespace from text argument', async () => {
      const result = await readInput('  Hello world  ');

      expect(result).toBe('Hello world');
    });

    it('prefers text argument over file path', async () => {
      const result = await readInput('Direct text', '/some/file.txt');

      expect(result).toBe('Direct text');
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('throws INPUT_TOO_LARGE for text exceeding 100K chars', async () => {
      const largeText = 'a'.repeat(100001);

      await expect(readInput(largeText)).rejects.toThrow();

      try {
        await readInput(largeText);
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INPUT_TOO_LARGE);
        expect(err.message).toContain('100000');
      }
    });

    it('accepts text exactly at 100K chars', async () => {
      const maxText = 'a'.repeat(100000);

      const result = await readInput(maxText);

      expect(result.length).toBe(100000);
    });
  });

  describe('reading from file', () => {
    it('reads file when no text argument provided', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('File contents');

      const result = await readInput(undefined, '/path/to/file.txt');

      expect(result).toBe('File contents');
      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('file.txt'), 'utf-8');
    });

    it('trims whitespace from file contents', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('  File contents  \n');

      const result = await readInput(undefined, '/path/to/file.txt');

      expect(result).toBe('File contents');
    });

    it('throws FILE_NOT_FOUND when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      await expect(readInput(undefined, '/nonexistent.txt')).rejects.toThrow();

      try {
        await readInput(undefined, '/nonexistent.txt');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.FILE_NOT_FOUND);
        expect(err.message).toContain('not found');
      }
    });

    it('throws FILE_READ_ERROR on read failure', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(readInput(undefined, '/path/to/file.txt')).rejects.toThrow();

      try {
        await readInput(undefined, '/path/to/file.txt');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.FILE_READ_ERROR);
      }
    });

    it('throws INVALID_INPUT for binary files', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('binary\0data');

      await expect(readInput(undefined, '/path/to/binary.exe')).rejects.toThrow();

      try {
        await readInput(undefined, '/path/to/binary.exe');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_INPUT);
        expect(err.message).toContain('binary');
      }
    });

    it('throws INPUT_TOO_LARGE for file exceeding 100K chars', async () => {
      const largeContent = 'a'.repeat(100001);
      vi.mocked(fs.readFile).mockResolvedValue(largeContent);

      await expect(readInput(undefined, '/path/to/large.txt')).rejects.toThrow();

      try {
        await readInput(undefined, '/path/to/large.txt');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INPUT_TOO_LARGE);
      }
    });
  });

  describe('reading from stdin', () => {
    beforeEach(() => {
      // Mock stdin to not be a TTY
      Object.defineProperty(process.stdin, 'isTTY', {
        value: false,
        writable: true,
        configurable: true,
      });
    });

    it('reads from stdin when no text or file provided', async () => {
      // Mock stdin events
      const mockStdin = {
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            handler(Buffer.from('Stdin data'));
          } else if (event === 'end') {
            handler();
          }
          return mockStdin;
        }),
        removeAllListeners: vi.fn(),
      };
      Object.assign(process.stdin, mockStdin);

      const result = await readInput();

      expect(result).toBe('Stdin data');
    });

    it('throws STDIN_TIMEOUT when no data received within 5s', async () => {
      const mockStdin = {
        on: vi.fn((event, handler) => {
          // Don't emit any events - simulate timeout
          return mockStdin;
        }),
        removeAllListeners: vi.fn(),
      };
      Object.assign(process.stdin, mockStdin);

      // Use fake timers for timeout test
      vi.useFakeTimers();
      const promise = readInput();
      vi.advanceTimersByTime(5000);

      await expect(promise).rejects.toThrow();
      try {
        await promise;
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.STDIN_TIMEOUT);
      }

      vi.useRealTimers();
    });

    it('throws NO_INPUT when stdin is empty', async () => {
      const mockStdin = {
        on: vi.fn((event, handler) => {
          if (event === 'end') {
            handler();
          }
          return mockStdin;
        }),
        removeAllListeners: vi.fn(),
      };
      Object.assign(process.stdin, mockStdin);

      await expect(readInput()).rejects.toThrow();

      try {
        await readInput();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.NO_INPUT);
      }
    });

    it('throws INPUT_TOO_LARGE for oversized stdin', async () => {
      const mockStdin = {
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            // Simulate very large data
            handler(Buffer.alloc(400001)); // > 100K * 4 bytes
          }
          return mockStdin;
        }),
        removeAllListeners: vi.fn(),
      };
      Object.assign(process.stdin, mockStdin);

      await expect(readInput()).rejects.toThrow();

      try {
        await readInput();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INPUT_TOO_LARGE);
      }
    });

    it('throws STDIN_READ_ERROR on stdin error', async () => {
      const mockStdin = {
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Read error'));
          }
          return mockStdin;
        }),
        removeAllListeners: vi.fn(),
      };
      Object.assign(process.stdin, mockStdin);

      await expect(readInput()).rejects.toThrow();

      try {
        await readInput();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.STDIN_READ_ERROR);
      }
    });
  });

  describe('no input provided', () => {
    beforeEach(() => {
      // Mock stdin as TTY (interactive terminal)
      Object.defineProperty(process.stdin, 'isTTY', {
        value: true,
        writable: true,
        configurable: true,
      });
    });

    it('throws NO_INPUT when no input source provided', async () => {
      await expect(readInput()).rejects.toThrow();

      try {
        await readInput();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.NO_INPUT);
        expect(err.message).toContain('tts speak');
      }
    });
  });
});
