# System Architecture

**Project**: TTS_Local
**Last Updated**: 2026-02-15
**Phase**: Phase 02 Complete (Piper TTS Core)

---

## Overview

TTS_Local uses a layered architecture with clear separation between services, utilities, and configuration. The system follows a local-first design with no cloud dependencies.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│         (CLI / Electron - Not Yet Implemented)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (@tts-local/core)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PiperTTSService (Main API)                │ │
│  │  - synthesize(text, options) -> TTSResult              │ │
│  │  - Orchestrates binary, voice, process management      │ │
│  └──────┬───────────────────────────┬─────────────────────┘ │
│         │                           │                        │
│         ▼                           ▼                        │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ PiperBinaryMgr   │      │ PiperVoiceMgr    │            │
│  │ - ensureBinary() │      │ - ensureVoice()  │            │
│  │ - download()     │      │ - download()     │            │
│  │ - verify()       │      │ - verify()       │            │
│  └──────────────────┘      └──────────────────┘            │
│         │                           │                        │
│         └───────────┬───────────────┘                        │
│                     ▼                                        │
│         ┌────────────────────────┐                          │
│         │  PiperProcessRunner    │                          │
│         │  - run(text, config)   │                          │
│         │  - spawn child process │                          │
│         │  - parse WAV output    │                          │
│         └────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Utility Layer (@tts-local/core/utils)       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Platform     │  │ Download     │  │ Audio        │      │
│  │ Detector     │  │ Helper       │  │ Utils        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Platform     │  │ Error        │  │              │      │
│  │ Paths        │  │ Handler      │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Type Layer (@tts-local/types)                │
│  TTSOptions | TTSResult | PiperConfig | PlatformInfo        │
│  TTSError | TTSErrorCode | DownloadProgress                 │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Resources                         │
│  GitHub: Piper binaries | HuggingFace: Voice models          │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Service Layer

#### PiperTTSService
**Role**: Main API entry point and orchestrator

**Responsibilities:**
- Accept synthesis requests via `synthesize(text, options)`
- Coordinate binary and voice model management
- Delegate process execution to PiperProcessRunner
- Handle errors and provide user-friendly messages

**Key Methods:**
```typescript
synthesize(text: string, options?: TTSOptions): Promise<TTSResult>
```

**Internal Flow:**
1. Validate input text (length, non-empty)
2. Ensure binary exists via PiperBinaryManager
3. Ensure voice model exists via PiperVoiceManager
4. Prepare config and execute via PiperProcessRunner
5. Return TTSResult with audio buffer

#### PiperBinaryManager
**Role**: Binary lifecycle management

**Responsibilities:**
- Detect platform (OS, architecture)
- Build download URLs for platform-specific binaries
- Download and extract archives (tar.gz/zip)
- Set executable permissions (chmod +x)
- Handle macOS Gatekeeper issues
- Verify binary integrity
- Track installed version

**Key Methods:**
```typescript
ensureBinary(onProgress?: (p: DownloadProgress) => void): Promise<string>
getBinaryPath(): string
```

**Platform Detection:**
- macOS (Intel): `macos_x64`
- macOS (Apple Silicon): `macos_aarch64`
- Windows: `windows_amd64`
- Linux (x64): `linux_x64`
- Linux (ARM64): `linux_aarch64`

#### PiperVoiceManager
**Role**: Voice model lifecycle management

**Responsibilities:**
- Download voice models from HuggingFace
- Cache models in platform-specific directory
- Download both `.onnx` (model) and `.onnx.json` (config)
- Verify model integrity (file size, JSON parsing)
- Track installed models

**Key Methods:**
```typescript
ensureVoice(voiceName: string, onProgress?: (p: DownloadProgress) => void): Promise<VoicePaths>
```

**Voice Naming Convention:**
```
{lang}_{region}-{name}-{quality}
Example: en_US-amy-medium

Parsed as:
- Language: en
- Region: en_US
- Name: amy
- Quality: medium

Download path:
https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/
  en/en_US/amy/medium/en_US-amy-medium.onnx
```

#### PiperProcessRunner
**Role**: Subprocess execution and audio parsing

**Responsibilities:**
- Spawn Piper binary as child process
- Pass text via stdin
- Capture WAV audio from stdout
- Parse WAV headers to extract metadata
- Handle process errors and timeouts
- Clean up resources on completion/failure

**Key Methods:**
```typescript
run(text: string, config: RunConfig): Promise<TTSResult>
```

**Process Flow:**
1. Spawn `execa(binaryPath, args)`
2. Write text to stdin
3. Read WAV data from stdout
4. Parse WAV header (sample rate, duration)
5. Return audio buffer + metadata

---

### Utility Layer

#### platform-detector.ts
**Purpose**: OS and architecture detection

**Exports:**
```typescript
detectPlatform(): PlatformInfo
```

**Output Fields:**
- `os`: darwin | win32 | linux
- `arch`: x64 | arm64
- `piperPlatformKey`: e.g., "macos_x64", "linux_aarch64"
- `binaryExtension`: "" or ".exe"
- `archiveFormat`: "tar.gz" or "zip"
- `needsGatekeeperFix`: true on macOS
- `needsChmodExecutable`: true on Unix-like

#### platform-paths.ts
**Purpose**: XDG-compliant app data paths

**Exports:**
```typescript
getAppPaths(): { data: string, bin: string, models: string }
```

**Paths by Platform:**
- **macOS**: `~/Library/Application Support/tts-local/`
- **Linux**: `~/.local/share/tts-local/`
- **Windows**: `%APPDATA%/tts-local/`

**Subdirectories:**
- `bin/`: Binary storage
- `models/`: Voice model cache

#### download-helper.ts
**Purpose**: HTTP downloads and archive extraction

**Exports:**
```typescript
downloadFile(url: string, dest: string, onProgress?: (p: DownloadProgress) => void): Promise<void>
extractTarGz(archivePath: string, destDir: string): Promise<void>
extractZip(archivePath: string, destDir: string): Promise<void>
```

**Features:**
- Progress callbacks with byte counts and percentages
- Stream-based downloads (no in-memory buffering)
- Native tar/zip extraction

#### audio-utils.ts
**Purpose**: WAV file parsing

**Exports:**
```typescript
parseWavHeader(buffer: Buffer): { sampleRate: number, channels: number, bitsPerSample: number, dataSize: number }
calculateWavDuration(buffer: Buffer): number
```

**Implementation:**
- Reads RIFF/WAV headers
- Extracts sample rate, channels, bit depth
- Calculates duration from data chunk size

#### error-handler.ts
**Purpose**: User-friendly error formatting

**Exports:**
```typescript
formatErrorForUser(error: TTSError | Error): string
```

**Error Messages:**
- Maps `TTSErrorCode` to actionable messages
- Includes troubleshooting steps
- Formats stack traces for debugging

---

### Configuration Layer

#### default-config.ts
**Purpose**: Constants and URL builders

**Exports:**
```typescript
PIPER_VERSION = '2023.11.14-2'
PIPER_DOWNLOAD_BASE = 'https://github.com/rhasspy/piper/releases/download'
PIPER_VOICES_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0'
MAX_TEXT_LENGTH = 100_000
DEFAULT_CONFIG: Omit<PiperConfig, 'binaryPath' | 'modelsDir'>

getPiperBinaryUrl(platformKey: string): string
getVoiceModelUrls(voiceName: string): { onnx: string, config: string }
```

---

## Data Flow

### Synthesis Request Flow

```
User Request
    │
    ▼
PiperTTSService.synthesize(text, options)
    │
    ├─► Validate text (length, non-empty)
    │
    ├─► PiperBinaryManager.ensureBinary()
    │       │
    │       ├─► Check if binary exists
    │       ├─► Download if missing (GitHub)
    │       ├─► Extract archive
    │       ├─► Set permissions (chmod +x)
    │       └─► Return binary path
    │
    ├─► PiperVoiceManager.ensureVoice(voiceName)
    │       │
    │       ├─► Check if voice exists
    │       ├─► Download if missing (HuggingFace)
    │       │       ├─► Download .onnx (model)
    │       │       └─► Download .onnx.json (config)
    │       └─► Return voice paths
    │
    ├─► Build PiperProcessRunner config
    │       │
    │       ├─► binaryPath
    │       ├─► modelPath
    │       ├─► speed (default 1.0)
    │       └─► timeout (default 30s)
    │
    └─► PiperProcessRunner.run(text, config)
            │
            ├─► Spawn Piper subprocess
            ├─► Write text to stdin
            ├─► Read WAV from stdout
            ├─► Parse WAV header
            └─► Return TTSResult { audio, duration, sampleRate }
```

---

## Error Handling Strategy

### Error Types (TTSErrorCode)

| Code | Trigger | Recovery |
|------|---------|----------|
| `BINARY_NOT_FOUND` | Binary missing after download | Re-download |
| `BINARY_DOWNLOAD_FAILED` | Network error, 404 | Retry or check platform |
| `BINARY_PERMISSION_DENIED` | chmod failed | Manual chmod |
| `BINARY_GATEKEEPER_BLOCKED` | macOS quarantine | Manual xattr removal |
| `MODEL_NOT_FOUND` | Voice model missing | Re-download |
| `MODEL_DOWNLOAD_FAILED` | Network error, 404 | Retry or check voice name |
| `SYNTHESIS_FAILED` | Piper process error | Check logs |
| `SYNTHESIS_TIMEOUT` | Process exceeded timeout | Reduce text length |
| `EMPTY_TEXT` | Empty input | Provide text |
| `TEXT_TOO_LONG` | Text > 100k chars | Split text |
| `UNSUPPORTED_PLATFORM` | Unknown OS/arch | Update platform detection |
| `NETWORK_ERROR` | HTTP failure | Check connectivity |

### Error Propagation

```
Error Source (e.g., network failure)
    │
    ▼
Throw TTSError(code, message, cause?)
    │
    ▼
Catch in PiperTTSService
    │
    ▼
Format via formatErrorForUser()
    │
    ▼
Return user-friendly message
```

---

## Resource Management

### File System Layout

```
{appData}/                          # Platform-specific
├── bin/
│   └── piper/
│       ├── piper                   # Binary
│       └── .version                # Version tracking
├── models/
│   ├── en_US-amy-medium/
│   │   ├── en_US-amy-medium.onnx
│   │   └── en_US-amy-medium.onnx.json
│   └── en_GB-jenny-medium/
│       ├── en_GB-jenny-medium.onnx
│       └── en_GB-jenny-medium.onnx.json
└── logs/                           # Future: logging
```

### Version Tracking

Each downloaded resource has a `.version` file containing the version string. This prevents re-downloads on every run.

**Example:**
```
{appData}/bin/piper/.version → "2023.11.14-2"
```

---

## Security Considerations

### Binary Verification
- SHA256 checksums (future enhancement)
- File size validation
- Execute permissions locked to user only

### macOS Gatekeeper
- Binaries are unsigned (from GitHub)
- macOS quarantines unsigned binaries
- Users must manually allow via `xattr -d com.apple.quarantine {binary}`
- Future: Code signing with Apple Developer ID

### Process Isolation
- Piper runs as separate subprocess
- No shell injection (args passed as array)
- Stdin/stdout pipes (no file temp files)
- Timeout enforcement prevents hangs

### Network Security
- HTTPS only (GitHub, HuggingFace)
- No custom CA certificates
- No credential storage
- Progress callbacks reveal no sensitive data

---

## Performance Characteristics

### Synthesis Latency
- **First run**: 2-5s (binary + model download)
- **Cached**: <100ms (typical for short text)
- **Long text (1000 words)**: 2-3s

### Memory Usage
- **Idle**: ~20MB (Node.js baseline)
- **During synthesis**: +40MB (Piper process)
- **Voice model**: ~10MB per model (in memory during use)

### Disk Usage
- **Binary**: ~40MB (per platform)
- **Voice model**: ~8-12MB (per voice, ONNX format)
- **Total (1 voice)**: ~50MB

---

## Extensibility Points

### Adding New Voices
1. Update voice name in `TTSOptions.voice`
2. `PiperVoiceManager` auto-downloads from HuggingFace
3. No code changes required

### Supporting New Platforms
1. Update `platform-detector.ts` with new OS/arch
2. Add mapping to Piper platform key
3. Update binary URL logic if needed

### Custom Voice Sources
1. Extend `getVoiceModelUrls()` to support custom URLs
2. Add configuration for custom model directories
3. Bypass HuggingFace download if local models exist

### Future Service Integrations
- Add alternative TTS engines (Coqui, VITS)
- Create adapter interface (`ITTSEngine`)
- Implement engine selection in `PiperTTSService`

---

## Testing Strategy (Phase 05)

### Unit Tests
- Utility functions (platform detection, WAV parsing)
- Error formatting
- URL builders

### Integration Tests
- Binary download and extraction
- Voice model download
- Full synthesis pipeline (mocked Piper binary)

### E2E Tests
- Real Piper binary execution
- Multiple voices
- Error scenarios (network failures, timeouts)

### Platform Tests
- CI matrix: macOS, Windows, Linux
- Architecture matrix: x64, arm64

---

## Dependencies Rationale

| Package | Purpose | Alternatives Considered |
|---------|---------|-------------------------|
| execa | Process spawning | child_process (less ergonomic) |
| fs-extra | File operations | fs/promises (missing copy/move) |
| tar | Archive extraction | decompress (larger, less maintained) |

---

## Future Architecture Changes

### Phase 03 (CLI)
- Add Commander.js command routing
- Integrate Inquirer for interactive mode
- Add play-sound for audio playback
- Add config file management

### Phase 04 (Electron)
- Add React renderer
- Add IPC bridge (main ↔ renderer)
- Add Web Audio API integration
- Add update mechanism (electron-updater)

### Phase 05 (Optimization)
- Add binary caching layer
- Add voice model preloading
- Add synthesis queue for batch processing
- Add streaming synthesis (chunked text)

---

**Diagram Generation**: ASCII art created manually
**Last Reviewed**: 2026-02-15
**Next Review**: After Phase 03 CLI implementation
