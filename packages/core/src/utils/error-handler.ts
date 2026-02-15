import { TTSError, TTSErrorCode } from '@tts-local/types';

export { TTSError, TTSErrorCode } from '@tts-local/types';

/** Map error codes to user-friendly messages with suggested fixes */
const ERROR_MESSAGES: Record<TTSErrorCode, string> = {
  [TTSErrorCode.BINARY_NOT_FOUND]: "Piper binary not found. Run 'tts setup' to download.",
  [TTSErrorCode.BINARY_DOWNLOAD_FAILED]:
    'Failed to download Piper binary. Check your internet connection.',
  [TTSErrorCode.BINARY_PERMISSION_DENIED]:
    'Permission denied executing Piper binary. Check file permissions.',
  [TTSErrorCode.BINARY_GATEKEEPER_BLOCKED]:
    "macOS blocked the Piper binary. We'll fix this automatically.",
  [TTSErrorCode.BINARY_CORRUPT]:
    "Piper binary is corrupted. Delete it and run 'tts setup' to re-download.",
  [TTSErrorCode.MODEL_NOT_FOUND]: "Voice model not installed. Run 'tts setup' to download.",
  [TTSErrorCode.MODEL_DOWNLOAD_FAILED]:
    'Failed to download voice model. Check your internet connection.',
  [TTSErrorCode.MODEL_CORRUPT]:
    "Voice model file is corrupted. Delete it and run 'tts setup' to re-download.",
  [TTSErrorCode.SYNTHESIS_FAILED]: 'Speech synthesis failed. Check input text and try again.',
  [TTSErrorCode.SYNTHESIS_TIMEOUT]:
    'Synthesis timed out. Try with shorter text or increase timeout.',
  [TTSErrorCode.EMPTY_TEXT]: 'Cannot synthesize empty text.',
  [TTSErrorCode.TEXT_TOO_LONG]: 'Text exceeds maximum length (100,000 characters).',
  [TTSErrorCode.UNSUPPORTED_PLATFORM]: 'This platform is not supported by Piper TTS.',
  [TTSErrorCode.NETWORK_ERROR]: 'Download failed. Check your internet connection.',
};

/** Format a TTSError into a human-readable message with suggested fix */
export function formatErrorForUser(error: TTSError): string {
  return ERROR_MESSAGES[error.code] || error.message;
}
