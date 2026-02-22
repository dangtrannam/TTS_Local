import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiPreprocessorService } from '../../src/services/gemini-preprocessor-service.js';
import { TTSErrorCode } from '@tts-local/types';

// Use vi.hoisted() so mockGenerateContent is available inside vi.mock() factory
const mockGenerateContent = vi.hoisted(() => vi.fn());
const MockGoogleGenAI = vi.hoisted(() =>
  vi.fn(function (this: { models: { generateContent: typeof mockGenerateContent } }) {
    this.models = { generateContent: mockGenerateContent };
  }),
);
vi.mock('@google/genai', () => ({ GoogleGenAI: MockGoogleGenAI }));

describe('GeminiPreprocessorService', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValue({ text: 'Processed text.' });
  });

  it('throws GEMINI_API_KEY_MISSING when no key provided', async () => {
    const svc = new GeminiPreprocessorService('');
    await expect(svc.processText('hello', 'narrate')).rejects.toMatchObject({
      code: TTSErrorCode.GEMINI_API_KEY_MISSING,
    });
  });

  it('calls Gemini once for short text and returns result', async () => {
    const svc = new GeminiPreprocessorService('test-key');
    const result = await svc.processText('Short text.', 'narrate');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(result.fallback).toBe(false);
    expect(result.text).toBe('Processed text.');
  });

  it('calls Gemini once for text with ## headers (1-shot)', async () => {
    const svc = new GeminiPreprocessorService('test-key');
    const text = '## Section 1\nContent one.\n\n## Section 2\nContent two.';
    mockGenerateContent.mockResolvedValueOnce({ text: 'Full narrated output.' });
    const result = await svc.processText(text, 'narrate');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(result.fallback).toBe(false);
    expect(result.text).toBe('Full narrated output.');
  });

  it('returns fallback=true on Gemini API error (fail-open)', async () => {
    const svc = new GeminiPreprocessorService('test-key');
    const originalText = 'hello world';
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));
    const result = await svc.processText(originalText, 'narrate');
    expect(result.fallback).toBe(true);
    expect(result.text).toBe(originalText);
    expect(result.error?.message).toContain('Gemini preprocessing failed');
  });

  it('uses summarize prompt when mode is summarize', async () => {
    const svc = new GeminiPreprocessorService('test-key');
    await svc.processText('Some text.', 'summarize');
    const calledContents = mockGenerateContent.mock.calls[0][0].contents as string;
    expect(calledContents).toContain('Summarize');
  });

  it('uses narrate prompt when mode is narrate', async () => {
    const svc = new GeminiPreprocessorService('test-key');
    await svc.processText('Some text.', 'narrate');
    const calledContents = mockGenerateContent.mock.calls[0][0].contents as string;
    expect(calledContents).toContain('Convert the following document');
  });

  it('sends full text to Gemini and returns response as-is', async () => {
    const svc = new GeminiPreprocessorService('test-key');
    const text = '## Alpha\nContent alpha.\n\n## Beta\nContent beta.';
    mockGenerateContent.mockResolvedValueOnce({ text: 'Single combined output.' });
    const result = await svc.processText(text, 'narrate');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const sentPrompt = mockGenerateContent.mock.calls[0][0].contents as string;
    expect(sentPrompt).toContain(text);
    expect(result.text).toBe('Single combined output.');
  });
});
