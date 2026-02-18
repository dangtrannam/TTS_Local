# Troubleshooting Guide

**Project**: TTS_Local
**Last Updated**: 2026-02-18

---

## Cross-Platform Issues

### "Piper binary not found"

**Cause**: Piper TTS has not been installed, or the binary path is not registered.

**Fix**:
```bash
pnpm exec tts setup
```
This installs Piper via pip and writes the binary path to config. If pip is unavailable, install Python 3 first.

---

### "Voice model not found"

**Cause**: No `.onnx` voice model file found in the models directory.

**Fix**:
```bash
pnpm exec tts setup
```
Select a voice to download. Default model: `en_US-amy-medium` (~63 MB).
Models are stored in `~/.local/share/tts-local/models/` (Linux/macOS) or `%APPDATA%\tts-local\models\` (Windows).

---

### Synthesis timeout

**Cause**: Text is too long for the default 30-second timeout.

**Fix**: Increase timeout with `--timeout` (milliseconds):
```bash
pnpm exec tts speak --file long-document.txt --timeout 120000
```

---

### Network error during setup/download

**Cause**: Firewall, proxy, or temporary connectivity issue during Piper or model download.

**Fix**:
- Check internet connection
- If behind a proxy, set `HTTP_PROXY` / `HTTPS_PROXY` environment variables
- Retry `tts setup`

---

### "Permission denied" on binary

**Cause**: Piper binary lacks execute permission (Unix/Linux).

**Fix**:
```bash
# macOS
chmod +x ~/Library/Python/3.12/bin/piper

# Linux
chmod +x ~/.local/bin/piper
```

---

## macOS-Specific

### "Operation not permitted" / Gatekeeper blocks Piper binary

**Cause**: macOS quarantines downloaded binaries from unidentified developers.

**Fix**:
```bash
xattr -d com.apple.quarantine /path/to/piper
```

Or go to **System Settings → Privacy & Security** and allow the binary to run.

---

### Apple Silicon: Piper crashes or won't start

**Cause**: Piper binary may be x64-only and needs Rosetta 2.

**Fix**:
```bash
softwareupdate --install-rosetta --agree-to-license
```

---

### `afplay` not found or audio doesn't play

**Cause**: Rare — `afplay` is a macOS built-in. If missing, the system may be corrupted.

**Fix**: Use `--output` to save WAV instead of playing:
```bash
pnpm exec tts speak "Hello" --output output.wav
```

---

## Windows-Specific

### SmartScreen blocks the installer

**Cause**: The installer is not code-signed (v1.0).

**Fix**: In the SmartScreen dialog, click **More info** → **Run anyway**.

This is expected behavior for unsigned installers. Code signing is planned for v2.0.

---

### PowerShell audio playback fails

**Cause**: No audio output device found, or PowerShell execution policy blocks the playback command.

**Fix**: Use `--output` to save audio to a file and play manually:
```bash
pnpm exec tts speak "Hello" --output output.wav
```

Or set PowerShell execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

### NSIS installer requires admin

**Cause**: Per-machine install mode requires elevation.

**Fix**: Choose **Install for current user only** in the installer options — this requires no admin rights.

---

## Linux-Specific

### No audio player found

**Cause**: Neither `aplay` (ALSA) nor `paplay` (PulseAudio) is installed.

**Fix**:
```bash
# ALSA (Ubuntu/Debian)
sudo apt-get install alsa-utils

# PulseAudio
sudo apt-get install pulseaudio-utils
```

---

### AppImage won't run

**Cause**: Missing execute permission.

**Fix**:
```bash
chmod +x TTS-Local-*.AppImage
./TTS-Local-*.AppImage
```

---

### ALSA errors on headless server

**Cause**: No audio output device on server (CI/headless environments).

**Fix**: Use `--output` to write WAV without playback:
```bash
pnpm exec tts speak "Hello" --output output.wav
```

---

## Electron Desktop App

### Setup wizard stuck / spinner doesn't stop

**Cause**: Network issue during Piper or model download, or download silently failed.

**Fix**:
1. Open DevTools: **View → Toggle Developer Tools**
2. Check the **Console** for errors
3. Restart the app and try setup again

---

### Audio doesn't play after synthesis

**Cause**: Browser autoplay policy may block audio on first load.

**Fix**: Click the **Speak** button again. The Web Audio API requires a user gesture before playing audio.

---

### App window is blank / white screen

**Cause**: Content Security Policy (CSP) blocked a resource, or renderer failed to load.

**Fix**:
1. Open DevTools: **View → Toggle Developer Tools**
2. Check **Console** for CSP errors or module load failures
3. If in development, ensure the Vite dev server is running (`pnpm dev`)

---

### "ttsAPI is not defined" in renderer

**Cause**: Preload script failed to load, or was not configured correctly.

**Fix**: This is a build issue. Rebuild the app:
```bash
pnpm --filter @tts-local/electron build
```

---

## CLI Specific

### Command not found after global install

**Fix**:
```bash
# Check pnpm global bin is in PATH
pnpm bin -g

# Add to .zshrc or .bashrc if missing
export PATH="$(pnpm bin -g):$PATH"
```

---

### "Cannot read config file"

**Cause**: Config file is corrupted or has invalid JSON.

**Fix**: Reset config to defaults:
```bash
pnpm exec tts config reset
```

---

## Getting More Help

- **Check logs**: Run with `DEBUG=tts-local:*` for verbose output
- **GitHub Issues**: [github.com/dangtrannam/TTS_Local/issues](https://github.com/dangtrannam/TTS_Local/issues)
- **Error codes**: See `packages/types/src/error-types.ts` for the full list of error codes

---

**Maintainer**: Development Team
**Update Policy**: Add new issues as reported by users
