import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PiperTTSService } from '../../src/services/piper-tts-service.js';
import { TTSErrorCode } from '@tts-local/types';

vi.mock('../../src/services/piper-binary-manager.js');
vi.mock('../../src/services/piper-voice-manager.js');
vi.mock('../../src/services/piper-process-runner.js');
vi.mock('node:fs/promises');

describe('piper-tts-service', () => {
  let service: PiperTTSService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new PiperTTSService();
  });

  describe('constructor', () => {
    it('initializes with default config', () => {
      const config = service.getConfig();

      expect(config.defaultVoice).toBe('en_US-amy-medium');
      expect(config.defaultSpeed).toBe(1.0);
      expect(config.synthesisTimeout).toBe(30000);
    });

    it('accepts custom config', () => {
      const customService = new PiperTTSService({
        defaultVoice: 'en_GB-alan-medium',
        defaultSpeed: 1.5,
        synthesisTimeout: 60000,
      });

      const config = customService.getConfig();

      expect(config.defaultVoice).toBe('en_GB-alan-medium');
      expect(config.defaultSpeed).toBe(1.5);
      expect(config.synthesisTimeout).toBe(60000);
    });
  });

  describe('isReady', () => {
    it('returns false initially', () => {
      expect(service.isReady()).toBe(false);
    });

    it('returns true after ensureReady succeeds', async () => {
      const mockBinaryManager = {
        ensureBinary: vi.fn().mockResolvedValue('/path/to/piper'),
      };
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/model.onnx'),
      };

      (service as any).binaryManager = mockBinaryManager;
      (service as any).voiceManager = mockVoiceManager;

      await service.ensureReady();

      expect(service.isReady()).toBe(true);
    });
  });

  describe('ensureReady', () => {
    it('ensures binary and default voice model', async () => {
      const mockBinaryManager = {
        ensureBinary: vi.fn().mockResolvedValue('/path/to/piper'),
      };
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/model.onnx'),
      };

      (service as any).binaryManager = mockBinaryManager;
      (service as any).voiceManager = mockVoiceManager;

      await service.ensureReady();

      expect(mockBinaryManager.ensureBinary).toHaveBeenCalled();
      expect(mockVoiceManager.ensureModel).toHaveBeenCalledWith(
        'en_US-amy-medium',
        expect.any(Function),
      );
    });

    it('calls progress callback with status updates', async () => {
      const mockBinaryManager = {
        ensureBinary: vi.fn().mockResolvedValue('/path/to/piper'),
      };
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/model.onnx'),
      };

      (service as any).binaryManager = mockBinaryManager;
      (service as any).voiceManager = mockVoiceManager;

      const progressCallback = vi.fn();
      await service.ensureReady(progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.some((call) => call[0].status === 'preparing')).toBe(true);
      expect(progressCallback.mock.calls.some((call) => call[0].status === 'complete')).toBe(true);
    });

    it('skips if already ready', async () => {
      const mockBinaryManager = {
        ensureBinary: vi.fn().mockResolvedValue('/path/to/piper'),
      };
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/model.onnx'),
      };

      (service as any).binaryManager = mockBinaryManager;
      (service as any).voiceManager = mockVoiceManager;

      await service.ensureReady();
      await service.ensureReady();

      expect(mockBinaryManager.ensureBinary).toHaveBeenCalledTimes(1);
    });
  });

  describe('synthesize', () => {
    beforeEach(() => {
      const mockBinaryManager = {
        ensureBinary: vi.fn().mockResolvedValue('/path/to/piper'),
      };
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/model.onnx'),
      };
      const mockProcessRunner = {
        run: vi.fn().mockResolvedValue(Buffer.from('fake-pcm-data')),
      };

      (service as any).binaryManager = mockBinaryManager;
      (service as any).voiceManager = mockVoiceManager;
      (service as any).processRunner = mockProcessRunner;
    });

    it('validates and synthesizes text', async () => {
      const result = await service.synthesize('Hello world');

      expect(result.audio).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.sampleRate).toBe(22050);
    });

    it('throws EMPTY_TEXT on empty string', async () => {
      await expect(service.synthesize('')).rejects.toThrow();

      try {
        await service.synthesize('');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.EMPTY_TEXT);
      }
    });

    it('throws EMPTY_TEXT on whitespace-only string', async () => {
      await expect(service.synthesize('   ')).rejects.toThrow();

      try {
        await service.synthesize('   ');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.EMPTY_TEXT);
      }
    });

    it('throws TEXT_TOO_LONG on text exceeding max length', async () => {
      const longText = 'a'.repeat(100001);

      await expect(service.synthesize(longText)).rejects.toThrow();

      try {
        await service.synthesize(longText);
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.TEXT_TOO_LONG);
        expect(err.message).toContain('100000');
      }
    });

    it('calls ensureReady if not ready', async () => {
      const ensureReadySpy = vi.spyOn(service, 'ensureReady');

      await service.synthesize('Test');

      expect(ensureReadySpy).toHaveBeenCalled();
    });

    it('uses custom voice from options', async () => {
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/custom-model.onnx'),
      };
      (service as any).voiceManager = mockVoiceManager;

      await service.synthesize('Test', { voice: 'en_GB-alan-medium' });

      expect(mockVoiceManager.ensureModel).toHaveBeenCalledWith('en_GB-alan-medium');
    });

    it('uses custom speed from options', async () => {
      const mockProcessRunner = {
        run: vi.fn().mockResolvedValue(Buffer.from('fake-pcm-data')),
      };
      (service as any).processRunner = mockProcessRunner;

      await service.synthesize('Test', { speed: 1.5 });

      expect(mockProcessRunner.run).toHaveBeenCalledWith(expect.objectContaining({ speed: 1.5 }));
    });

    it('uses custom timeout from options', async () => {
      const mockProcessRunner = {
        run: vi.fn().mockResolvedValue(Buffer.from('fake-pcm-data')),
      };
      (service as any).processRunner = mockProcessRunner;

      await service.synthesize('Test', { timeout: 60000 });

      expect(mockProcessRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: 60000 }),
      );
    });

    it('wraps raw PCM in WAV header', async () => {
      const result = await service.synthesize('Test');

      // Check WAV header signature
      expect(result.audio.toString('ascii', 0, 4)).toBe('RIFF');
      expect(result.audio.toString('ascii', 8, 12)).toBe('WAVE');
    });
  });

  describe('synthesizeToFile', () => {
    beforeEach(() => {
      const mockBinaryManager = {
        ensureBinary: vi.fn().mockResolvedValue('/path/to/piper'),
      };
      const mockVoiceManager = {
        ensureModel: vi.fn().mockResolvedValue('/path/to/model.onnx'),
      };
      const mockProcessRunner = {
        run: vi.fn().mockResolvedValue(Buffer.from('fake-pcm-data')),
      };

      (service as any).binaryManager = mockBinaryManager;
      (service as any).voiceManager = mockVoiceManager;
      (service as any).processRunner = mockProcessRunner;
    });

    it('synthesizes and saves to file', async () => {
      const { default: fs } = await import('node:fs/promises');
      const mockWriteFile = vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await service.synthesizeToFile('Hello', '/tmp/output.wav');

      expect(mockWriteFile).toHaveBeenCalledWith('/tmp/output.wav', expect.any(Buffer));
    });
  });

  describe('setConfig', () => {
    it('updates defaultVoice', () => {
      service.setConfig('defaultVoice', 'en_GB-alan-medium');

      expect(service.getConfig().defaultVoice).toBe('en_GB-alan-medium');
    });

    it('updates defaultSpeed', () => {
      service.setConfig('defaultSpeed', 1.5);

      expect(service.getConfig().defaultSpeed).toBe(1.5);
    });

    it('updates synthesisTimeout', () => {
      service.setConfig('synthesisTimeout', 60000);

      expect(service.getConfig().synthesisTimeout).toBe(60000);
    });
  });

  describe('getConfig', () => {
    it('returns copy of config', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});
