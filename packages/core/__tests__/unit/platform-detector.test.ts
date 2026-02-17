import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectPlatform } from '../../src/utils/platform-detector.js';
import { TTSErrorCode } from '@tts-local/types';

describe('platform-detector', () => {
  const originalPlatform = process.platform;
  const originalArch = process.arch;

  beforeEach(() => {
    // Reset to original values
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(process, 'arch', {
      value: originalArch,
      writable: true,
      configurable: true,
    });
  });

  describe('macOS detection', () => {
    it('detects darwin x64 correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const info = detectPlatform();

      expect(info.os).toBe('darwin');
      expect(info.arch).toBe('x64');
      expect(info.piperPlatformKey).toBe('macos_x64');
      expect(info.binaryExtension).toBe('');
      expect(info.archiveFormat).toBe('tar.gz');
      expect(info.needsGatekeeperFix).toBe(true);
      expect(info.needsChmodExecutable).toBe(true);
    });

    it('detects darwin arm64 correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const info = detectPlatform();

      expect(info.os).toBe('darwin');
      expect(info.arch).toBe('arm64');
      expect(info.piperPlatformKey).toBe('macos_aarch64');
      expect(info.needsGatekeeperFix).toBe(true);
      expect(info.needsChmodExecutable).toBe(true);
    });
  });

  describe('Windows detection', () => {
    it('detects win32 x64 correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const info = detectPlatform();

      expect(info.os).toBe('win32');
      expect(info.arch).toBe('x64');
      expect(info.piperPlatformKey).toBe('windows_amd64');
      expect(info.binaryExtension).toBe('.exe');
      expect(info.archiveFormat).toBe('zip');
      expect(info.needsGatekeeperFix).toBe(false);
      expect(info.needsChmodExecutable).toBe(false);
    });
  });

  describe('Linux detection', () => {
    it('detects linux x64 correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      const info = detectPlatform();

      expect(info.os).toBe('linux');
      expect(info.arch).toBe('x64');
      expect(info.piperPlatformKey).toBe('linux_x64');
      expect(info.binaryExtension).toBe('');
      expect(info.archiveFormat).toBe('tar.gz');
      expect(info.needsGatekeeperFix).toBe(false);
      expect(info.needsChmodExecutable).toBe(true);
    });

    it('detects linux arm64 correctly', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });

      const info = detectPlatform();

      expect(info.os).toBe('linux');
      expect(info.arch).toBe('arm64');
      expect(info.piperPlatformKey).toBe('linux_aarch64');
      expect(info.needsChmodExecutable).toBe(true);
    });
  });

  describe('unsupported platforms', () => {
    it('throws UNSUPPORTED_PLATFORM for unsupported OS', () => {
      Object.defineProperty(process, 'platform', { value: 'freebsd' });
      Object.defineProperty(process, 'arch', { value: 'x64' });

      expect(() => detectPlatform()).toThrow();
      try {
        detectPlatform();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.UNSUPPORTED_PLATFORM);
        expect(err.message).toContain('freebsd');
      }
    });

    it('throws UNSUPPORTED_PLATFORM for unsupported arch on unsupported OS', () => {
      Object.defineProperty(process, 'platform', { value: 'aix' });
      Object.defineProperty(process, 'arch', { value: 'ppc64' });

      expect(() => detectPlatform()).toThrow();
      try {
        detectPlatform();
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.UNSUPPORTED_PLATFORM);
      }
    });
  });
});
