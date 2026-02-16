import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getConfig,
  setConfig,
  resetConfig,
  getDefaultConfig,
  validateConfig,
} from '../../src/utils/config-manager.js';
import { TTSErrorCode } from '@tts-local/types';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises');
vi.mock('@tts-local/core', () => ({
  getAppPaths: () => ({
    config: '/mock/config',
    appData: '/mock/appData',
    bin: '/mock/bin',
    models: '/mock/models',
    cache: '/mock/cache',
  }),
}));

describe('config-manager', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getConfig', () => {
    it('returns default config when file does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const config = await getConfig();

      expect(config.defaultVoice).toBe('en_US-amy-medium');
      expect(config.speed).toBe(1.0);
    });

    it('reads config from file when it exists', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          defaultVoice: 'en_GB-alan-medium',
          speed: 1.5,
        }),
      );

      const config = await getConfig();

      expect(config.defaultVoice).toBe('en_GB-alan-medium');
      expect(config.speed).toBe(1.5);
    });

    it('merges with defaults for missing keys', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          speed: 1.2,
          // defaultVoice missing
        }),
      );

      const config = await getConfig();

      expect(config.defaultVoice).toBe('en_US-amy-medium'); // Default
      expect(config.speed).toBe(1.2); // From file
    });

    it('returns defaults on JSON parse error', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json {');

      const config = await getConfig();

      expect(config.defaultVoice).toBe('en_US-amy-medium');
      expect(config.speed).toBe(1.0);
    });

    it('throws CONFIG_READ_ERROR on other read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(getConfig()).rejects.toThrow();

      try {
        await getConfig();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.CONFIG_READ_ERROR);
      }
    });
  });

  describe('setConfig', () => {
    beforeEach(() => {
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          defaultVoice: 'en_US-amy-medium',
          speed: 1.0,
        }),
      );
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it('updates defaultVoice', async () => {
      await setConfig('defaultVoice', 'en_GB-alan-medium');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('en_GB-alan-medium'),
        expect.any(Object),
      );
    });

    it('updates speed with number value', async () => {
      await setConfig('speed', '1.5');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('1.5'),
        expect.any(Object),
      );
    });

    it('throws INVALID_CONFIG_KEY for unknown key', async () => {
      await expect(setConfig('unknownKey', 'value')).rejects.toThrow();

      try {
        await setConfig('unknownKey', 'value');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG_KEY);
        expect(err.message).toContain('defaultVoice, speed');
      }
    });

    it('throws INVALID_CONFIG_VALUE for invalid speed (non-number)', async () => {
      await expect(setConfig('speed', 'not-a-number')).rejects.toThrow();

      try {
        await setConfig('speed', 'not-a-number');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG_VALUE);
        expect(err.message).toContain('number');
      }
    });

    it('throws INVALID_CONFIG_VALUE for speed out of range (< 0.5)', async () => {
      await expect(setConfig('speed', '0.3')).rejects.toThrow();

      try {
        await setConfig('speed', '0.3');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG_VALUE);
        expect(err.message).toContain('0.5 and 2.0');
      }
    });

    it('throws INVALID_CONFIG_VALUE for speed out of range (> 2.0)', async () => {
      await expect(setConfig('speed', '2.5')).rejects.toThrow();

      try {
        await setConfig('speed', '2.5');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG_VALUE);
      }
    });

    it('accepts speed at boundary values (0.5 and 2.0)', async () => {
      await setConfig('speed', '0.5');
      await setConfig('speed', '2.0');

      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('creates config directory if it does not exist', async () => {
      await setConfig('speed', '1.5');

      expect(fs.mkdir).toHaveBeenCalledWith('/mock/config', { recursive: true });
    });

    it('writes config with proper file permissions (0o600)', async () => {
      await setConfig('speed', '1.5');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ mode: 0o600 }),
      );
    });

    it('writes valid JSON with pretty formatting', async () => {
      await setConfig('speed', '1.5');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(() => JSON.parse(content)).not.toThrow();
      expect(content).toContain('\n'); // Pretty formatted
    });

    it('throws CONFIG_WRITE_ERROR on write failure', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(setConfig('speed', '1.5')).rejects.toThrow();

      try {
        await setConfig('speed', '1.5');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.CONFIG_WRITE_ERROR);
      }
    });
  });

  describe('resetConfig', () => {
    it('deletes config file', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await resetConfig();

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('settings.json'));
    });

    it('succeeds silently if file does not exist', async () => {
      vi.mocked(fs.unlink).mockRejectedValue({ code: 'ENOENT' });

      await expect(resetConfig()).resolves.toBeUndefined();
    });

    it('throws CONFIG_RESET_ERROR on other errors', async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error('Permission denied'));

      await expect(resetConfig()).rejects.toThrow();

      try {
        await resetConfig();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.CONFIG_RESET_ERROR);
      }
    });
  });

  describe('getDefaultConfig', () => {
    it('returns default configuration', () => {
      const config = getDefaultConfig();

      expect(config.defaultVoice).toBe('en_US-amy-medium');
      expect(config.speed).toBe(1.0);
    });

    it('returns a new object each time', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('validateConfig', () => {
    it('validates valid config object', () => {
      const config = {
        defaultVoice: 'en_US-amy-medium',
        speed: 1.0,
      };

      expect(validateConfig(config)).toBe(true);
    });

    it('throws INVALID_CONFIG for non-object', () => {
      expect(() => validateConfig('not an object')).toThrow();

      try {
        validateConfig('not an object');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG);
        expect(err.message).toContain('object');
      }
    });

    it('throws INVALID_CONFIG for null', () => {
      expect(() => validateConfig(null)).toThrow();

      try {
        validateConfig(null);
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG);
      }
    });

    it('throws INVALID_CONFIG for wrong type (speed)', () => {
      const config = {
        defaultVoice: 'en_US-amy-medium',
        speed: 'not-a-number',
      };

      expect(() => validateConfig(config)).toThrow();

      try {
        validateConfig(config);
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG);
        expect(err.message).toContain('speed');
        expect(err.message).toContain('number');
      }
    });

    it('throws INVALID_CONFIG for invalid speed value', () => {
      const config = {
        defaultVoice: 'en_US-amy-medium',
        speed: 5.0,
      };

      expect(() => validateConfig(config)).toThrow();

      try {
        validateConfig(config);
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.INVALID_CONFIG);
      }
    });

    it('allows partial config (missing keys)', () => {
      const config = {
        speed: 1.5,
      };

      expect(validateConfig(config)).toBe(true);
    });

    it('allows extra keys not in schema', () => {
      const config = {
        defaultVoice: 'en_US-amy-medium',
        speed: 1.0,
        extraKey: 'extra-value',
      };

      expect(validateConfig(config)).toBe(true);
    });
  });
});
