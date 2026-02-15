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
  // CLI-specific errors
  [TTSErrorCode.NO_INPUT]:
    'No input text provided. Use: tts speak "text", --file <path>, or pipe stdin',
  [TTSErrorCode.INVALID_INPUT]: 'Invalid input provided. Check your input and try again.',
  [TTSErrorCode.FILE_NOT_FOUND]: 'File not found. Check the path and try again.',
  [TTSErrorCode.FILE_READ_ERROR]: 'Failed to read file. Check permissions and try again.',
  [TTSErrorCode.STDIN_TIMEOUT]: 'No data received from stdin. Check your pipe and try again.',
  [TTSErrorCode.STDIN_READ_ERROR]: 'Failed to read from stdin. Check your input.',
  [TTSErrorCode.INPUT_TOO_LARGE]: 'Input text is too large. Maximum is 100,000 characters.',
  [TTSErrorCode.NO_AUDIO_PLAYER]: 'No audio player found. Install one or use --output flag.',
  [TTSErrorCode.PLAYBACK_ERROR]: 'Audio playback failed. Try using --output flag to save to file.',
  [TTSErrorCode.TEMP_FILE_ERROR]: 'Failed to write temporary file. Check disk space.',
  [TTSErrorCode.CONFIG_READ_ERROR]: 'Failed to read configuration file.',
  [TTSErrorCode.CONFIG_WRITE_ERROR]: 'Failed to write configuration file.',
  [TTSErrorCode.CONFIG_RESET_ERROR]: 'Failed to reset configuration.',
  [TTSErrorCode.INVALID_CONFIG]: 'Invalid configuration. Check your settings.',
  [TTSErrorCode.INVALID_CONFIG_KEY]: 'Invalid configuration key. Use: defaultVoice, speed',
  [TTSErrorCode.INVALID_CONFIG_VALUE]: 'Invalid configuration value. Check the allowed range.',
};

/** Format a TTSError into a human-readable message with suggested fix */
export function formatErrorForUser(error: TTSError): string {
  return ERROR_MESSAGES[error.code] || error.message;
}
