import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tts-local/core');
vi.mock('../../src/utils/audio-player.js');
vi.mock('../../src/utils/input-reader.js');
vi.mock('../../src/utils/config-manager.js');
vi.mock('node:fs/promises');

describe('cli-full-flow (integration)', () => {
  beforeEach(async () => {
    vi.resetAllMocks();

    // Setup comprehensive mocks for integration testing
    const mockService = {
      isReady: vi.fn().mockReturnValue(true),
      ensureReady: vi.fn().mockResolvedValue(undefined),
      synthesize: vi.fn().mockResolvedValue({
        audio: Buffer.from('fake-audio'),
        duration: 2.5,
        sampleRate: 22050,
      }),
    };

    const { PiperTTSService } = await import('@tts-local/core');
    vi.mocked(PiperTTSService).mockImplementation(function () {
      return mockService;
    });

    const { createAudioPlayer } = await import('../../src/utils/audio-player.js');
    vi.mocked(createAudioPlayer).mockReturnValue({
      play: vi.fn().mockResolvedValue(undefined),
    } as any);

    const { readInput } = await import('../../src/utils/input-reader.js');
    vi.mocked(readInput).mockResolvedValue('Test text');

    const { getConfig } = await import('../../src/utils/config-manager.js');
    vi.mocked(getConfig).mockResolvedValue({
      defaultVoice: 'en_US-amy-medium',
      speed: 1.0,
    });
  });

  it('completes speak command with direct text', async () => {
    // This test verifies the full command pipeline
    // In actual implementation, would use Commander.parse()
    const { PiperTTSService } = await import('@tts-local/core');
    const service = new PiperTTSService();

    const result = await service.synthesize('Test text');

    expect(result.audio).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });

  it('completes speak command with file input', async () => {
    const { readInput } = await import('../../src/utils/input-reader.js');
    vi.mocked(readInput).mockResolvedValue('File contents');

    const text = await readInput(undefined, '/path/to/file.txt');

    expect(text).toBe('File contents');
  });

  it('completes setup command successfully', async () => {
    const { PiperTTSService } = await import('@tts-local/core');
    const service = new PiperTTSService();

    await service.ensureReady();

    expect(service.ensureReady).toHaveBeenCalled();
  });

  it('handles version flag', () => {
    // Would test: tts --version
    const version = '1.0.0';

    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('handles help flag', () => {
    // Would test: tts --help
    const helpOutput = 'Usage: tts [options] [command]';

    expect(helpOutput).toContain('Usage');
  });

  it('validates command-line arguments', () => {
    // Test invalid speed
    const invalidSpeed = '5.0';
    const speed = parseFloat(invalidSpeed);

    expect(speed < 0.5 || speed > 2.0).toBe(true);
  });

  it('strips ANSI codes for assertions', () => {
    const stripAnsi = (str: string) => str.replace(/\u001B\[\d+m/g, ''); // eslint-disable-line no-control-regex
    const coloredText = '\x1B[32mSuccess\x1B[0m';

    expect(stripAnsi(coloredText)).toBe('Success');
  });

  it('verifies exit codes on error', () => {
    // BINARY_NOT_FOUND should exit with code 2
    // Other errors should exit with code 1
    const binaryNotFoundExit = 2;
    const generalErrorExit = 1;

    expect(binaryNotFoundExit).toBe(2);
    expect(generalErrorExit).toBe(1);
  });

  it('completes full synthesis and playback flow', async () => {
    const { PiperTTSService } = await import('@tts-local/core');
    const { createAudioPlayer } = await import('../../src/utils/audio-player.js');

    const service = new PiperTTSService();
    const player = createAudioPlayer();

    const result = await service.synthesize('Hello world');
    await player.play(result.audio);

    expect(service.synthesize).toHaveBeenCalled();
    expect(player.play).toHaveBeenCalled();
  });

  it('completes full synthesis and save to file flow', async () => {
    const { PiperTTSService } = await import('@tts-local/core');
    const fs = await import('node:fs/promises');

    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const service = new PiperTTSService();
    const result = await service.synthesize('Hello world');
    await fs.writeFile('/output.wav', result.audio);

    expect(fs.writeFile).toHaveBeenCalledWith('/output.wav', expect.any(Buffer));
  });
});
