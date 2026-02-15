import fs from 'node:fs/promises';
import path from 'node:path';
import type { DownloadProgress, PlatformInfo } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';
import { getPiperBinaryUrl, PIPER_VERSION } from '../config/default-config.js';
import { downloadFile, extractTarGz, extractZip } from '../utils/download-helper.js';
import { detectPlatform } from '../utils/platform-detector.js';
import { getAppPaths } from '../utils/platform-paths.js';

/**
 * Manages Piper binary detection, download, verification, and permissions.
 * Stores binary in platform-specific app data directory.
 */
export class PiperBinaryManager {
  private platform: PlatformInfo;
  private binDir: string;

  constructor() {
    this.platform = detectPlatform();
    this.binDir = getAppPaths().bin;
  }

  /** Get absolute path to the piper executable */
  getBinaryPath(): string {
    const binaryName = `piper${this.platform.binaryExtension}`;
    return path.join(this.binDir, 'piper', binaryName);
  }

  /** Ensure binary exists, download if missing. Returns binary path. */
  async ensureBinary(onProgress?: (progress: DownloadProgress) => void): Promise<string> {
    const binaryPath = this.getBinaryPath();

    if (await this.binaryExists(binaryPath)) {
      return binaryPath;
    }

    await this.downloadBinary(onProgress);
    await this.fixPermissions(binaryPath);
    await this.verifyBinary(binaryPath);
    await this.writeVersionFile(binaryPath);

    return binaryPath;
  }

  /** Download the correct platform binary from GitHub releases */
  async downloadBinary(onProgress?: (progress: DownloadProgress) => void): Promise<void> {
    const url = getPiperBinaryUrl(this.platform.piperPlatformKey);
    const ext = this.platform.archiveFormat === 'tar.gz' ? '.tar.gz' : '.zip';
    const archivePath = path.join(this.binDir, `piper${ext}`);

    await fs.mkdir(this.binDir, { recursive: true });

    try {
      await downloadFile(url, archivePath, onProgress);

      if (this.platform.archiveFormat === 'tar.gz') {
        await extractTarGz(archivePath, this.binDir);
      } else {
        await extractZip(archivePath, this.binDir);
      }
    } catch (err) {
      if (err instanceof TTSError) throw err;
      throw new TTSError(
        TTSErrorCode.BINARY_DOWNLOAD_FAILED,
        `Failed to download Piper binary: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    } finally {
      // Clean up archive
      await fs.rm(archivePath, { force: true }).catch(() => {});
    }
  }

  /** Verify binary execution with --version check (5s timeout) */
  async verifyBinary(binaryPath: string): Promise<void> {
    try {
      const { execa } = await import('execa');
      await execa(binaryPath, ['--version'], { timeout: 5000 });
    } catch (err) {
      throw new TTSError(
        TTSErrorCode.BINARY_CORRUPT,
        `Piper binary verification failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  /** Fix permissions: chmod +x on Unix, xattr -cr on macOS */
  async fixPermissions(binaryPath: string): Promise<void> {
    if (this.platform.needsChmodExecutable) {
      await fs.chmod(binaryPath, 0o755);
    }

    if (this.platform.needsGatekeeperFix) {
      try {
        const { execa } = await import('execa');
        // Remove quarantine attribute on macOS
        const piperDir = path.dirname(binaryPath);
        await execa('xattr', ['-cr', piperDir]);
      } catch {
        // Non-fatal: xattr may fail if attribute doesn't exist
      }
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

  private async writeVersionFile(binaryPath: string): Promise<void> {
    const versionFile = path.join(path.dirname(binaryPath), '.version');
    await fs.writeFile(versionFile, PIPER_VERSION, 'utf-8');
  }
}
