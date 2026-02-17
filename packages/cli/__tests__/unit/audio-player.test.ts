import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioPlayer } from '../../src/utils/audio-player.js';
import { TTSErrorCode } from '@tts-local/types';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

vi.mock('node:child_process');
vi.mock('node:fs/promises');

describe('audio-player', () => {
  let player: AudioPlayer;
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetAllMocks();
    player = new AudioPlayer();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  describe('macOS player detection', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
    });

    it('detects afplay on macOS', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const mockPlayProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockPlayProc;
        }),
      };
      vi.mocked(spawn)
        .mockReturnValueOnce(mockProc as any) // which check
        .mockReturnValueOnce(mockPlayProc as any); // play

      await player.play(Buffer.from('fake-wav-data'));

      expect(spawn).toHaveBeenCalledWith('which', ['afplay'], expect.any(Object));
    });
  });

  describe('Linux player detection', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });

    it('tries paplay first on Linux', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      expect(spawn).toHaveBeenCalledWith('which', ['paplay'], expect.any(Object));
    });

    it('falls back to aplay if paplay not found', async () => {
      let callCount = 0;
      const mockNotFoundProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1); // Not found
          return mockNotFoundProc;
        }),
      };
      const mockFoundProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0); // Found
          return mockFoundProc;
        }),
      };

      vi.mocked(spawn).mockImplementation((cmd, args) => {
        callCount++;
        if (callCount === 1) return mockNotFoundProc as any; // paplay not found
        if (callCount === 2) return mockFoundProc as any; // aplay found
        return mockFoundProc as any; // play
      });

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      expect(spawn).toHaveBeenCalledWith('which', ['paplay'], expect.any(Object));
      expect(spawn).toHaveBeenCalledWith('which', ['aplay'], expect.any(Object));
    });

    it('tries ffplay after aplay', async () => {
      let callCount = 0;
      const mockNotFoundProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1);
          return mockNotFoundProc;
        }),
      };
      const mockFoundProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockFoundProc;
        }),
      };

      vi.mocked(spawn).mockImplementation((cmd, args) => {
        callCount++;
        if (callCount <= 2) return mockNotFoundProc as any; // paplay, aplay not found
        return mockFoundProc as any; // ffplay found
      });

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      expect(spawn).toHaveBeenCalledWith('which', ['ffplay'], expect.any(Object));
    });
  });

  describe('Windows player detection', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
    });

    it('detects PowerShell on Windows', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      expect(spawn).toHaveBeenCalledWith('where', ['powershell'], expect.any(Object));
    });

    it('uses where command on Windows for detection', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      // First call should be 'where' command
      expect(spawn).toHaveBeenNthCalledWith(1, 'where', expect.any(Array), expect.any(Object));
    });
  });

  describe('playback', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
    });

    it('writes WAV buffer to temp file', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const wavBuffer = Buffer.from('fake-wav-data');
      await player.play(wavBuffer);

      expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('tts-'), wavBuffer);
    });

    it('cleans up temp file after playback', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      expect(fs.unlink).toHaveBeenCalled();
    });

    it('spawns player process with correct arguments', async () => {
      const mockCheckProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockCheckProc;
        }),
      };
      const mockPlayProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockPlayProc;
        }),
      };

      vi.mocked(spawn)
        .mockReturnValueOnce(mockCheckProc as any)
        .mockReturnValueOnce(mockPlayProc as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await player.play(Buffer.from('fake-wav-data'));

      expect(spawn).toHaveBeenCalledWith(
        'afplay',
        expect.arrayContaining([expect.stringContaining('tts-')]),
        expect.any(Object),
      );
    });

    it('cleans up temp file even on playback error', async () => {
      const mockCheckProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockCheckProc;
        }),
      };
      const mockPlayProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1); // Non-zero exit code
          return mockPlayProc;
        }),
      };

      vi.mocked(spawn)
        .mockReturnValueOnce(mockCheckProc as any)
        .mockReturnValueOnce(mockPlayProc as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await expect(player.play(Buffer.from('fake-wav-data'))).rejects.toThrow();

      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });

    it('throws NO_AUDIO_PLAYER when no player found', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1); // Not found
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);

      await expect(player.play(Buffer.from('fake-wav-data'))).rejects.toThrow();

      try {
        await player.play(Buffer.from('fake-wav-data'));
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.NO_AUDIO_PLAYER);
        expect(err.message).toContain('install');
      }
    });

    it('throws TEMP_FILE_ERROR on temp file write failure', async () => {
      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(player.play(Buffer.from('fake-wav-data'))).rejects.toThrow();

      try {
        await player.play(Buffer.from('fake-wav-data'));
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.TEMP_FILE_ERROR);
      }
    });

    it('throws PLAYBACK_ERROR on non-zero exit code', async () => {
      const mockCheckProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockCheckProc;
        }),
      };
      const mockPlayProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(127); // Command not found
          return mockPlayProc;
        }),
      };

      vi.mocked(spawn)
        .mockReturnValueOnce(mockCheckProc as any)
        .mockReturnValueOnce(mockPlayProc as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      try {
        await player.play(Buffer.from('fake-wav-data'));
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.PLAYBACK_ERROR);
        expect(err.message).toContain('127');
      }
    });

    it('throws PLAYBACK_ERROR on player spawn error', async () => {
      const mockCheckProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockCheckProc;
        }),
      };
      const mockPlayProc = {
        on: vi.fn((event, handler) => {
          if (event === 'error') handler(new Error('Spawn failed'));
          return mockPlayProc;
        }),
      };

      vi.mocked(spawn)
        .mockReturnValueOnce(mockCheckProc as any)
        .mockReturnValueOnce(mockPlayProc as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      try {
        await player.play(Buffer.from('fake-wav-data'));
        throw new Error('Should have thrown');
      } catch (err: any) {
        expect(err.code).toBe(TTSErrorCode.PLAYBACK_ERROR);
      }
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
    });

    it('kills player process when stopped', async () => {
      const mockCheckProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(0);
          return mockCheckProc;
        }),
      };
      const mockPlayProc = {
        on: vi.fn((event, handler) => {
          // Store handlers but don't call them immediately
          // This keeps the play() promise pending
          return mockPlayProc;
        }),
        kill: vi.fn(),
      };

      vi.mocked(spawn)
        .mockReturnValueOnce(mockCheckProc as any)
        .mockReturnValueOnce(mockPlayProc as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      // Start playing but don't await (keeps promise pending)
      const playPromise = player.play(Buffer.from('fake-wav-data'));

      // Give time for process to be stored
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Stop immediately
      await player.stop();

      expect(mockPlayProc.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('platform-specific help messages', () => {
    it('provides macOS help message', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);

      await expect(player.play(Buffer.from('fake-wav-data'))).rejects.toThrow();

      try {
        await player.play(Buffer.from('fake-wav-data'));
      } catch (err: any) {
        expect(err.message).toContain('afplay');
        expect(err.message).toContain('macOS');
      }
    });

    it('provides Linux help message with install instructions', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);

      await expect(player.play(Buffer.from('fake-wav-data'))).rejects.toThrow();

      try {
        await player.play(Buffer.from('fake-wav-data'));
      } catch (err: any) {
        expect(err.message).toContain('paplay');
        expect(err.message).toContain('apt install');
        expect(err.message).toContain('--output');
      }
    });

    it('provides Windows help message', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const mockProc = {
        on: vi.fn((event, handler) => {
          if (event === 'close') handler(1);
          return mockProc;
        }),
      };
      vi.mocked(spawn).mockReturnValue(mockProc as any);

      await expect(player.play(Buffer.from('fake-wav-data'))).rejects.toThrow();

      try {
        await player.play(Buffer.from('fake-wav-data'));
      } catch (err: any) {
        expect(err.message).toContain('PowerShell');
        expect(err.message).toContain('Windows');
      }
    });
  });
});
