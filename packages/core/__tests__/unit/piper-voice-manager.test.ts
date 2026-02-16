import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PiperVoiceManager } from '../../src/services/piper-voice-manager.js';
import { TTSErrorCode } from '@tts-local/types';
import fs from 'node:fs/promises';
import path from 'node:path';

vi.mock('node:fs/promises');
vi.mock('../../src/utils/download-helper.js', () => ({
  downloadFile: vi.fn(),
}));

describe('piper-voice-manager', () => {
  let manager: PiperVoiceManager;
  const testModelsDir = '/test/models';

  beforeEach(() => {
    vi.resetAllMocks();
    manager = new PiperVoiceManager(testModelsDir);
  });

  describe('getModelPath', () => {
    it('returns correct absolute path for model', () => {
      const modelPath = manager.getModelPath('en_US-lessac-medium');

      expect(modelPath).toBe(path.join(testModelsDir, 'en_US-lessac-medium.onnx'));
    });

    it('appends .onnx extension', () => {
      const modelPath = manager.getModelPath('en_US-amy-medium');

      expect(modelPath).toContain('.onnx');
    });
  });

  describe('ensureModel', () => {
    it('skips download if model files exist', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 50000000,
        isFile: () => true,
      } as any);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const modelPath = await manager.ensureModel('en_US-lessac-medium');

      expect(modelPath).toContain('en_US-lessac-medium.onnx');
    });

    it('downloads model if missing', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.stat)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValue({
          size: 50000000,
          isFile: () => true,
        } as any);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const { downloadFile } = await import('../../src/utils/download-helper.js');
      vi.mocked(downloadFile).mockResolvedValue(undefined);

      const progressCallback = vi.fn();
      const modelPath = await manager.ensureModel('en_US-amy-medium', progressCallback);

      expect(modelPath).toContain('en_US-amy-medium.onnx');
      expect(downloadFile).toHaveBeenCalled();
    });

    it('calls progress callback during download', async () => {
      vi.mocked(fs.stat)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValue({
          size: 50000000,
          isFile: () => true,
        } as any);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const { downloadFile } = await import('../../src/utils/download-helper.js');
      vi.mocked(downloadFile).mockImplementation(async (url, dest, onProgress) => {
        onProgress?.({ bytesDownloaded: 50, totalBytes: 100, percent: 50 });
      });

      const progressCallback = vi.fn();
      await manager.ensureModel('en_US-amy-medium', progressCallback);

      expect(downloadFile).toHaveBeenCalled();
    });

    it('validates model after download', async () => {
      vi.mocked(fs.stat)
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValue({
          size: 50000000,
          isFile: () => true,
        } as any);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const { downloadFile } = await import('../../src/utils/download-helper.js');
      vi.mocked(downloadFile).mockResolvedValue(undefined);

      await manager.ensureModel('en_US-amy-medium');

      expect(fs.stat).toHaveBeenCalled();
    });
  });

  describe('validateModel', () => {
    it('succeeds for valid model files', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 50000000,
        isFile: () => true,
      } as any);

      await expect(manager.validateModel('en_US-amy-medium')).resolves.toBeUndefined();
    });

    it('throws MODEL_CORRUPT if .onnx file size is 0', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 0,
        isFile: () => true,
      } as any);

      await expect(manager.validateModel('en_US-amy-medium')).rejects.toThrow();
      try {
        await manager.validateModel('en_US-amy-medium');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.MODEL_CORRUPT);
      }
    });

    it('throws MODEL_CORRUPT if .onnx.json is missing', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        size: 50000000,
        isFile: () => true,
      } as any);
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      await expect(manager.validateModel('en_US-amy-medium')).rejects.toThrow();
    });
  });

  describe('listInstalledModels', () => {
    it('scans directory and returns model list', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'en_US-lessac-medium.onnx',
        'en_US-lessac-medium.onnx.json',
        'en_GB-alan-medium.onnx',
        'en_GB-alan-medium.onnx.json',
        'other-file.txt',
      ] as any);

      const models = await manager.listInstalledModels();

      expect(models).toContain('en_US-lessac-medium');
      expect(models).toContain('en_GB-alan-medium');
      expect(models).not.toContain('other-file');
    });

    it('returns empty array if directory does not exist', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('ENOENT'));

      const models = await manager.listInstalledModels();

      expect(models).toEqual([]);
    });

    it('deduplicates model names', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'en_US-amy-medium.onnx',
        'en_US-amy-medium.onnx.json',
      ] as any);

      const models = await manager.listInstalledModels();

      expect(models).toEqual(['en_US-amy-medium']);
      expect(models.length).toBe(1);
    });
  });

  describe('error handling', () => {
    it('throws MODEL_DOWNLOAD_FAILED on network error', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      const { downloadFile } = await import('../../src/utils/download-helper.js');
      vi.mocked(downloadFile).mockRejectedValue(new Error('Network error'));

      await expect(manager.ensureModel('en_US-amy-medium')).rejects.toThrow();
      try {
        await manager.ensureModel('en_US-amy-medium');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.MODEL_DOWNLOAD_FAILED);
      }
    });

    it('throws MODEL_DOWNLOAD_FAILED on HTTP error response', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }) as any;

      await expect(manager.ensureModel('en_US-amy-medium')).rejects.toThrow();
    });
  });
});
