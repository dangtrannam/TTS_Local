import type { PlatformInfo } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';

/**
 * Detect OS + architecture and map to Piper binary download key.
 * Handles ARM64 macOS with x64 Rosetta 2 fallback.
 */
export function detectPlatform(): PlatformInfo {
  const os = process.platform;
  const arch = process.arch;

  if (os === 'darwin') {
    // macOS: ARM64 binary may not be available, fall back to x64 via Rosetta 2
    const effectiveArch = arch === 'arm64' ? 'arm64' : 'x64';
    const piperArch = effectiveArch === 'arm64' ? 'aarch64' : 'x64';
    return {
      os: 'darwin',
      arch: effectiveArch as 'x64' | 'arm64',
      piperPlatformKey: `macos_${piperArch}`,
      binaryExtension: '',
      archiveFormat: 'tar.gz',
      needsGatekeeperFix: true,
      needsChmodExecutable: true,
    };
  }

  if (os === 'win32') {
    return {
      os: 'win32',
      arch: 'x64',
      piperPlatformKey: 'windows_amd64',
      binaryExtension: '.exe',
      archiveFormat: 'zip',
      needsGatekeeperFix: false,
      needsChmodExecutable: false,
    };
  }

  if (os === 'linux') {
    const linuxArch = arch === 'arm64' ? 'aarch64' : 'x64';
    return {
      os: 'linux',
      arch: arch === 'arm64' ? 'arm64' : 'x64',
      piperPlatformKey: `linux_${linuxArch}`,
      binaryExtension: '',
      archiveFormat: 'tar.gz',
      needsGatekeeperFix: false,
      needsChmodExecutable: true,
    };
  }

  throw new TTSError(TTSErrorCode.UNSUPPORTED_PLATFORM, `Unsupported platform: ${os} ${arch}`);
}
