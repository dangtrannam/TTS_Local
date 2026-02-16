#!/usr/bin/env bash
# Mock Piper binary for integration tests
# Reads stdin, outputs a valid WAV file to stdout

# Read all input from stdin (simulating text processing)
input=$(cat)

# Generate a simple WAV header + data (1 second of silence at 22050 Hz, 16-bit, mono)
# RIFF header
printf 'RIFF'
printf '\x2e\xb1\x00\x00'  # ChunkSize (45870 bytes total - 8)
printf 'WAVE'

# fmt chunk
printf 'fmt '
printf '\x10\x00\x00\x00'  # Subchunk1Size (16 for PCM)
printf '\x01\x00'          # AudioFormat (1 = PCM)
printf '\x01\x00'          # NumChannels (1 = mono)
printf '\x22\x56\x00\x00'  # SampleRate (22050)
printf '\x44\xac\x00\x00'  # ByteRate (44100)
printf '\x02\x00'          # BlockAlign (2)
printf '\x10\x00'          # BitsPerSample (16)

# data chunk
printf 'data'
printf '\x0a\xb1\x00\x00'  # Subchunk2Size (45834 bytes of data)

# Output silence (zeros) for data
dd if=/dev/zero bs=45834 count=1 2>/dev/null

exit 0
