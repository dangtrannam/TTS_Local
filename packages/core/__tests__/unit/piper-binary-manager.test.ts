import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PiperBinaryManager } from '../../src/services/piper-binary-manager.js';
import { TTSErrorCode } from '@tts-local/types';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises');

const mockExeca = vi.fn();
vi.mock('execa', () => ({
  execa: mockExeca,
  default: { execa: mockExeca },
}));

describe('piper-binary-manager', () => {
  let manager: PiperBinaryManager;

  beforeEach(() => {
    vi.resetAllMocks();
    mockExeca.mockReset();
    manager = new PiperBinaryManager();
  });

  describe('getBinaryPath', () => {
    it('returns path to pip-installed piper binary', () => {
      const path = manager.getBinaryPath();
      expect(path).toContain('piper');
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    });

    it('returns macOS Python user bin path on macOS', () => {
      const path = manager.getBinaryPath();
      // Should default to macOS Python 3.12 path
      expect(path).toMatch(/Library[/\\]Python/);
    });
  });

  describe('ensureBinary', () => {
    it('skips installation if binary exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const path = await manager.ensureBinary();

      expect(path).toContain('piper');
      expect(fs.access).toHaveBeenCalled();
    });

    it('installs via pip if binary missing', async () => {
      // First check fails (binary missing), then installation succeeds
      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('ENOENT')) // binaryExists check
        .mockResolvedValue(undefined); // verifyBinary access check
      mockExeca.mockResolvedValue({ stdout: '', stderr: '' } as any);

      const progressCallback = vi.fn();
      const binaryPath = await manager.ensureBinary(progressCallback);

      expect(binaryPath).toBeTruthy();
      expect(mockExeca).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalled();
    });

    it('calls progress callback during installation', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValue(undefined);
      mockExeca.mockResolvedValue({ stdout: '', stderr: '' } as any);

      const progressCallback = vi.fn();
      await manager.ensureBinary(progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls[0][0]).toHaveProperty('percent');
    });

    it('verifies binary after installation', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValue(undefined);
      mockExeca.mockResolvedValue({ stdout: '', stderr: '' } as any);

      await manager.ensureBinary();

      expect(mockExeca).toHaveBeenCalledTimes(2); // Once for install, once for verify
    });
  });

  describe('verifyBinary', () => {
    it('succeeds when binary executes correctly', async () => {
      mockExeca.mockResolvedValue({ stdout: '', stderr: '' });

      await manager.verifyBinary('/path/to/piper');

      expect(mockExeca).toHaveBeenCalledWith(
        '/path/to/piper',
        expect.arrayContaining(['-m']),
        expect.any(Object),
      );
    });

    it('throws BINARY_CORRUPT on verification failure', async () => {
      mockExeca.mockRejectedValue(new Error('Binary corrupt'));

      await expect(manager.verifyBinary('/path/to/piper')).rejects.toThrow();
      try {
        await manager.verifyBinary('/path/to/piper');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.BINARY_CORRUPT);
      }
    });

    it('accepts "model required" error as success', async () => {
      mockExeca.mockRejectedValue(new Error('model: error: argument -m is required'));

      await expect(manager.verifyBinary('/path/to/piper')).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('throws BINARY_DOWNLOAD_FAILED on pip install failure', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockRejectedValue({
        stderr: 'pip install failed',
        message: 'Command failed',
      });

      await expect(manager.ensureBinary()).rejects.toThrow();
      try {
        await manager.ensureBinary();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.BINARY_DOWNLOAD_FAILED);
        expect(err.message).toContain('pip');
      }
    });
  });
});
