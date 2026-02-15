/**
 * Platform-aware audio player
 * Detects and uses native audio players instead of play-sound dependency
 * - macOS: afplay (built-in)
 * - Linux: paplay (PulseAudio) > aplay (ALSA) > ffplay (FFmpeg) > play (SoX)
 * - Windows: PowerShell Media.SoundPlayer
 */
import { spawn, ChildProcess } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { TTSError, TTSErrorCode } from '@tts-local/types';

type Platform = 'darwin' | 'linux' | 'win32';
type PlayerCommand = { cmd: string; args: (path: string) => string[] };

// Platform-specific player configurations
const PLATFORM_PLAYERS: Record<Platform, PlayerCommand[]> = {
  darwin: [{ cmd: 'afplay', args: (path) => [path] }],
  linux: [
    { cmd: 'paplay', args: (path) => [path] },
    { cmd: 'aplay', args: (path) => [path] },
    { cmd: 'ffplay', args: (path) => ['-nodisp', '-autoexit', path] },
    { cmd: 'play', args: (path) => [path] },
  ],
  win32: [
    {
      cmd: 'powershell',
      args: (path) => [
        '-c',
        `(New-Object Media.SoundPlayer '${path.replace(/'/g, "''")}').PlaySync()`,
      ],
    },
  ],
};

/**
 * Audio player class for platform-aware WAV playback
 */
export class AudioPlayer {
  private detectedPlayer: PlayerCommand | null = null;
  private currentProcess: ChildProcess | null = null;
  private tempFilePath: string | null = null;
  private cleanupHandlers: (() => Promise<void>)[] = [];

  /**
   * Detect available audio player on current platform
   * @returns Detected player command or null if none found
   */
  private async detectPlayer(): Promise<PlayerCommand | null> {
    // Return cached result if already detected
    if (this.detectedPlayer) {
      return this.detectedPlayer;
    }

    const platform = process.platform as Platform;
    const players = PLATFORM_PLAYERS[platform];

    if (!players) {
      throw new TTSError(
        TTSErrorCode.UNSUPPORTED_PLATFORM,
        `Platform ${platform} is not supported for audio playback`,
      );
    }

    // Try each player in order
    for (const player of players) {
      if (await this.isCommandAvailable(player.cmd)) {
        this.detectedPlayer = player;
        return player;
      }
    }

    return null;
  }

  /**
   * Check if a command is available in PATH
   * @param cmd Command to check
   * @returns True if command exists
   */
  private async isCommandAvailable(cmd: string): Promise<boolean> {
    return new Promise((resolve) => {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      const proc = spawn(checkCmd, [cmd], {
        stdio: 'ignore',
        shell: process.platform === 'win32',
      });

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Play WAV audio from buffer
   * @param wavBuffer WAV file buffer to play
   * @throws TTSError if no player available or playback fails
   */
  async play(wavBuffer: Buffer): Promise<void> {
    const player = await this.detectPlayer();

    if (!player) {
      throw new TTSError(TTSErrorCode.NO_AUDIO_PLAYER, this.getPlayerInstallationHelp());
    }

    // Write buffer to temp file
    const tempPath = await this.writeTempFile(wavBuffer);
    this.tempFilePath = tempPath;

    // Register cleanup handlers
    this.registerCleanupHandlers();

    // Play audio
    try {
      await this.playFile(tempPath, player);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Write WAV buffer to temporary file
   * @param buffer WAV buffer to write
   * @returns Path to temporary file
   */
  private async writeTempFile(buffer: Buffer): Promise<string> {
    const filename = `tts-${randomBytes(8).toString('hex')}.wav`;
    const path = join(tmpdir(), filename);

    try {
      await writeFile(path, buffer);
      return path;
    } catch (error) {
      throw new TTSError(
        TTSErrorCode.TEMP_FILE_ERROR,
        `Failed to write temp audio file: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Play audio file using detected player
   * @param path Path to audio file
   * @param player Player command configuration
   */
  private async playFile(path: string, player: PlayerCommand): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = player.args(path);
      const proc = spawn(player.cmd, args, {
        stdio: 'ignore',
        shell: process.platform === 'win32',
      });

      this.currentProcess = proc;

      proc.on('close', (code) => {
        this.currentProcess = null;

        if (code === 0) {
          resolve();
        } else {
          reject(
            new TTSError(TTSErrorCode.PLAYBACK_ERROR, `Audio player exited with code ${code}`),
          );
        }
      });

      proc.on('error', (error) => {
        this.currentProcess = null;
        reject(
          new TTSError(
            TTSErrorCode.PLAYBACK_ERROR,
            `Failed to start audio player: ${error.message}`,
          ),
        );
      });
    });
  }

  /**
   * Register cleanup handlers for Ctrl+C and process exit
   */
  private registerCleanupHandlers(): void {
    const handler = async () => {
      await this.cleanup();
      process.exit(0);
    };

    process.once('SIGINT', handler);
    process.once('SIGTERM', handler);

    this.cleanupHandlers.push(async () => {
      process.removeListener('SIGINT', handler);
      process.removeListener('SIGTERM', handler);
    });
  }

  /**
   * Stop playback and clean up resources
   */
  async stop(): Promise<void> {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
    }

    await this.cleanup();
  }

  /**
   * Clean up temporary file and handlers
   */
  private async cleanup(): Promise<void> {
    // Remove temp file
    if (this.tempFilePath) {
      try {
        await unlink(this.tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
      this.tempFilePath = null;
    }

    // Run cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch {
        // Ignore cleanup errors
      }
    }
    this.cleanupHandlers = [];
  }

  /**
   * Get platform-specific help for installing audio player
   * @returns Installation instructions
   */
  private getPlayerInstallationHelp(): string {
    const platform = process.platform as Platform;

    const helpMessages: Record<Platform, string> = {
      darwin:
        'No audio player found. afplay should be available on macOS. Please check your system.',
      linux: `No audio player found. Install one of:
  - PulseAudio: sudo apt install pulseaudio-utils (paplay)
  - ALSA: sudo apt install alsa-utils (aplay)
  - FFmpeg: sudo apt install ffmpeg (ffplay)
  - SoX: sudo apt install sox (play)

Or use --output flag to save audio to a file instead.`,
      win32:
        'No audio player found. PowerShell should be available on Windows. Please check your system.',
    };

    return helpMessages[platform] || 'No audio player found for your platform.';
  }
}

/**
 * Create a new audio player instance
 * @returns AudioPlayer instance
 */
export function createAudioPlayer(): AudioPlayer {
  return new AudioPlayer();
}
