# PowerShell script to bundle Piper binary for Windows CI builds
param(
    [Parameter(Mandatory=$true)]
    [string]$Platform,

    [Parameter(Mandatory=$true)]
    [string]$Arch
)

$ErrorActionPreference = "Stop"

$OUTPUT_DIR = "packages/electron/resources/piper"
$VOICE = "en_US-amy-medium"

# Map platform+arch to download URL
$key = "$Platform-$Arch"
switch ($key) {
    "darwin-arm64" { $BINARY_KEY = "piper_macos_aarch64"; $EXT = "tar.gz" }
    "darwin-x64"   { $BINARY_KEY = "piper_macos_x64"; $EXT = "tar.gz" }
    "win32-x64"    { $BINARY_KEY = "piper_windows_amd64"; $EXT = "zip" }
    "linux-x64"    { $BINARY_KEY = "piper_linux_x86_64"; $EXT = "tar.gz" }
    "linux-arm64"  { $BINARY_KEY = "piper_linux_aarch64"; $EXT = "tar.gz" }
    default {
        Write-Error "Unsupported: $Platform-$Arch"
        exit 1
    }
}

# Use /latest/download/ for reliability
$BINARY_URL = "https://github.com/rhasspy/piper/releases/latest/download/$BINARY_KEY.$EXT"

# Clean and create output directory
if (Test-Path $OUTPUT_DIR) {
    Remove-Item -Recurse -Force $OUTPUT_DIR
}
New-Item -ItemType Directory -Force -Path "$OUTPUT_DIR/models" | Out-Null

# Download binary
Write-Host "Downloading Piper binary: $BINARY_KEY..."
$tempFile = "$env:TEMP/piper.$EXT"
try {
    Invoke-WebRequest -Uri $BINARY_URL -OutFile $tempFile -TimeoutSec 300 -ErrorAction Stop
} catch {
    Write-Error "Failed to download Piper binary from $BINARY_URL : $_"
    exit 1
}

# Extract binary
if ($EXT -eq "tar.gz") {
    # Use tar (available in Windows 10+)
    tar -xzf $tempFile -C $OUTPUT_DIR --strip-components=1
} elseif ($EXT -eq "zip") {
    Expand-Archive -Path $tempFile -DestinationPath $OUTPUT_DIR -Force
    # Move files from nested directory if needed
    if (Test-Path "$OUTPUT_DIR/piper") {
        Get-ChildItem -Path "$OUTPUT_DIR/piper" | Move-Item -Destination $OUTPUT_DIR
        Remove-Item -Path "$OUTPUT_DIR/piper" -Recurse
    }
}

# Download default voice model
Write-Host "Downloading voice model: $VOICE..."
$VOICE_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium"
try {
    Invoke-WebRequest -Uri "$VOICE_BASE/$VOICE.onnx" -OutFile "$OUTPUT_DIR/models/$VOICE.onnx" -TimeoutSec 300 -ErrorAction Stop
    Invoke-WebRequest -Uri "$VOICE_BASE/$VOICE.onnx.json" -OutFile "$OUTPUT_DIR/models/$VOICE.onnx.json" -TimeoutSec 300 -ErrorAction Stop
} catch {
    Write-Error "Failed to download voice model: $_"
    # Cleanup partial downloads
    Remove-Item -Path "$OUTPUT_DIR/models/$VOICE.onnx" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$OUTPUT_DIR/models/$VOICE.onnx.json" -Force -ErrorAction SilentlyContinue
    exit 1
}

# Verify bundled binary exists
$expectedBinary = if ($Platform -eq "win32") { "piper.exe" } else { "piper" }
if (-not (Test-Path "$OUTPUT_DIR/$expectedBinary")) {
    Write-Error "Piper binary not found at $OUTPUT_DIR/$expectedBinary"
    exit 1
}

Write-Host "Bundle complete: $OUTPUT_DIR"
Get-ChildItem -Path $OUTPUT_DIR
