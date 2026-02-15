import type { PiperConfig } from '@tts-local/types';

export const PIPER_VERSION = '2023.11.14-2';
export const PIPER_DOWNLOAD_BASE = 'https://github.com/rhasspy/piper/releases/download';
export const PIPER_VOICES_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0';

export const MAX_TEXT_LENGTH = 100_000;

export const DEFAULT_CONFIG: Omit<PiperConfig, 'binaryPath' | 'modelsDir'> = {
  defaultVoice: 'en_US-amy-medium',
  defaultSpeed: 1.0,
  synthesisTimeout: 30_000,
};

/** Build download URL for a Piper binary release */
export function getPiperBinaryUrl(platformKey: string): string {
  const ext = platformKey.startsWith('windows') ? '.zip' : '.tar.gz';
  return `${PIPER_DOWNLOAD_BASE}/${PIPER_VERSION}/piper_${platformKey}${ext}`;
}

/**
 * Build download URLs for a voice model from HuggingFace.
 * Voice naming: {lang}_{region}-{name}-{quality}
 * e.g. en_US-amy-medium -> en/en_US/amy/medium/
 */
export function getVoiceModelUrls(voiceName: string): { onnx: string; config: string } {
  // Parse voice name: en_US-amy-medium
  const parts = voiceName.split('-');
  if (parts.length < 3) {
    throw new Error(
      `Invalid voice name format: ${voiceName}. Expected: {lang}_{region}-{name}-{quality}`,
    );
  }

  const langRegion = parts[0]; // en_US
  const lang = langRegion.split('_')[0]; // en
  const name = parts[1]; // amy
  const quality = parts[2]; // medium

  const basePath = `${PIPER_VOICES_BASE}/${lang}/${langRegion}/${name}/${quality}`;
  return {
    onnx: `${basePath}/${langRegion}-${name}-${quality}.onnx`,
    config: `${basePath}/${langRegion}-${name}-${quality}.onnx.json`,
  };
}
