# Codebase Summary

**Project**: TTS_Local - Cross-platform Text-to-Speech Application
**Version**: 0.1.0
**Last Updated**: 2026-02-16
**Status**: Phase 04 Complete (Electron Desktop Application)

---

## Project Overview

TTS_Local is a local-first, privacy-focused text-to-speech application built with TypeScript. It uses Piper TTS for high-quality neural voice synthesis without cloud dependencies. The project follows a monorepo architecture using pnpm workspaces.

**Key Features:**
- Offline TTS using Piper neural voices
- Cross-platform support (macOS, Windows, Linux)
- CLI and Electron desktop interfaces
- Automatic binary and voice model management
- Type-safe architecture with shared types

---

## Monorepo Structure

```
TTS_Local/
├── packages/
│   ├── core/           # Piper TTS implementation (Phase 02 ✅)
│   ├── types/          # Shared TypeScript types (Phase 02 ✅)
│   ├── cli/            # CLI application (Phase 03 ✅)
│   └── electron/       # Electron desktop GUI (Phase 04 ✅)
├── docs/               # Project documentation
├── plans/              # Development plans and reports
└── .github/workflows/  # CI/CD configuration
```

---

## Package Details

### @tts-local/core

**Status**: Implemented (Phase 02)
**Dependencies**: execa@9.6.1, fs-extra@11.3.3, tar@7.5.7

**Directory Structure:**
```
packages/core/src/
├── services/              # Core TTS services
│   ├── piper-tts-service.ts       # Main API entry point
│   ├── piper-binary-manager.ts    # Binary download/management
│   ├── piper-voice-manager.ts     # Voice model management
│   └── piper-process-runner.ts    # Process execution
├── utils/                 # Utility modules
│   ├── platform-detector.ts       # OS/arch detection
│   ├── platform-paths.ts          # XDG-compliant paths
│   ├── download-helper.ts         # HTTP download/extraction
│   ├── audio-utils.ts             # WAV parsing
│   └── error-handler.ts           # Error formatting
├── config/
│   └── default-config.ts          # Constants and defaults
└── index.ts                       # Public API exports
```

**Public API:**
- `PiperTTSService` - Main TTS service class
- `PiperBinaryManager` - Binary lifecycle management
- `PiperVoiceManager` - Voice model lifecycle management
- Utility functions: `getAppPaths()`, `detectPlatform()`, `formatErrorForUser()`

**Key Implementation Details:**
- Singleton pattern for services
- Async/await throughout
- Stream-based audio processing
- Platform-specific binary selection
- Automatic resource management

### @tts-local/types

**Status**: Implemented (Phase 02)
**Dependencies**: None (pure types)

**Type Definitions:**
```typescript
// TTS API
TTSOptions        // Input options (voice, speed, output)
TTSResult         // Output (audio buffer, duration, sampleRate)
SynthesisProgress // Progress callbacks

// Configuration
PiperConfig       // Engine configuration
PlatformInfo      // Detected platform metadata
DownloadProgress  // Download progress callbacks

// Error handling
TTSErrorCode      // Enum of error types
TTSError          // Custom error class
```

### @tts-local/cli

**Status**: Implemented (Phase 03 ✅)
**Dependencies**: commander@11.1.0, chalk@5.3.0, ora@8.0.0, @tts-local/core, @tts-local/types

**Directory Structure:**
```
packages/cli/src/
├── bin.ts                          # Node shebang entry point
├── index.ts                        # Commander program factory
├── commands/                       # Command handlers
│   ├── speak-command.ts           # Synthesize and play/save audio
│   ├── setup-command.ts           # Download binary and models
│   ├── voices-command.ts          # List installed voices
│   └── config-command.ts          # Manage configuration
└── utils/                         # Utility modules
    ├── cli-output.ts              # Unified output formatting
    ├── input-reader.ts            # stdin/file/argument input
    ├── audio-player.ts            # Platform-aware audio playback
    └── config-manager.ts          # JSON config CRUD
```

**Public API:**
- `createCliProgram()` - Create Commander.js program with all commands
- **Commands**: speak, setup, voices, config
- **Features**: Multiple input modes (text/file/stdin), audio playback, config management, progress callbacks

**Key Implementation Details:**
- Platform-aware audio playback (afplay on macOS, paplay/aplay/ffplay on Linux, PowerShell on Windows)
- Configuration stored at `~/.config/tts-local/config.json` (XDG-compliant)
- 18 CLI-specific error codes with user-friendly messages
- File path sanitization and stdin size limits for security
- Graceful cleanup on Ctrl+C with SIGINT handlers

### @tts-local/electron

**Status**: Implemented (Phase 04 ✅)
**Dependencies**: electron@35.2.0, electron-vite@2.3.0, react@18.3.1, react-dom@18.3.1, @tts-local/core, @tts-local/types

**Directory Structure:**
```
packages/electron/src/
├── main/
│   ├── index.ts              # App lifecycle, BrowserWindow, security setup
│   ├── ipc-handlers.ts       # TTS IPC handler registration
│   ├── ipc-validator.ts      # Runtime schema validation for IPC messages
│   ├── security-config.ts    # CSP headers, permission handlers
│   └── tray-manager.ts       # System tray icon management
├── preload/
│   └── index.ts              # contextBridge: exposes window.ttsAPI
└── renderer/
    ├── index.tsx             # React entry point
    ├── App.tsx               # Root layout, keyboard shortcuts
    ├── index.html            # HTML shell
    ├── styles/global.css     # Global styles
    ├── components/
    │   ├── status-indicator.tsx   # Synthesis/error status display
    │   ├── text-input-panel.tsx   # Text input (max 100K chars)
    │   ├── playback-controls.tsx  # Play/stop buttons
    │   ├── settings-panel.tsx     # Voice/speed settings modal
    │   └── setup-wizard.tsx       # First-run initialization UI
    └── hooks/
        ├── use-tts.ts             # TTS state machine hook
        └── use-audio-player.ts    # Web Audio API playback hook
```

**Security Hardening:**
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` on all windows
- CSP headers: `default-src 'none'; script-src 'self'` block external resources
- All permissions denied via session permission handler
- IPC channels whitelisted in preload; data cloned with `structuredClone()`
- Runtime IPC schema validation rejects malformed inputs
- External URL navigation and new window creation blocked

**IPC API (window.ttsAPI):**
- `synthesize(text, options?)` - Returns ArrayBuffer (WAV audio)
- `isReady()` - Check TTS system readiness
- `setup()` - Initialize with download progress events
- `listVoices()` - Returns VoiceInfo[] of installed models
- `getConfig()` - Get current TTS configuration
- `onProgress(callback)` - Subscribe to synthesis progress (returns cleanup fn)
- `onSetupProgress(callback)` - Subscribe to download progress (returns cleanup fn)

---

## Architecture Patterns

### Service Layer
- **PiperTTSService**: Orchestrates binary, voice, and process management
- **PiperBinaryManager**: Handles binary download, extraction, permissions
- **PiperVoiceManager**: Handles voice model download and caching
- **PiperProcessRunner**: Spawns and manages Piper subprocess

### Resource Management
- Platform-specific paths: `~/.local/share/tts-local/` (Linux), `~/Library/Application Support/tts-local/` (macOS), `%APPDATA%/tts-local/` (Windows)
- Binary storage: `{appData}/bin/piper/`
- Voice models: `{appData}/models/{voice_name}/`
- Version tracking with `.version` files

### Error Handling
- Custom `TTSError` class with typed error codes
- User-friendly error formatting via `formatErrorForUser()`
- Structured error propagation (code + message + cause)

### Platform Support
- Automatic OS/arch detection (darwin/win32/linux, x64/arm64)
- Platform-specific binary URLs from GitHub releases
- Gatekeeper workarounds for unsigned macOS binaries
- Executable permissions handling (chmod +x)

---

## Dependencies

### Production Dependencies
| Package | Version | Purpose | Used By |
|---------|---------|---------|---------|
| execa | 9.6.1 | Process spawning | @tts-local/core, @tts-local/cli |
| fs-extra | 11.3.3 | File operations | @tts-local/core, @tts-local/cli |
| tar | 7.5.7 | Archive extraction | @tts-local/core |
| commander | 11.1.0 | CLI framework | @tts-local/cli |
| chalk | 5.3.0 | Terminal colors | @tts-local/cli |
| ora | 8.0.0 | Progress spinners | @tts-local/cli |
| electron | 35.2.0 | Desktop framework | @tts-local/electron |
| electron-vite | 2.3.0 | Vite-based build for Electron | @tts-local/electron |
| react | 18.3.1 | UI renderer | @tts-local/electron |
| react-dom | 18.3.1 | React DOM bindings | @tts-local/electron |

### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.4.0 | Type checking |
| vitest | 2.1.0 | Testing framework |
| eslint | 8.57.0 | Linting |
| prettier | 3.2.0 | Code formatting |
| husky | 9.1.0 | Git hooks |

---

## Build System

### TypeScript Configuration
- **Base Config**: `tsconfig.base.json` (strict mode, ES2022 target)
- **Project References**: Workspace dependencies use TS project references
- **Output**: ESM modules, preserving source structure

### Scripts
```bash
pnpm build         # Build all packages
pnpm type-check    # Type check all packages
pnpm lint          # Lint all packages
pnpm format        # Format all packages
pnpm test          # Run tests
```

### CI/CD
- **Platform**: GitHub Actions (`.github/workflows/ci.yml`)
- **Checks**: Lint, type-check, build, test
- **Pre-commit**: Lint-staged with ESLint + Prettier

---

## Implementation Status

| Phase | Status | Details |
|-------|--------|---------|
| Phase 01 | ✅ Complete | Monorepo setup, tooling, workspace config |
| Phase 02 | ✅ Complete | Piper TTS core implementation |
| Phase 03 | ✅ Complete | CLI application with 4 commands and utilities |
| Phase 04 | ✅ Complete | Electron desktop app with React UI and security hardening |
| Phase 05 | ⏳ Pending | Testing and documentation |

**Cumulative Progress**: ~80 hours of 136 total hours = 59% complete

---

## Code Quality Standards

### File Organization
- Services: Business logic and orchestration
- Utils: Pure functions, no side effects
- Config: Constants and configuration builders
- Max file size: ~200 LOC (current files comply)

### Naming Conventions
- Files: kebab-case (e.g., `piper-tts-service.ts`)
- Classes: PascalCase (e.g., `PiperTTSService`)
- Functions: camelCase (e.g., `detectPlatform`)
- Types: PascalCase (e.g., `TTSOptions`)
- Constants: UPPER_SNAKE_CASE (e.g., `PIPER_VERSION`)

### TypeScript Standards
- Strict mode enabled
- Explicit return types on public APIs
- Readonly properties where appropriate
- Avoid `any` (use `unknown` or proper types)

---

## External Resources

### Piper TTS
- **Binary Releases**: `https://github.com/rhasspy/piper/releases/download/{version}/`
- **Voice Models**: `https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/`
- **Current Version**: 2023.11.14-2

### Voice Model Naming
Format: `{lang}_{region}-{name}-{quality}`
Example: `en_US-amy-medium`

Parsed as:
- Language: `en`
- Region: `en_US`
- Name: `amy`
- Quality: `medium`

---

## Next Steps

1. **Phase 05**: Testing and finalization
   - Unit tests (Vitest) for core services
   - Integration tests for full synthesis pipeline
   - E2E tests (Playwright) for Electron app
   - Platform-specific testing matrix (macOS/Linux/Windows)
   - 80%+ test coverage target

---

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `packages/core/src/index.ts` | Public API exports | 21 |
| `packages/core/src/services/piper-tts-service.ts` | Main TTS service | ~200 |
| `packages/core/src/services/piper-binary-manager.ts` | Binary management | ~180 |
| `packages/core/src/services/piper-voice-manager.ts` | Voice management | ~150 |
| `packages/core/src/services/piper-process-runner.ts` | Process execution | ~120 |
| `packages/types/src/tts-types.ts` | TTS type definitions | 65 |
| `packages/types/src/error-types.ts` | Error types | 28 |

---

## Key Files Reference (Electron)

| File | Purpose |
|------|---------|
| `packages/electron/src/main/index.ts` | App lifecycle, window creation, security setup |
| `packages/electron/src/main/ipc-handlers.ts` | IPC handler registration (6 channels) |
| `packages/electron/src/main/ipc-validator.ts` | Runtime schema validation |
| `packages/electron/src/main/security-config.ts` | CSP headers, session permissions |
| `packages/electron/src/main/tray-manager.ts` | System tray icon management |
| `packages/electron/src/preload/index.ts` | contextBridge: window.ttsAPI exposure |
| `packages/electron/src/renderer/App.tsx` | Root React component |
| `packages/electron/src/renderer/hooks/use-tts.ts` | TTS state machine |
| `packages/electron/src/renderer/hooks/use-audio-player.ts` | Web Audio API playback |

---

**Generation Notes:**
- Updated 2026-02-16 for Phase 04 (Electron Desktop) completion
- Total packages: 4 (core, types, cli, electron)
- Electron: 20 new files across main/preload/renderer
