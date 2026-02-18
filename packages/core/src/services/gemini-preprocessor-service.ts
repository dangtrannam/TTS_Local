import { GoogleGenAI } from '@google/genai';
import { TTSError, TTSErrorCode } from '@tts-local/types';

export type PreprocessMode = 'narrate' | 'summarize';

export type PreprocessResult = { text: string; fallback: boolean; error?: Error };

const DEFAULT_MODEL = 'gemini-2.0-flash';
const MAX_CHUNK_CHARS = 4000;

const PROMPTS: Record<PreprocessMode, string> = {
  narrate: `Convert the following document to natural spoken prose for text-to-speech playback.
Rules:
- Remove ALL markdown formatting (##, **, *, \`code\`, [], (), ---)
- Convert code blocks to plain English descriptions (e.g. "a function that does X")
- Convert bullet lists and numbered lists to flowing sentences
- Convert tables to natural prose sentences
- Replace URLs with their link text only, or omit if no text
- Preserve ALL information and meaning
- Write as if dictating clearly to a listener who cannot see the document
- Do not add commentary, preamble, or "Here is the narration:" prefix

Document:
{content}`,

  summarize: `Summarize the following document into 2 to 3 concise paragraphs suitable for text-to-speech playback.
Rules:
- Write in natural conversational prose, no markdown
- Include only the most important information
- Sound natural when read aloud
- Do not add commentary or "Here is the summary:" prefix

Document:
{content}`,
};

export class GeminiPreprocessorService {
  private readonly apiKey: string;
  private readonly model: string;
  private client: GoogleGenAI | null = null;

  constructor(apiKey?: string, model = DEFAULT_MODEL) {
    this.apiKey = apiKey ?? process.env['GEMINI_API_KEY'] ?? '';
    this.model = model;
  }

  /** Process text through Gemini AI. Returns original text (fallback) if Gemini fails. */
  async processText(text: string, mode: PreprocessMode): Promise<PreprocessResult> {
    this.validateApiKey();
    const chunks = this.chunkText(text);
    const results: string[] = [];
    try {
      for (const chunk of chunks) {
        results.push(await this.callGemini(chunk, mode));
      }
      return { text: results.join('\n\n'), fallback: false };
    } catch (error) {
      return {
        text,
        fallback: true,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private validateApiKey(): void {
    if (!this.apiKey) {
      throw new TTSError(
        TTSErrorCode.GEMINI_API_KEY_MISSING,
        'GEMINI_API_KEY environment variable is not set. ' +
          'Get a key at https://aistudio.google.com/ and set: export GEMINI_API_KEY=your_key',
      );
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  /** Split text at ## / ### headers; sub-split oversized sections at blank lines. */
  private chunkText(text: string): string[] {
    const sections = text.split(/(?=^#{2,3} )/m).filter((s) => s.trim());
    const chunks: string[] = [];
    for (const section of sections) {
      if (section.length <= MAX_CHUNK_CHARS) {
        chunks.push(section);
      } else {
        const parts = section.split(/\n\n+/).filter((p) => p.trim());
        let current = '';
        for (const part of parts) {
          if (current.length + part.length > MAX_CHUNK_CHARS && current) {
            chunks.push(current.trim());
            current = part;
          } else {
            current = current ? `${current}\n\n${part}` : part;
          }
        }
        if (current.trim()) chunks.push(current.trim());
      }
    }
    return chunks.length > 0 ? chunks : [text];
  }

  private async callGemini(chunk: string, mode: PreprocessMode): Promise<string> {
    const prompt = PROMPTS[mode].replace('{content}', chunk);
    try {
      const response = await this.getClient().models.generateContent({
        model: this.model,
        contents: prompt,
      });
      const responseText = response.text;
      if (!responseText || responseText.trim() === '') {
        throw new TTSError(TTSErrorCode.PREPROCESS_FAILED, 'Gemini returned empty response');
      }
      return responseText;
    } catch (cause) {
      throw new TTSError(
        TTSErrorCode.PREPROCESS_FAILED,
        `Gemini preprocessing failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause instanceof Error ? cause : undefined,
      );
    }
  }
}
