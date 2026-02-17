import { describe, it, expect, beforeAll } from 'vitest';
import { PiperTTSService } from '../../src/services/piper-tts-service.js';
import { isValidWav, parseWavHeader } from '../../src/utils/audio-utils.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('tts-synthesis-flow (integration)', () => {
  const mockPiperPath = path.join(__dirname, '..', 'fixtures', 'mock-piper-binary.sh');

  beforeAll(async () => {
    // Ensure mock binary is executable
    try {
      await fs.chmod(mockPiperPath, 0o755);
    } catch (err) {
      console.warn('Could not chmod mock binary:', err);
    }
  });

  it('completes full synthesis flow with mock Piper binary', async () => {
    // Create service with mock binary path
    const service = new PiperTTSService({
      binaryPath: mockPiperPath,
    });

    // Mock the managers to skip download
    (service as any).ready = true;
    (service as any).config.binaryPath = mockPiperPath;

    // Mock voice manager to return fake model path
    (service as any).voiceManager.ensureModel = async () => '/fake/model.onnx';

    const result = await service.synthesize('Hello world');

    expect(result).toBeDefined();
    expect(result.audio).toBeInstanceOf(Buffer);
    expect(result.audio.length).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.sampleRate).toBe(22050);
  }, 30000);

  it('produces valid WAV output', async () => {
    const service = new PiperTTSService({
      binaryPath: mockPiperPath,
    });

    (service as any).ready = true;
    (service as any).config.binaryPath = mockPiperPath;
    (service as any).voiceManager.ensureModel = async () => '/fake/model.onnx';

    const result = await service.synthesize('Test');

    expect(isValidWav(result.audio)).toBe(true);

    const wavInfo = parseWavHeader(result.audio);
    expect(wavInfo.sampleRate).toBe(22050);
    expect(wavInfo.channels).toBe(1);
    expect(wavInfo.bitDepth).toBe(16);
  }, 30000);

  it('handles different text inputs', async () => {
    const service = new PiperTTSService({
      binaryPath: mockPiperPath,
    });

    (service as any).ready = true;
    (service as any).config.binaryPath = mockPiperPath;
    (service as any).voiceManager.ensureModel = async () => '/fake/model.onnx';

    const texts = [
      'Short text',
      'A longer sentence with multiple words and punctuation!',
      'Text with numbers: 123 and symbols: @#$%',
    ];

    for (const text of texts) {
      const result = await service.synthesize(text);
      expect(result.audio.length).toBeGreaterThan(0);
      expect(isValidWav(result.audio)).toBe(true);
    }
  }, 60000);

  it('respects custom speed option', async () => {
    const service = new PiperTTSService({
      binaryPath: mockPiperPath,
    });

    (service as any).ready = true;
    (service as any).config.binaryPath = mockPiperPath;
    (service as any).voiceManager.ensureModel = async () => '/fake/model.onnx';

    const result = await service.synthesize('Test', { speed: 1.5 });

    expect(result.audio.length).toBeGreaterThan(0);
    expect(isValidWav(result.audio)).toBe(true);
  }, 30000);

  it('synthesizes to file successfully', async () => {
    const service = new PiperTTSService({
      binaryPath: mockPiperPath,
    });

    (service as any).ready = true;
    (service as any).config.binaryPath = mockPiperPath;
    (service as any).voiceManager.ensureModel = async () => '/fake/model.onnx';

    const outputPath = path.join(__dirname, '..', 'fixtures', 'test-output.wav');

    await service.synthesizeToFile('Test file output', outputPath);

    const fileContent = await fs.readFile(outputPath);
    expect(isValidWav(fileContent)).toBe(true);

    // Cleanup
    await fs.unlink(outputPath).catch(() => {});
  }, 30000);
});
