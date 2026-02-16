import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppPaths } from '../../src/utils/platform-paths.js';
import os from 'node:os';
import path from 'node:path';

describe('platform-paths', () => {
  const originalPlatform = process.platform;
  const originalHomeDir = os.homedir;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    vi.spyOn(os, 'homedir').mockRestore();
  });

  describe('macOS paths', () => {
    it('generates correct app data paths for macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      vi.spyOn(os, 'homedir').mockReturnValue('/Users/testuser');

      const paths = getAppPaths();

      expect(paths.appData).toBe(
        path.join('/Users/testuser', 'Library', 'Application Support', 'tts-local'),
      );
      expect(paths.bin).toBe(
        path.join('/Users/testuser', 'Library', 'Application Support', 'tts-local', 'bin'),
      );
      expect(paths.models).toBe(
        path.join('/Users/testuser', 'Library', 'Application Support', 'tts-local', 'models'),
      );
      expect(paths.cache).toBe(
        path.join('/Users/testuser', 'Library', 'Application Support', 'tts-local', 'cache'),
      );
      expect(paths.config).toBe(
        path.join('/Users/testuser', 'Library', 'Application Support', 'tts-local', 'config'),
      );
    });
  });

  describe('Windows paths', () => {
    it('generates correct app data paths for Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      vi.spyOn(os, 'homedir').mockReturnValue('C:\\Users\\testuser');

      const paths = getAppPaths();

      // path.join uses platform-specific separators, but since we're running on non-Windows,
      // it will use forward slashes. We just check the path contains the expected components.
      expect(paths.appData).toContain('testuser');
      expect(paths.appData).toContain('AppData');
      expect(paths.appData).toContain('Roaming');
      expect(paths.appData).toContain('tts-local');
      expect(paths.bin).toContain('tts-local');
      expect(paths.bin).toContain('bin');
      expect(paths.models).toContain('tts-local');
      expect(paths.models).toContain('models');
    });
  });

  describe('Linux paths', () => {
    it('generates correct app data paths for Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      vi.spyOn(os, 'homedir').mockReturnValue('/home/testuser');

      const paths = getAppPaths();

      expect(paths.appData).toBe(path.join('/home/testuser', '.local', 'share', 'tts-local'));
      expect(paths.bin).toBe(path.join('/home/testuser', '.local', 'share', 'tts-local', 'bin'));
      expect(paths.models).toBe(
        path.join('/home/testuser', '.local', 'share', 'tts-local', 'models'),
      );
      expect(paths.cache).toBe(
        path.join('/home/testuser', '.local', 'share', 'tts-local', 'cache'),
      );
      expect(paths.config).toBe(
        path.join('/home/testuser', '.local', 'share', 'tts-local', 'config'),
      );
    });
  });

  describe('edge cases', () => {
    it('handles custom home directory paths', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      vi.spyOn(os, 'homedir').mockReturnValue('/custom/home/path');

      const paths = getAppPaths();

      expect(paths.appData).toBe(path.join('/custom/home/path', '.local', 'share', 'tts-local'));
    });

    it('generates paths for unsupported platform with fallback', () => {
      Object.defineProperty(process, 'platform', { value: 'freebsd' });
      vi.spyOn(os, 'homedir').mockReturnValue('/home/testuser');

      const paths = getAppPaths();

      // Should fallback to Linux-like paths
      expect(paths.appData).toContain('testuser');
      expect(paths.models).toContain('models');
    });

    it('all paths have correct subdirectory structure', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      vi.spyOn(os, 'homedir').mockReturnValue('/Users/test');

      const paths = getAppPaths();

      expect(paths.bin).toContain('bin');
      expect(paths.models).toContain('models');
      expect(paths.cache).toContain('cache');
      expect(paths.config).toContain('config');
    });
  });
});
