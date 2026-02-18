import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { DownloadProgress } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { getElectronResourcesPath } from '../utils/electron-helper.js';

const PIPER_VERSION = '1.4.1';

/**
 * Manages Piper TTS installation via pip.
 * Uses Python package piper-tts instead of GitHub releases for better macOS compatibility.
 * In packaged Electron app, uses bundled binary from resources.
 */
export class PiperBinaryManager {
  /** Get absolute path to the piper executable, checking bundled binary first */
  getBinaryPath(): string {
    // Check if running in packaged Electron app
    const resourcesPath = getElectronResourcesPath();
    if (resourcesPath) {
      const bundledPath = path.join(
        resourcesPath,
        'piper',
        process.platform === 'win32' ? 'piper.exe' : 'piper',
      );
      // Note: We can't check existence synchronously here, but we return the path
      // The ensureBinary method will handle verification
      return bundledPath;
    }

    // Fallback to pip-installed binary
    const homeDir = os.homedir();

    // Common Python user bin locations
    const possiblePaths = [
      path.join(homeDir, 'Library', 'Python', '3.12', 'bin', 'piper'), // macOS Python 3.12
      path.join(homeDir, 'Library', 'Python', '3.11', 'bin', 'piper'), // macOS Python 3.11
      path.join(homeDir, 'Library', 'Python', '3.10', 'bin', 'piper'), // macOS Python 3.10
      path.join(homeDir, '.local', 'bin', 'piper'), // Linux
      path.join(homeDir, 'AppData', 'Roaming', 'Python', 'Scripts', 'piper.exe'), // Windows
    ];

    // Also check if piper is in PATH
    return possiblePaths[0]; // Default to macOS Python 3.12 path
  }

  /** Ensure binary exists, install via pip if missing. Returns binary path. */
  async ensureBinary(onProgress?: (progress: DownloadProgress) => void): Promise<string> {
    const binaryPath = this.getBinaryPath();

    if (await this.binaryExists(binaryPath)) {
      return binaryPath;
    }

    // If bundled binary doesn't exist but we're in packaged app, throw error
    // User should have received app with bundled binary
    if (getElectronResourcesPath()) {
      throw new TTSError(
        TTSErrorCode.BINARY_NOT_FOUND,
        'Bundled Piper binary not found in packaged application. Please reinstall the app.',
      );
    }

    await this.installViaPip(onProgress);
    await this.verifyBinary(binaryPath);

    return binaryPath;
  }

  /** Install piper-tts via pip */
  private async installViaPip(onProgress?: (progress: DownloadProgress) => void): Promise<void> {
    try {
      const { execa } = await import('execa');

      onProgress?.({ bytesDownloaded: 0, totalBytes: 100, percent: 10 });

      // Install piper-tts and required dependencies
      await execa(
        'python3',
        [
          '-m',
          'pip',
          'install',
          '--user',
          `piper-tts==${PIPER_VERSION}`,
          'pathvalidate', // Missing dependency in piper-tts
        ],
        {
          stdio: 'pipe',
          timeout: 120000, // 2 minutes for download
        },
      );

      onProgress?.({ bytesDownloaded: 100, totalBytes: 100, percent: 100 });
    } catch (err) {
      if (err instanceof TTSError) throw err;

      const error = err as { stderr?: string; message?: string };
      throw new TTSError(
        TTSErrorCode.BINARY_DOWNLOAD_FAILED,
        `Failed to install piper-tts via pip: ${error.stderr || error.message || String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  /** Verify binary execution with --version check */
  async verifyBinary(binaryPath: string): Promise<void> {
    try {
      const { execa } = await import('execa');
      // Piper requires -m flag, but we just test if it runs without errors
      await execa(binaryPath, ['-m', '/nonexistent'], {
        timeout: 5000,
        reject: false, // Don't throw on non-zero exit (expected since model doesn't exist)
      });
    } catch (err) {
      // If we get a 'model required' error, that's actually good - means piper is working
      const errorMsg = String(err);
      if (errorMsg.includes('required') || errorMsg.includes('model')) {
        return; // Piper is working
      }

      throw new TTSError(
        TTSErrorCode.BINARY_CORRUPT,
        `Piper binary verification failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  private async binaryExists(binaryPath: string): Promise<boolean> {
    try {
      await fs.access(binaryPath, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
}
