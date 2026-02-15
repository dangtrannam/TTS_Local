# Codebase Summary

**Project**: TTS_Local - Cross-platform Text-to-Speech Application
**Version**: 0.1.0
**Last Updated**: 2026-02-15
**Status**: Phase 02 Complete (Piper TTS Core Implementation)

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
│   ├── cli/            # CLI application (Phase 03 pending)
│   └── electron/       # Desktop GUI (Phase 04 pending)
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

**Status**: Skeleton created (Phase 03 pending)
**Purpose**: Command-line interface for TTS operations

### @tts-local/electron

**Status**: Skeleton created (Phase 04 pending)
**Purpose**: Desktop GUI application wrapper

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
| execa | 9.6.1 | Process spawning | @tts-local/core |
| fs-extra | 11.3.3 | File operations | @tts-local/core |
| tar | 7.5.7 | Archive extraction | @tts-local/core |

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
| Phase 03 | ⏳ Pending | CLI application |
| Phase 04 | ⏳ Pending | Electron desktop app |
| Phase 05 | ⏳ Pending | Testing and documentation |

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

1. **Phase 03**: Implement CLI application
   - Commander.js integration
   - Interactive prompts with Inquirer
   - Audio playback with play-sound
   - Configuration management

2. **Phase 04**: Implement Electron desktop app
   - Main process setup
   - Renderer (React UI)
   - IPC bridge via preload script
   - Secure context isolation

3. **Phase 05**: Testing and finalization
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright)
   - Documentation updates

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

**Generation Notes:**
- Based on repomix-output.xml generated 2026-02-15
- Total files analyzed: 44
- Total tokens: 89,800
- Total chars: 240,356
