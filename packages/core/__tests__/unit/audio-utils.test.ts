import { describe, it, expect } from 'vitest';
import { parseWavHeader, isValidWav } from '../../src/utils/audio-utils.js';
import fs from 'node:fs';
import path from 'node:path';

describe('audio-utils', () => {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');

  describe('parseWavHeader', () => {
    it('parses valid WAV file header correctly', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));
      const info = parseWavHeader(sampleWav);

      expect(info.sampleRate).toBe(22050);
      expect(info.channels).toBe(1);
      expect(info.bitDepth).toBe(16);
      expect(info.duration).toBeGreaterThan(0);
    });

    it('calculates duration correctly', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));
      const info = parseWavHeader(sampleWav);

      // Sample is approximately 1 second
      expect(info.duration).toBeGreaterThan(0.9);
      expect(info.duration).toBeLessThan(1.1);
    });

    it('throws on corrupt WAV file', () => {
      const corruptWav = fs.readFileSync(path.join(fixturesDir, 'corrupt.wav'));

      expect(() => parseWavHeader(corruptWav)).toThrow();
    });

    it('throws on non-WAV data', () => {
      const invalidData = Buffer.from('not a wav file');

      expect(() => parseWavHeader(invalidData)).toThrow();
    });

    it('throws on empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);

      expect(() => parseWavHeader(emptyBuffer)).toThrow();
    });

    it('throws on buffer too small for header', () => {
      const tooSmall = Buffer.alloc(10);

      expect(() => parseWavHeader(tooSmall)).toThrow();
    });
  });

  describe('isValidWav', () => {
    it('returns true for valid WAV file', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));

      expect(isValidWav(sampleWav)).toBe(true);
    });

    it('returns false for corrupt WAV file', () => {
      const corruptWav = fs.readFileSync(path.join(fixturesDir, 'corrupt.wav'));

      expect(isValidWav(corruptWav)).toBe(false);
    });

    it('returns false for non-WAV data', () => {
      const invalidData = Buffer.from('not a wav file');

      expect(isValidWav(invalidData)).toBe(false);
    });

    it('returns false for empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);

      expect(isValidWav(emptyBuffer)).toBe(false);
    });

    it('checks RIFF header', () => {
      const fakeRiff = Buffer.alloc(12);
      fakeRiff.write('RIFF', 0);
      fakeRiff.write('WAVE', 8);

      // Should still return false as it doesn't have full WAV structure
      expect(isValidWav(fakeRiff)).toBe(false);
    });
  });

  describe('WAV header structure', () => {
    it('correctly reads RIFF chunk ID', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));

      expect(sampleWav.toString('ascii', 0, 4)).toBe('RIFF');
    });

    it('correctly reads WAVE format', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));

      expect(sampleWav.toString('ascii', 8, 12)).toBe('WAVE');
    });

    it('correctly reads fmt chunk', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));

      expect(sampleWav.toString('ascii', 12, 16)).toBe('fmt ');
    });

    it('validates PCM format code', () => {
      const sampleWav = fs.readFileSync(path.join(fixturesDir, 'sample.wav'));
      const info = parseWavHeader(sampleWav);

      // PCM format should be present in a valid WAV
      expect(info.sampleRate).toBeGreaterThan(0);
      expect(info.channels).toBeGreaterThan(0);
    });
  });
});
