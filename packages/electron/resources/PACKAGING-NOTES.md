# Packaging Notes

## Required Before Building Installers

### 1. App Icons (CRITICAL)

Icon files MUST be created before running `pnpm package:*` commands. electron-builder will fail without them.

**Required files:**
- `icon.icns` - macOS (see ICONS.md for creation instructions)
- `icon.ico` - Windows
- `icon.png` - Linux

**Quick placeholder generation:**
```bash
# From project root
cd packages/electron/resources

# Create simple 512x512 placeholder (requires ImageMagick)
convert -size 512x512 xc:#4A90E2 -pointsize 200 -fill white -gravity center \
  -annotate +0+0 "TTS" icon.png

# Generate ICNS for macOS (requires iconutil on macOS)
mkdir icon.iconset
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
# ... (see ICONS.md for full iconset creation)
iconutil -c icns icon.iconset

# Generate ICO for Windows (requires ImageMagick)
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### 2. Bundled Binary Testing

After packaging, test that bundled Piper binary works:

**macOS:**
```bash
# Extract DMG, mount it, copy app to Applications
# Then check logs:
TTS\ Local.app/Contents/MacOS/TTS\ Local
# Should NOT show "Installing Piper via pip..."
# Should show bundled binary path
```

**Windows:**
```powershell
# Install via NSIS installer
# Check %LOCALAPPDATA%\TTS Local\logs
```

### 3. Build Prerequisites

**All platforms:**
- Node.js 20+
- pnpm 9+
- `pnpm install` completed
- `pnpm build` completed

**macOS:**
- Xcode Command Line Tools
- iconutil (comes with Xcode)

**Windows:**
- Windows 10+ (tar command required)
- PowerShell 5.1+

**Linux:**
- FUSE (for AppImage runtime)
- `apt-get install libarchive-tools` (for .deb)

## Known Issues

### Missing Icons
- **Symptom:** `Error: Cannot find file: resources/icon.icns`
- **Fix:** Create icon files (see section 1 above)

### Windows tar Not Found
- **Symptom:** `'tar' is not recognized`
- **Fix:** Requires Windows 10+ (tar built-in). On older Windows, install Git Bash or WSL

### macOS Gatekeeper Blocking
- **Symptom:** "App is damaged and can't be opened"
- **Workaround (dev):** `xattr -cr /Applications/TTS\ Local.app`
- **Production fix:** Code signing + notarization (requires Apple Developer cert)

### Windows SmartScreen Warning
- **Symptom:** "Windows protected your PC"
- **Workaround:** Click "More info" → "Run anyway"
- **Production fix:** Code signing (requires Authenticode certificate)

## Security Considerations

### Current State (v1 - Unsigned)
- macOS: Requires `xattr -cr` workaround
- Windows: Requires SmartScreen bypass
- Linux: No restrictions (AppImage runs without sudo)

### Future (v2 - Signed)
- macOS: Requires Apple Developer Program ($99/year)
  - Code sign with Developer ID certificate
  - Notarize via `xcrun notarytool`
  - Staple ticket to DMG
- Windows: Requires code signing certificate (~$300/year)
  - Sign with Authenticode certificate
  - No SmartScreen warning

## Testing Checklist

Before releasing builds:

- [ ] Icons exist (icns, ico, png)
- [ ] Bundle script downloads correct binary for platform
- [ ] Bundled binary is executable (chmod +x applied)
- [ ] Default voice model bundled (en_US-amy-medium)
- [ ] electron-builder completes without errors
- [ ] Installer size < 100MB
- [ ] App launches on clean machine (no Node.js/Python)
- [ ] TTS synthesis works without network
- [ ] App quits cleanly
- [ ] Uninstall removes app but preserves user data

## Disk Space Requirements

- **Build machine:** ~500MB (node_modules + build artifacts + downloaded binaries)
- **Installer size:** ~50-80MB per platform
- **Installed app:** ~100-150MB (app + bundled binary + 1 voice model)
- **User data:** ~50MB per additional voice model
