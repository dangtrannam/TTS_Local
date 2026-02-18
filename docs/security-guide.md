# Security Guide

**Project**: TTS_Local
**Last Updated**: 2026-02-18
**Applies To**: Electron desktop app (`packages/electron`)

---

## Overview

TTS_Local's Electron app follows a defense-in-depth security model. All Node.js APIs are isolated from the renderer process. IPC messages are validated before use. No external network requests are made at runtime.

---

## BrowserWindow Security Configuration

File: `packages/electron/src/main/index.ts`

| Setting | Value | Reason |
|---------|-------|--------|
| `nodeIntegration` | `false` | Prevents renderer from accessing Node.js APIs directly |
| `contextIsolation` | `true` | Isolates renderer JS context from preload/main |
| `sandbox` | `true` | Runs renderer in OS-level sandboxed process |
| `webSecurity` | `true` | Enforces same-origin policy |
| `allowRunningInsecureContent` | `false` | Blocks mixed HTTP/HTTPS content |
| `experimentalFeatures` | `false` | Disables unstable, potentially insecure Chromium features |

---

## Content Security Policy (CSP)

File: `packages/electron/src/main/security-config.ts`

Applied via `session.webRequest.onHeadersReceived`.

### Production CSP

```
default-src 'none'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data:
font-src 'self'
connect-src 'self'
media-src 'self'
object-src 'none'
base-uri 'none'
form-action 'none'
frame-ancestors 'none'
```

`'unsafe-inline'` on `style-src` is required for React inline styles. All other sources are `'self'` or `'none'`.

### Development CSP (relaxed)

Allows `'unsafe-eval'` and `'unsafe-inline'` on `script-src` for Vite HMR, and WebSocket connections to localhost for React Fast Refresh. **Never active in packaged builds.**

### Additional Response Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Blocks iframe embedding |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |

---

## IPC Design

File: `packages/electron/src/preload/index.ts`

### Principles

- **Only `ipcRenderer.invoke()`** is used (request/response). No `ipcRenderer.send()` or `ipcRenderer.on()` is exposed to the renderer.
- **contextBridge** is the sole channel: `window.ttsAPI` is the only renderer-accessible API.
- **Whitelisted methods only**: `synthesize`, `isReady`, `setup`, `listVoices`, `getConfig`, `setConfig`, `onProgress`, `onSetupProgress`.
- **`structuredClone()`** is applied to all outbound and inbound data to prevent prototype pollution.

### Exposed API (window.ttsAPI)

```typescript
window.ttsAPI.synthesize(text, options?)  // Returns ArrayBuffer (WAV)
window.ttsAPI.isReady()                   // Returns boolean
window.ttsAPI.setup()                     // Downloads Piper + voice model
window.ttsAPI.listVoices()               // Returns VoiceModel[]
window.ttsAPI.getConfig()                // Returns TTSConfig
window.ttsAPI.setConfig(key, value)      // Updates config
window.ttsAPI.onProgress(cb)             // Returns cleanup fn
window.ttsAPI.onSetupProgress(cb)        // Returns cleanup fn
```

---

## IPC Validation

File: `packages/electron/src/main/ipc-validator.ts`

All writable IPC channels validate arguments before processing. `validateIPC(channel, args)` throws if validation fails.

### tts:synthesize

- `text`: string, non-empty, max 100,000 chars, no null bytes
- `options.speed`: number, 0.5–2.0
- `options.voice`: string, `[a-zA-Z0-9_-]+` only

### tts:set-config

- `key`: must be `'defaultVoice'` or `'speed'` (allowlist)
- `speed` value: number, 0.5–2.0
- `defaultVoice` value: string, `[a-zA-Z0-9_-]+` only

Read-only channels (`tts:is-ready`, `tts:list-voices`, `tts:get-config`, `tts:setup`) have no schema (no user input to validate).

---

## Navigation & Window Security

File: `packages/electron/src/main/index.ts`

- **`will-navigate` event**: All navigation events are cancelled (`event.preventDefault()`). The app never loads external URLs.
- **`setWindowOpenHandler`**: Returns `{ action: 'deny' }` for all new window requests. No pop-ups or external links open.

---

## Permission Handling

File: `packages/electron/src/main/security-config.ts`

- `setPermissionRequestHandler`: Denies all OS permission requests (camera, microphone, geolocation, notifications, etc.)
- `setPermissionCheckHandler`: Returns `false` for all permission checks

TTS_Local requires no OS permissions beyond audio output (which uses `afplay`/`aplay`/PowerShell, not browser APIs).

---

## Binary Invocation Security

File: `packages/core/src/services/piper-process-runner.ts`

- Piper binary path is resolved from a known directory (`~/.local/share/tts-local/bin/` or `process.resourcesPath`). No user-supplied paths.
- Arguments are passed as array (via `execa`), never concatenated into a shell string — no shell injection possible.
- Temporary files for WAV output use `os.tmpdir()` with random suffixes.

---

## Security Checklist

Use this before merging changes to `packages/electron`:

- [ ] `nodeIntegration: false` in BrowserWindow
- [ ] `contextIsolation: true` in BrowserWindow
- [ ] `sandbox: true` in BrowserWindow
- [ ] No new `ipcRenderer.send()` / `ipcRenderer.on()` in preload
- [ ] All new IPC channels use `ipcRenderer.invoke()`
- [ ] New writable IPC channels have a validation schema in `ipc-validator.ts`
- [ ] `structuredClone()` applied to user-supplied data before IPC
- [ ] CSP does not introduce new unsafe directives in production mode
- [ ] No new external network calls added at runtime
- [ ] New external URLs blocked in `will-navigate` handler

---

## How to Audit

1. **Verify BrowserWindow settings**: Check `packages/electron/src/main/index.ts` → `webPreferences`
2. **Verify CSP**: Run app, open DevTools → Network tab → check `Content-Security-Policy` response header on any request
3. **Test IPC injection**: Send malformed input to `tts:synthesize` (null bytes, voice with `../`, oversized text) — should receive validation error
4. **Test navigation blocking**: In DevTools console, run `window.location.href = 'https://example.com'` — should be blocked
5. **Run security test suite**: `pnpm --filter @tts-local/electron test:security`

---

**Maintainer**: Development Team
**Update Policy**: Update after any change to IPC channels, BrowserWindow config, or CSP
