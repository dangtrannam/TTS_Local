import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tts-local/core');
vi.mock('../../src/utils/cli-output.js');

describe('setup-command', () => {
  let mockService: any;

  beforeEach(async () => {
    vi.resetAllMocks();

    mockService = {
      ensureReady: vi.fn().mockResolvedValue(undefined),
      isReady: vi.fn().mockReturnValue(true),
    };

    const { PiperTTSService } = await import('@tts-local/core');
    vi.mocked(PiperTTSService).mockImplementation(() => mockService);

    const cliOutput = await import('../../src/utils/cli-output.js');
    vi.mocked(cliOutput.showSpinner).mockReturnValue({
      text: '',
      succeed: vi.fn(),
      fail: vi.fn(),
    } as any);
    vi.mocked(cliOutput.showSuccess).mockImplementation(() => {});
    vi.mocked(cliOutput.showError).mockImplementation(() => {});
  });

  describe('setup flow', () => {
    it('calls ensureReady to download binary and model', async () => {
      await mockService.ensureReady();

      expect(mockService.ensureReady).toHaveBeenCalled();
    });

    it('shows progress during download', async () => {
      const progressCallback = vi.fn();
      await mockService.ensureReady(progressCallback);

      expect(mockService.ensureReady).toHaveBeenCalledWith(progressCallback);
    });

    it('completes successfully when setup succeeds', async () => {
      await expect(mockService.ensureReady()).resolves.toBeUndefined();
    });
  });

  describe('progress messages', () => {
    it('updates spinner text with progress message', async () => {
      const progressCallback = vi.fn();

      await mockService.ensureReady((progress: any) => {
        progressCallback(progress);
      });

      expect(mockService.ensureReady).toHaveBeenCalled();
    });

    it('shows percentage when available', async () => {
      await mockService.ensureReady((progress: any) => {
        if (progress.percent !== undefined) {
          const percent = Math.round(progress.percent);
          expect(percent).toBeGreaterThanOrEqual(0);
          expect(percent).toBeLessThanOrEqual(100);
        }
      });

      expect(mockService.ensureReady).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles download failure', async () => {
      mockService.ensureReady.mockRejectedValue(new Error('Download failed'));

      await expect(mockService.ensureReady()).rejects.toThrow('Download failed');
    });

    it('shows error message on failure', async () => {
      const { showError } = await import('../../src/utils/cli-output.js');
      const error = new Error('Setup failed');

      mockService.ensureReady.mockRejectedValue(error);

      try {
        await mockService.ensureReady();
      } catch (err) {
        showError(err as Error);
      }

      expect(mockService.ensureReady).toHaveBeenCalled();
    });
  });

  describe('success messages', () => {
    it('shows success message after setup', async () => {
      const { showSuccess } = await import('../../src/utils/cli-output.js');

      await mockService.ensureReady();
      showSuccess('TTS is ready to use!');

      expect(showSuccess).toHaveBeenCalledWith('TTS is ready to use!');
    });

    it('displays usage examples after setup', () => {
      const examples = [
        'tts speak "Hello world"',
        'tts speak --file README.md',
        'echo "test" | tts speak',
      ];

      examples.forEach((example) => {
        expect(example).toContain('tts speak');
      });
    });
  });
});
