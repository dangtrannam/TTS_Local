import { describe, it, expect } from 'vitest';
import { formatErrorForUser, TTSError, TTSErrorCode } from '../../src/utils/error-handler.js';

describe('error-handler', () => {
  describe('formatErrorForUser', () => {
    it('returns actionable message for BINARY_NOT_FOUND', () => {
      const error = new TTSError(TTSErrorCode.BINARY_NOT_FOUND, 'Binary not found');
      const message = formatErrorForUser(error);

      expect(message).toContain('tts setup');
      expect(message).toContain('download');
    });

    it('returns actionable message for BINARY_DOWNLOAD_FAILED', () => {
      const error = new TTSError(TTSErrorCode.BINARY_DOWNLOAD_FAILED, 'Download failed');
      const message = formatErrorForUser(error);

      expect(message).toContain('internet connection');
    });

    it('returns actionable message for BINARY_PERMISSION_DENIED', () => {
      const error = new TTSError(TTSErrorCode.BINARY_PERMISSION_DENIED, 'Permission denied');
      const message = formatErrorForUser(error);

      expect(message).toContain('permission');
    });

    it('returns actionable message for BINARY_GATEKEEPER_BLOCKED', () => {
      const error = new TTSError(TTSErrorCode.BINARY_GATEKEEPER_BLOCKED, 'Blocked by Gatekeeper');
      const message = formatErrorForUser(error);

      expect(message).toContain('macOS');
      expect(message).toContain('automatically');
    });

    it('returns actionable message for BINARY_CORRUPT', () => {
      const error = new TTSError(TTSErrorCode.BINARY_CORRUPT, 'Corrupt binary');
      const message = formatErrorForUser(error);

      expect(message).toContain('corrupted');
      expect(message).toContain('re-download');
    });

    it('returns actionable message for MODEL_NOT_FOUND', () => {
      const error = new TTSError(TTSErrorCode.MODEL_NOT_FOUND, 'Model not found');
      const message = formatErrorForUser(error);

      expect(message).toContain('Voice model');
      expect(message).toContain('tts setup');
    });

    it('returns actionable message for MODEL_DOWNLOAD_FAILED', () => {
      const error = new TTSError(TTSErrorCode.MODEL_DOWNLOAD_FAILED, 'Download failed');
      const message = formatErrorForUser(error);

      expect(message).toContain('internet connection');
    });

    it('returns actionable message for MODEL_CORRUPT', () => {
      const error = new TTSError(TTSErrorCode.MODEL_CORRUPT, 'Corrupt model');
      const message = formatErrorForUser(error);

      expect(message).toContain('corrupted');
      expect(message).toContain('re-download');
    });

    it('returns actionable message for SYNTHESIS_FAILED', () => {
      const error = new TTSError(TTSErrorCode.SYNTHESIS_FAILED, 'Synthesis failed');
      const message = formatErrorForUser(error);

      expect(message).toContain('failed');
      expect(message).toContain('try again');
    });

    it('returns actionable message for SYNTHESIS_TIMEOUT', () => {
      const error = new TTSError(TTSErrorCode.SYNTHESIS_TIMEOUT, 'Timeout');
      const message = formatErrorForUser(error);

      expect(message).toContain('timeout');
      expect(message).toContain('shorter text');
    });

    it('returns actionable message for EMPTY_TEXT', () => {
      const error = new TTSError(TTSErrorCode.EMPTY_TEXT, 'Empty text');
      const message = formatErrorForUser(error);

      expect(message).toContain('empty');
    });

    it('returns actionable message for TEXT_TOO_LONG', () => {
      const error = new TTSError(TTSErrorCode.TEXT_TOO_LONG, 'Text too long');
      const message = formatErrorForUser(error);

      expect(message).toContain('maximum');
      expect(message).toContain('100,000');
    });

    it('returns actionable message for UNSUPPORTED_PLATFORM', () => {
      const error = new TTSError(TTSErrorCode.UNSUPPORTED_PLATFORM, 'Unsupported platform');
      const message = formatErrorForUser(error);

      expect(message).toContain('not supported');
    });

    it('returns actionable message for NETWORK_ERROR', () => {
      const error = new TTSError(TTSErrorCode.NETWORK_ERROR, 'Network error');
      const message = formatErrorForUser(error);

      expect(message).toContain('internet connection');
    });

    // CLI-specific errors
    it('returns actionable message for NO_INPUT', () => {
      const error = new TTSError(TTSErrorCode.NO_INPUT, 'No input');
      const message = formatErrorForUser(error);

      expect(message).toContain('No input');
      expect(message).toContain('tts speak');
    });

    it('returns actionable message for INVALID_INPUT', () => {
      const error = new TTSError(TTSErrorCode.INVALID_INPUT, 'Invalid input');
      const message = formatErrorForUser(error);

      expect(message).toContain('Invalid');
    });

    it('returns actionable message for FILE_NOT_FOUND', () => {
      const error = new TTSError(TTSErrorCode.FILE_NOT_FOUND, 'File not found');
      const message = formatErrorForUser(error);

      expect(message).toContain('not found');
      expect(message).toContain('path');
    });

    it('returns actionable message for NO_AUDIO_PLAYER', () => {
      const error = new TTSError(TTSErrorCode.NO_AUDIO_PLAYER, 'No audio player');
      const message = formatErrorForUser(error);

      expect(message).toContain('audio player');
      expect(message).toContain('--output');
    });

    it('returns actionable message for CONFIG_READ_ERROR', () => {
      const error = new TTSError(TTSErrorCode.CONFIG_READ_ERROR, 'Config read error');
      const message = formatErrorForUser(error);

      expect(message).toContain('configuration');
    });

    it('returns actionable message for INVALID_CONFIG_KEY', () => {
      const error = new TTSError(TTSErrorCode.INVALID_CONFIG_KEY, 'Invalid key');
      const message = formatErrorForUser(error);

      expect(message).toContain('Invalid');
      expect(message).toContain('key');
    });

    it('returns actionable message for INVALID_CONFIG_VALUE', () => {
      const error = new TTSError(TTSErrorCode.INVALID_CONFIG_VALUE, 'Invalid value');
      const message = formatErrorForUser(error);

      expect(message).toContain('Invalid');
      expect(message).toContain('value');
    });
  });

  describe('all error codes coverage', () => {
    it('has messages for all TTSErrorCode values', () => {
      const allErrorCodes = Object.values(TTSErrorCode);

      for (const code of allErrorCodes) {
        const error = new TTSError(code, 'Test error');
        const message = formatErrorForUser(error);

        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toBe('Test error'); // Should return mapped message, not original
      }
    });

    it('no error code returns "Unknown error"', () => {
      const allErrorCodes = Object.values(TTSErrorCode);

      for (const code of allErrorCodes) {
        const error = new TTSError(code, 'Test error');
        const message = formatErrorForUser(error);

        expect(message.toLowerCase()).not.toContain('unknown');
      }
    });
  });

  describe('TTSError class', () => {
    it('creates error with code and message', () => {
      const error = new TTSError(TTSErrorCode.BINARY_NOT_FOUND, 'Test message');

      expect(error.code).toBe(TTSErrorCode.BINARY_NOT_FOUND);
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TTSError');
    });

    it('stores cause if provided', () => {
      const cause = new Error('Original error');
      const error = new TTSError(TTSErrorCode.SYNTHESIS_FAILED, 'Failed', cause);

      expect(error.cause).toBe(cause);
    });

    it('is instanceof Error', () => {
      const error = new TTSError(TTSErrorCode.EMPTY_TEXT, 'Empty');

      expect(error instanceof Error).toBe(true);
    });

    it('is instanceof TTSError', () => {
      const error = new TTSError(TTSErrorCode.TEXT_TOO_LONG, 'Too long');

      expect(error instanceof TTSError).toBe(true);
    });
  });
});
