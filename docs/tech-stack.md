# Tech Stack

**Project**: TTS_Local - Cross-platform Text-to-Speech Application
**Type**: CLI + Electron Desktop Application
**Use Case**: Personal productivity (reading documents, emails, articles)

---

## Core TTS Engine

### Piper TTS
- **Version**: Latest stable
- **Why**: Lightweight (40MB), high-quality neural voices, cross-platform
- **Integration**: Native binary + Node.js child_process wrapper
- **Voice Quality**: ⭐⭐⭐⭐⭐ (VITS neural architecture)
- **Performance**: <100ms latency, CPU-only (no GPU required)
- **License**: MIT
- **Repository**: [rhasspy/piper](https://github.com/rhasspy/piper)

---

## CLI Application Stack

### Runtime & Language
- **Node.js**: 18+ LTS
- **TypeScript**: 5+
- **Package Manager**: pnpm (workspaces support)

### CLI Framework & UI
- **Commander.js**: Argument parsing and command structure
- **@inquirer/prompts**: Interactive prompts and user input
- **chalk**: Terminal colors and styling
- **ora**: Spinners and progress indicators
- **boxen**: Formatted terminal boxes

### Audio & Media
- **play-sound**: Cross-platform audio playback
- **Alternative**: node-speaker (if more control needed)

### Configuration & Logging
- **dotenv**: Environment variables
- **JSON files**: User config in `~/.config/tts-local/`
- **pino**: Production logging (fast, structured)
- **debug**: Development debugging

### Utilities
- **fs-extra**: Enhanced file system operations (v11.3.3)
- **execa**: Better child process spawning (v9.6.1)
- **tar**: Archive extraction (v7.5.7)

---

## Desktop Application Stack

### Framework
- **Electron**: 28+ (latest stable)
- **electron-vite**: Build tooling and HMR
- **electron-builder**: Packaging and distribution
- **electron-updater**: Auto-updates

### UI Framework
- **React**: 18+ with TypeScript
- **Vite**: Frontend build tool
- **UI Library**: TBD (consider shadcn/ui or native HTML/CSS)

### Audio
- **Web Audio API**: Native browser audio for playback
- **MediaRecorder API**: Optional recording features

### State Management
- **React Context**: Simple state (sufficient for basic app)
- **Alternative**: Zustand (if more complexity needed)

### Security
- **contextIsolation**: Enabled (required)
- **nodeIntegration**: Disabled (required)
- **sandbox**: Enabled (required)
- **Preload Scripts**: Secure IPC bridge via contextBridge

---

## Project Structure

### Monorepo Architecture
```
tts-local/
├── packages/
│   ├── core/           # Shared TTS logic
│   ├── cli/            # CLI application
│   ├── electron/       # Desktop GUI
│   └── types/          # Shared TypeScript types
├── pnpm-workspace.yaml
└── package.json
```

### Build Tools
- **Vite**: Fast frontend bundling
- **esbuild**: Fast TypeScript compilation
- **TypeScript Project References**: Type-safe workspace dependencies

---

## Development Tools

### Code Quality
- **ESLint**: Linting with TypeScript support
- **Prettier**: Code formatting
- **husky**: Git hooks
- **lint-staged**: Pre-commit linting

### Testing
- **Vitest**: Unit and integration testing (242 tests, V8 coverage provider)
- **Playwright**: E2E testing for Electron app (cross-platform, xvfb on Linux)
- **@testing-library/react**: React component testing

**Test Commands:**
```bash
pnpm test              # Run all unit/integration tests
pnpm test:coverage     # Run with V8 coverage report
pnpm test:watch        # Watch mode
pnpm test:ui           # Vitest UI
pnpm --filter @tts-local/electron test:e2e       # Electron E2E (Playwright)
pnpm --filter @tts-local/electron test:security  # Security audit tests
```

**CI Matrix**: ubuntu-latest, macos-latest, windows-latest (GitHub Actions)

### Type Checking
- **TypeScript**: Strict mode enabled
- **@types packages**: Type definitions for dependencies

---

## Build & Deployment

### CLI Distribution
- **npm registry**: Publish as npm package
- **npm link**: Local development installation

### Electron Distribution
- **electron-builder targets**:
  - macOS: DMG + zip (with notarization)
  - Windows: NSIS installer + portable exe
  - Linux: AppImage + deb + rpm
- **Auto-updates**: GitHub Releases integration

---

## Platform Support

### Target Platforms
- ✅ macOS (Intel + Apple Silicon)
- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Debian, Fedora, Arch)

### Minimum Requirements
- Node.js 18+
- 4GB RAM
- 100MB disk space

---

## Dependencies Philosophy

### Principles
- **Free & Open Source**: 100% FOSS stack
- **Local-first**: No cloud dependencies
- **Lightweight**: Minimize bundle size
- **Battle-tested**: Prefer mature, widely-used libraries
- **Type-safe**: Full TypeScript coverage

### License Compatibility
All dependencies use permissive licenses (MIT, Apache 2.0, ISC) compatible with commercial and personal use.

---

## Future Considerations

### Potential Additions
- Multiple voice support (extend Piper voices)
- SSML support for advanced speech control
- Batch processing for multiple files
- Voice speed/pitch controls
- Audio export to file (WAV/MP3)
- Bookmarking/resume playback
- Dark mode UI

### Out of Scope (v1.0)
- Voice cloning
- Cloud TTS services
- Mobile apps
- Web app/browser extension
- Real-time transcription

---

**Last Updated**: 2026-02-18
**Status**: Phase 06 Complete (Packaging & Distribution)
