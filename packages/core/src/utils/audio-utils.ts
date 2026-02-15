/** WAV header metadata */
export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  duration: number;
  dataSize: number;
}

const RIFF_MAGIC = 0x52494646; // 'RIFF'
const WAVE_MAGIC = 0x57415645; // 'WAVE'

/** Check if buffer starts with valid RIFF/WAVE header */
export function isValidWav(buffer: Buffer): boolean {
  if (buffer.length < 44) return false;
  return buffer.readUInt32BE(0) === RIFF_MAGIC && buffer.readUInt32BE(8) === WAVE_MAGIC;
}

/** Parse WAV header to extract audio metadata */
export function parseWavHeader(buffer: Buffer): WavInfo {
  if (!isValidWav(buffer)) {
    throw new Error('Invalid WAV data: missing RIFF/WAVE header');
  }

  // Find 'fmt ' sub-chunk
  let offset = 12;
  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      const channels = buffer.readUInt16LE(offset + 10);
      const sampleRate = buffer.readUInt32LE(offset + 12);
      const bitDepth = buffer.readUInt16LE(offset + 22);

      // Find 'data' sub-chunk for size
      let dataOffset = offset + 8 + chunkSize;
      while (dataOffset < buffer.length - 8) {
        const dataChunkId = buffer.toString('ascii', dataOffset, dataOffset + 4);
        const dataChunkSize = buffer.readUInt32LE(dataOffset + 4);
        if (dataChunkId === 'data') {
          const duration = dataChunkSize / (sampleRate * channels * (bitDepth / 8));
          return { sampleRate, channels, bitDepth, duration, dataSize: dataChunkSize };
        }
        dataOffset += 8 + dataChunkSize;
      }

      // No data chunk found, estimate from buffer size
      const dataSize = buffer.length - 44;
      const duration = dataSize / (sampleRate * channels * (bitDepth / 8));
      return { sampleRate, channels, bitDepth, duration, dataSize };
    }

    offset += 8 + chunkSize;
  }

  throw new Error('Invalid WAV data: missing fmt chunk');
}

/** Get audio duration in seconds from WAV buffer */
export function getAudioDuration(buffer: Buffer): number {
  return parseWavHeader(buffer).duration;
}
