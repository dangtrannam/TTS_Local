/**
 * Script to generate test fixture WAV files programmatically
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a valid WAV file with 1 second of silence at 22050 Hz, 16-bit, mono
function generateValidWav(): Buffer {
  const sampleRate = 22050;
  const duration = 1; // 1 second
  const numSamples = sampleRate * duration;
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset);
  offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset);
  offset += 4;
  buffer.write('WAVE', offset);
  offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset);
  offset += 4;
  buffer.writeUInt32LE(16, offset);
  offset += 4; // fmt chunk size
  buffer.writeUInt16LE(1, offset);
  offset += 2; // audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, offset);
  offset += 2;
  buffer.writeUInt32LE(sampleRate, offset);
  offset += 4;
  buffer.writeUInt32LE(byteRate, offset);
  offset += 4;
  buffer.writeUInt16LE(blockAlign, offset);
  offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset);
  offset += 2;

  // data chunk
  buffer.write('data', offset);
  offset += 4;
  buffer.writeUInt32LE(dataSize, offset);
  offset += 4;

  // Fill with silence (zeros)
  buffer.fill(0, offset);

  return buffer;
}

// Generate an invalid WAV file with corrupt RIFF header
function generateCorruptWav(): Buffer {
  const buffer = Buffer.alloc(100);
  // Write invalid header
  buffer.write('INVALID', 0);
  buffer.fill(0xff, 7);
  return buffer;
}

// Generate fixtures
const validWav = generateValidWav();
const corruptWav = generateCorruptWav();

writeFileSync(join(__dirname, 'sample.wav'), validWav);
writeFileSync(join(__dirname, 'corrupt.wav'), corruptWav);

console.log('Test fixtures generated successfully');
console.log(`- sample.wav: ${validWav.length} bytes (valid WAV)`);
console.log(`- corrupt.wav: ${corruptWav.length} bytes (invalid WAV)`);
