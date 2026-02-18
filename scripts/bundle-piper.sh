#!/usr/bin/env bash
set -euo pipefail

# Cleanup on error
cleanup() {
  if [ -n "${OUTPUT_DIR:-}" ] && [ -d "${OUTPUT_DIR}" ]; then
    echo "Cleaning up partial download at ${OUTPUT_DIR}"
    rm -rf "${OUTPUT_DIR}"
  fi
  if [ -f "/tmp/piper.${EXT:-tar.gz}" ]; then
    rm -f "/tmp/piper.${EXT}"
  fi
}
trap cleanup EXIT ERR

TARGET_PLATFORM="${1:?Usage: bundle-piper.sh <platform> <arch>}"
TARGET_ARCH="${2:?Usage: bundle-piper.sh <platform> <arch>}"
OUTPUT_DIR="packages/electron/resources/piper"
VOICE="en_US-amy-medium"

# Map platform+arch to download URL
case "${TARGET_PLATFORM}-${TARGET_ARCH}" in
  darwin-arm64)  BINARY_KEY="piper_macos_aarch64"; EXT="tar.gz" ;;
  darwin-x64)    BINARY_KEY="piper_macos_x64"; EXT="tar.gz" ;;
  win32-x64)     BINARY_KEY="piper_windows_amd64"; EXT="zip" ;;
  linux-x64)     BINARY_KEY="piper_linux_x86_64"; EXT="tar.gz" ;;
  linux-arm64)   BINARY_KEY="piper_linux_aarch64"; EXT="tar.gz" ;;
  *)             echo "Unsupported: ${TARGET_PLATFORM}-${TARGET_ARCH}"; exit 1 ;;
esac

# Use /latest/download/ for reliability
BINARY_URL="https://github.com/rhasspy/piper/releases/latest/download/${BINARY_KEY}.${EXT}"

# Clean and create output directory
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/models"

# Download and extract binary
echo "Downloading Piper binary: ${BINARY_KEY}..."
curl -L --fail --connect-timeout 30 --max-time 300 -o "/tmp/piper.${EXT}" "${BINARY_URL}"

if [ "${EXT}" = "tar.gz" ]; then
  tar -xzf "/tmp/piper.${EXT}" -C "${OUTPUT_DIR}" --strip-components=1
elif [ "${EXT}" = "zip" ]; then
  unzip -o "/tmp/piper.${EXT}" -d "${OUTPUT_DIR}"
  # Move files from nested directory if needed
  if [ -d "${OUTPUT_DIR}/piper" ]; then
    mv "${OUTPUT_DIR}/piper"/* "${OUTPUT_DIR}/"
    rmdir "${OUTPUT_DIR}/piper"
  fi
fi

# Download default voice model
echo "Downloading voice model: ${VOICE}..."
VOICE_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium"
curl -L --fail --connect-timeout 30 --max-time 300 -o "${OUTPUT_DIR}/models/${VOICE}.onnx" "${VOICE_BASE}/${VOICE}.onnx"
curl -L --fail --connect-timeout 30 --max-time 300 -o "${OUTPUT_DIR}/models/${VOICE}.onnx.json" "${VOICE_BASE}/${VOICE}.onnx.json"

# Set permissions (Unix only)
if [ "${TARGET_PLATFORM}" != "win32" ]; then
  chmod +x "${OUTPUT_DIR}/piper"
fi

# Verify bundled binary is executable
BINARY_PATH="${OUTPUT_DIR}/$([ "${TARGET_PLATFORM}" = 'win32' ] && echo 'piper.exe' || echo 'piper')"
if [ ! -f "${BINARY_PATH}" ]; then
  echo "ERROR: Piper binary not found at ${BINARY_PATH}"
  exit 1
fi

echo "Bundle complete: ${OUTPUT_DIR}"
ls -la "${OUTPUT_DIR}"

# Disable cleanup trap on success
trap - EXIT ERR
