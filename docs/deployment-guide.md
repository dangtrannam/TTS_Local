# Deployment Guide

**Project**: TTS_Local
**Last Updated**: 2026-02-17
**Phase**: Phase 06 (Packaging & Distribution)

---

## Overview

TTS_Local ships two distribution artifacts:
- **CLI** (`@tts-local/cli`) — npm package, installed globally via npm/npx
- **Electron Desktop** — platform-native installers (DMG, NSIS, AppImage) built via electron-builder

---

## CLI Distribution (npm)

### Publish to npm

```bash
# From repo root
pnpm --filter @tts-local/cli build
pnpm --filter @tts-local/cli publish --access public
```

`prepublishOnly` runs `pnpm build` automatically before publish.

**Published files** (controlled by `files` in `package.json`):
- `dist/` — compiled JS
- `README.md` — npm package page

### Install (end users)

```bash
npm install -g @tts-local/cli
tts setup   # downloads Piper binary + default voice
tts speak "Hello world"
```

**Requirements**: Node.js 18+, espeak-ng (see `packages/cli/README.md`)

---

## Electron Desktop Distribution

### Prerequisites

- pnpm 9+, Node.js 20
- Platform tools: Xcode CLI tools (macOS), Visual Studio Build Tools (Windows)
- `electron-builder` installed (workspace devDependency)

### Step 1: Bundle Piper Binary

Before building, run the bundling script to download the platform Piper binary and default voice model into `packages/electron/resources/piper/`.

**macOS (ARM64):**
```bash
bash scripts/bundle-piper.sh darwin arm64
```

**macOS (x64):**
```bash
bash scripts/bundle-piper.sh darwin x64
```

**Windows:**
```bash
bash scripts/bundle-piper.sh win32 x64
# or PowerShell:
pwsh scripts/bundle-piper.ps1 win32 x64
```

**Linux:**
```bash
bash scripts/bundle-piper.sh linux x64
```

Script downloads from `https://github.com/rhasspy/piper/releases/download/v2023.11.14-2/` and `https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/`.

### Step 2: Build and Package

Use the package scripts from `packages/electron/`:

| Command | Platform | Output |
|---------|----------|--------|
| `pnpm --filter @tts-local/electron package:mac` | macOS ARM64 | `release/*.dmg` |
| `pnpm --filter @tts-local/electron package:mac-x64` | macOS x64 | `release/*.dmg` |
| `pnpm --filter @tts-local/electron package:win` | Windows x64 | `release/*.exe` |
| `pnpm --filter @tts-local/electron package:linux` | Linux x64 | `release/*.AppImage`, `release/*.deb` |

Each `package:*` command runs `prebuild:*` (bundle-piper), then `build`, then `electron-builder`.

Output artifacts land in `packages/electron/release/`.

### electron-builder Configuration

Config file: `packages/electron/electron-builder.yml`

| Platform | Target | Arch | Notes |
|----------|--------|------|-------|
| macOS | DMG | arm64, x64 | hardenedRuntime=true, entitlements required |
| Windows | NSIS | x64 | Per-user install, no admin elevation |
| Linux | AppImage, deb | x64 | Category: Utility |

**Piper binary** is bundled via `extraResources`:
```yaml
extraResources:
  - from: resources/piper
    to: piper
```
At runtime, `getElectronResourcesPath()` detects `process.resourcesPath` and services use bundled binary/models instead of downloaded ones.

---

## GitHub Actions Release Workflow

File: `.github/workflows/release.yml`

**Trigger**: Push a tag matching `v*`

```bash
git tag v0.2.0
git push origin v0.2.0
```

**Jobs (parallel):**
- `build-mac` (macos-latest) → uploads `.dmg`
- `build-win` (windows-latest) → uploads `.exe`
- `build-linux` (ubuntu-latest) → uploads `.AppImage`

**`create-release` job** (sequential, after all builds):
- Downloads all artifacts
- Creates GitHub Release via `softprops/action-gh-release`
- Auto-generates release notes from commit history

**Required secrets**: `GITHUB_TOKEN` (auto-provided by Actions)

---

## macOS Gatekeeper (Unsigned Binaries)

The bundled Piper binary is unsigned. Users may need:

```bash
xattr -d com.apple.quarantine /path/to/piper
```

**Future (v2.0)**: Code signing with Apple Developer ID + notarization via `xcrun notarytool`.

The macOS entitlements plist (`packages/electron/resources/entitlements.mac.plist`) is minimal:
- `com.apple.security.cs.allow-jit`
- `com.apple.security.cs.allow-unsigned-executable-memory`
- `com.apple.security.cs.disable-library-validation`

---

## Deferred / Planned

| Feature | Target Version |
|---------|---------------|
| Platform installer smoke tests | v1.1 |
| Release artifact checksums | v1.1 |
| Code signing (Apple Developer ID, Windows Authenticode) | v2.0 |
| macOS notarization | v2.0 |
| Auto-update (electron-updater) | v2.0 |

---

**Maintainer**: Development Team
**Update Policy**: After each packaging or release process change
