import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import type { DownloadProgress } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;
const DOWNLOAD_TIMEOUT_MS = 300_000;

/**
 * Download a file with progress reporting, retry logic, and extraction support.
 * Uses native fetch (Node 18+).
 */
export async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  await fs.mkdir(path.dirname(destPath), { recursive: true });

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await downloadAttempt(url, destPath, onProgress);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        const delay = BACKOFF_BASE_MS * Math.pow(3, attempt);
        await sleep(delay);
      }
    }
  }

  throw new TTSError(
    TTSErrorCode.NETWORK_ERROR,
    `Download failed after ${MAX_RETRIES} attempts: ${url}`,
    lastError,
  );
}

async function downloadAttempt(
  url: string,
  destPath: string,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const totalBytes = Number(response.headers.get('content-length') || 0);
    let bytesDownloaded = 0;

    const fileStream = createWriteStream(destPath);
    const reader = response.body.getReader();

    try {
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (done || !chunk.value) break;
        const value = chunk.value;

        fileStream.write(value);
        bytesDownloaded += value.length;

        if (onProgress && totalBytes > 0) {
          onProgress({
            bytesDownloaded,
            totalBytes,
            percent: Math.round((bytesDownloaded / totalBytes) * 100),
          });
        }
      }
    } finally {
      fileStream.end();
      await new Promise<void>((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extract a .tar.gz archive to a destination directory.
 * Uses Node built-in zlib + tar package.
 */
export async function extractTarGz(archivePath: string, destDir: string): Promise<void> {
  // Dynamic import to avoid top-level dependency resolution issues
  const tar = await import('tar');
  await fs.mkdir(destDir, { recursive: true });
  const gunzip = createGunzip();
  const source = (await import('node:fs')).createReadStream(archivePath);
  await pipeline(source, gunzip, tar.extract({ cwd: destDir }));
}

/**
 * Extract a .zip archive to a destination directory.
 * Uses Node built-in zlib + manual zip parsing for Windows compatibility.
 */
export async function extractZip(archivePath: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });

  // Try system unzip first (macOS/Linux), fall back to PowerShell on Windows
  const { execa } = await import('execa');
  try {
    await execa('unzip', ['-o', archivePath, '-d', destDir]);
  } catch {
    // Windows fallback: use PowerShell Expand-Archive
    await execa('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force`,
    ]);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
