import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PiperProcessRunner } from '../../src/services/piper-process-runner.js';
import { TTSErrorCode } from '@tts-local/types';

vi.mock('execa');

describe('piper-process-runner', () => {
  let runner: PiperProcessRunner;

  beforeEach(() => {
    vi.resetAllMocks();
    runner = new PiperProcessRunner();
  });

  describe('successful synthesis', () => {
    it('returns WAV buffer on successful execution', async () => {
      const mockAudioData = Buffer.from('fake-audio-data');
      const mockExeca = vi.fn().mockResolvedValue({
        stdout: mockAudioData,
        stderr: '',
        exitCode: 0,
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      const result = await runner.run({
        binaryPath: '/path/to/piper',
        modelPath: '/path/to/model.onnx',
        text: 'Hello world',
        speed: 1.0,
        timeout: 30000,
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(mockExeca).toHaveBeenCalledWith(
        '/path/to/piper',
        expect.arrayContaining(['-m', '/path/to/model.onnx', '--output-raw']),
        expect.objectContaining({
          input: 'Hello world',
          timeout: 30000,
        }),
      );
    });

    it('passes speed parameter correctly as length-scale', async () => {
      const mockExeca = vi.fn().mockResolvedValue({
        stdout: Buffer.from('audio'),
        stderr: '',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await runner.run({
        binaryPath: '/path/to/piper',
        modelPath: '/path/to/model.onnx',
        text: 'Test',
        speed: 1.5,
        timeout: 30000,
      });

      expect(mockExeca).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['--length-scale', String(1.0 / 1.5)]),
        expect.any(Object),
      );
    });

    it('uses array args to prevent shell injection', async () => {
      const mockExeca = vi.fn().mockResolvedValue({
        stdout: Buffer.from('audio'),
        stderr: '',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await runner.run({
        binaryPath: '/path/to/piper',
        modelPath: '/path/to/model.onnx',
        text: 'Test; rm -rf /',
        speed: 1.0,
        timeout: 30000,
      });

      const callArgs = mockExeca.mock.calls[0];
      expect(Array.isArray(callArgs[1])).toBe(true);
      expect(callArgs[2]).toHaveProperty('input');
      expect(callArgs[2].input).toBe('Test; rm -rf /');
    });
  });

  describe('error handling', () => {
    it('throws BINARY_NOT_FOUND on ENOENT error', async () => {
      const mockExeca = vi.fn().mockRejectedValue({
        code: 'ENOENT',
        message: 'spawn ENOENT',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await expect(
        runner.run({
          binaryPath: '/nonexistent/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        }),
      ).rejects.toThrow();

      try {
        await runner.run({
          binaryPath: '/nonexistent/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        });
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.BINARY_NOT_FOUND);
        expect(err.message).toContain('not found');
      }
    });

    it('throws BINARY_PERMISSION_DENIED on EACCES error', async () => {
      const mockExeca = vi.fn().mockRejectedValue({
        code: 'EACCES',
        message: 'Permission denied',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await expect(
        runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        }),
      ).rejects.toThrow();

      try {
        await runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        });
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.BINARY_PERMISSION_DENIED);
      }
    });

    it('throws SYNTHESIS_TIMEOUT on timeout', async () => {
      const mockExeca = vi.fn().mockRejectedValue({
        timedOut: true,
        message: 'Command timed out',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await expect(
        runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
          timeout: 5000,
        }),
      ).rejects.toThrow();

      try {
        await runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
          timeout: 5000,
        });
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.SYNTHESIS_TIMEOUT);
        expect(err.message).toContain('5000');
      }
    });

    it('throws SYNTHESIS_FAILED on non-zero exit code', async () => {
      const mockExeca = vi.fn().mockRejectedValue({
        exitCode: 1,
        stderr: 'Model error: invalid format',
        message: 'Command failed',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await expect(
        runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        }),
      ).rejects.toThrow();

      try {
        await runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        });
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.SYNTHESIS_FAILED);
        expect(err.message).toContain('invalid format');
      }
    });

    it('throws SYNTHESIS_FAILED when stdout is empty', async () => {
      const mockExeca = vi.fn().mockResolvedValue({
        stdout: Buffer.from(''),
        stderr: '',
        exitCode: 0,
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await expect(
        runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        }),
      ).rejects.toThrow();

      try {
        await runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        });
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.SYNTHESIS_FAILED);
        expect(err.message).toContain('No audio output');
      }
    });

    it('detects missing espeak-ng library on macOS', async () => {
      const mockExeca = vi.fn().mockRejectedValue({
        stderr: 'dyld: Library not loaded: libespeak-ng.dylib',
        message: 'Command failed',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await expect(
        runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        }),
      ).rejects.toThrow();

      try {
        await runner.run({
          binaryPath: '/path/to/piper',
          modelPath: '/path/to/model.onnx',
          text: 'Test',
        });
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.BINARY_PERMISSION_DENIED);
        expect(err.message).toContain('espeak-ng');
        expect(err.message).toContain('brew install');
      }
    });
  });

  describe('default parameters', () => {
    it('uses default speed of 1.0 if not specified', async () => {
      const mockExeca = vi.fn().mockResolvedValue({
        stdout: Buffer.from('audio'),
        stderr: '',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await runner.run({
        binaryPath: '/path/to/piper',
        modelPath: '/path/to/model.onnx',
        text: 'Test',
      });

      expect(mockExeca).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['--length-scale', '1']),
        expect.any(Object),
      );
    });

    it('uses default timeout of 30000ms if not specified', async () => {
      const mockExeca = vi.fn().mockResolvedValue({
        stdout: Buffer.from('audio'),
        stderr: '',
      });
      vi.mocked(await import('execa')).execa = mockExeca;

      await runner.run({
        binaryPath: '/path/to/piper',
        modelPath: '/path/to/model.onnx',
        text: 'Test',
      });

      expect(mockExeca).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({ timeout: 30000 }),
      );
    });
  });
});
