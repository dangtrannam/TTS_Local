# Project Roadmap

**Project**: TTS_Local
**Last Updated**: 2026-02-17
**Maintained By**: Development Team

---

## Roadmap Overview

TTS_Local follows a structured phase-based approach to deliver a production-ready cross-platform text-to-speech application. Currently **88% complete** with core infrastructure, CLI, Electron desktop application, full test suite, and packaging & distribution infrastructure operational.

---

## Timeline & Phases

### Phase 01: Foundation Setup ✅ COMPLETE
**Duration**: 1 day | **Actual**: ~8 hours
**Completion Date**: 2026-02-13

**Status**: Production Ready

**Key Deliverables:**
- Monorepo setup with pnpm workspaces
- TypeScript strict mode configuration
- ESLint + Prettier enforcement
- Husky pre-commit hooks
- GitHub Actions CI/CD pipeline
- Base package structure for core, types, cli, electron

**Outcome**: Solid foundation for modular development with automated quality gates

---

### Phase 02: Piper TTS Core ✅ COMPLETE
**Duration**: 2 days | **Actual**: ~24 hours
**Completion Date**: 2026-02-15

**Status**: Production Ready

**Key Deliverables:**
- `@tts-local/types` package with comprehensive type definitions
- `@tts-local/core` package with Piper TTS integration
  - PiperTTSService (main orchestrator)
  - PiperBinaryManager (binary lifecycle)
  - PiperVoiceManager (voice model lifecycle)
  - PiperProcessRunner (subprocess execution)
- Platform detection (macOS/Linux/Windows, x64/arm64)
- Automatic resource management and caching
- Comprehensive error handling (12+ error codes)
- WAV audio parsing and metadata extraction

**Quality Metrics:**
- 100% TypeScript strict mode compliance
- 85%+ test coverage
- Zero linting errors
- Clean architecture with separation of concerns

**Outcome**: Robust TTS engine ready for downstream integration

---

### Phase 03: CLI Application ✅ COMPLETE
**Duration**: 2 days | **Actual**: ~16 hours
**Completion Date**: 2026-02-15

**Status**: Production Ready

**Key Deliverables:**
- `@tts-local/cli` package with Commander.js CLI framework
- 4 Core Commands:
  - `tts speak` - Synthesize and play/save audio
  - `tts setup` - Download binary and voice models
  - `tts voices` - List installed voices
  - `tts config` - Manage configuration
- 4 Utility Modules:
  - cli-output (colors and spinners)
  - input-reader (stdin/file/argument validation)
  - audio-player (platform-aware playback)
  - config-manager (JSON CRUD)
- Platform-aware audio playback (afplay, paplay/aplay/ffplay, PowerShell)
- XDG-compliant configuration management
- 18 CLI-specific error codes with user-friendly messages

**Quality Metrics:**
- Type safety: 100% strict mode
- Code review: 8.5/10
- Security: 9/10 (file sanitization, size limits, safe exec)
- Manual test coverage: 10/10 core features

**Outcome**: Full-featured CLI application ready for production use

---

### Phase 04: Electron Desktop App ✅ COMPLETE
**Duration**: 3 days (estimated) | **Actual**: 2026-02-16
**Completion Date**: 2026-02-16

**Status**: Production Ready

**Key Deliverables:**
- Electron main process with strict security (sandbox, contextIsolation, CSP)
- React 18 renderer with TypeScript support
- Preload script with contextBridge (whitelist-only IPC API)
- IPC validator with runtime schema validation
- System tray integration with minimize-to-tray behavior
- Web Audio API playback via `useAudioPlayer` hook
- SetupWizard for first-run binary/model initialization
- 5 React components: StatusIndicator, TextInputPanel, PlaybackControls, SettingsPanel, SetupWizard
- 2 custom hooks: `useTTS`, `useAudioPlayer`

**Quality Metrics:**
- Security: nodeIntegration off, contextIsolation on, sandbox on
- CSP: `default-src 'none'` with allowlist
- IPC: schema-validated, structuredClone on all data
- 20 new source files across main/preload/renderer

**Acceptance Criteria:**
- ✅ GUI launches without errors
- ✅ Text input and synthesis working via IPC
- ✅ Voice/speed controls via SettingsPanel
- ✅ Playback via Web Audio API
- ✅ System tray integration with minimize-to-tray
- ✅ Security hardening applied (CSP, sandbox, IPC validation)
- ⏳ Save to file dialog (deferred to Phase 05)
- ⏳ Auto-updater (deferred)

**Outcome**: Secure, professional desktop application for casual users

---

### Phase 05: Testing & QA ✅ COMPLETE
**Duration**: 2 days (estimated) | **Completion Date**: 2026-02-16

**Status**: Production Ready

**Key Deliverables:**
- 242 unit + integration tests (Vitest) — 100% passing
- Integration tests for full synthesis pipeline
- E2E tests (Playwright) for Electron app
- Security audit test suite (4 test files: CSP, IPC validation, preload surface area, sandbox isolation)
- 3-OS CI matrix (ubuntu-latest, macos-latest, windows-latest)
- Per-package vitest configs with V8 coverage reporting
- Coverage artifacts uploaded per OS per CI run

**Acceptance Criteria:**
- ✅ 242 tests passing across all packages
- ✅ All tests pass on all platforms (CI matrix)
- ✅ Security audit tests pass
- ✅ Coverage thresholds enforced (45% lines/functions/branches/statements)
- ✅ Documentation updated

**Outcome**: Production-ready, well-tested application with automated cross-platform CI

---

### Phase 06: Packaging & Distribution ✅ COMPLETE
**Duration**: 24h (estimated) | **Completion Date**: 2026-02-17

**Status**: Production Ready (distribution infrastructure complete; platform installer testing deferred to v1.1)

**Key Deliverables:**
- CLI package.json configured for npm distribution (`@tts-local/cli`)
- CLI README.md for npm page with install/usage docs
- Piper binary bundling automation: `scripts/bundle-piper.sh` + `scripts/bundle-piper.ps1`
- `packages/electron/electron-builder.yml` for DMG/NSIS/AppImage builds
- macOS entitlements plist for hardened runtime
- Core `piper-binary-manager.ts` updated to detect bundled binary in packaged Electron
- GitHub Actions release workflow (`.github/workflows/release.yml`) for tag-triggered multi-platform builds
- Placeholder app icons added with documentation

**Test Results:**
- 242 tests passed, 0 failed
- Coverage: 56% (above 45% threshold)
- Type-check: PASS | Build: PASS
- Code quality: ~8.5/10 after critical security fixes

**Deferred to v1.1:**
- Platform installer smoke tests (macOS DMG, Windows NSIS, Linux AppImage — requires real hardware)
- Release workflow end-to-end test with a real tag
- Checksums for GitHub releases

**Deferred to v2.0:**
- Code signing (Apple Developer ID, Windows Authenticode)
- macOS notarization via `xcrun notarytool`
- Auto-update via electron-updater

**Outcome**: Full distribution infrastructure ready; installers can be produced on demand; signing/notarization planned for public release

---

### Phase 07: Documentation & Polish ⏳ PENDING
**Duration**: 1 day (estimated) | **Planned Start**: 2026-02-23
**Target Completion**: 2026-02-23

**Status**: Not Started

**Key Deliverables:**
- User guide for CLI and Electron
- Installation instructions per platform
- Troubleshooting guide
- Developer documentation
- API reference
- Architecture guide for contributors
- YouTube demo video (optional)
- Blog post announcement

**Acceptance Criteria:**
- All docs reviewed for clarity and accuracy
- Installation guide tested on actual machines
- Community feedback incorporated

**Outcome**: Professional public documentation

---

## Cumulative Progress

| Milestone | Phases | Hours | % Complete |
|-----------|--------|-------|-----------|
| CLI MVP | 01-03 | 48h | 35% |
| Desktop MVP | 01-04 | 80h | 59% ✅ |
| Tested Release Candidate | 01-05 | 100h | 74% ✅ |
| Distribution Ready | 01-06 | 124h | 88% ✅ |
| Full Release | 01-07 | 136h | 100% |

**Current Status**: 124/136 hours complete (**88% overall**)

---

## Critical Path

```
Phase 01 ──► Phase 02 ──► Phase 03 ──┐
                                     ├──► Phase 05 ──┐
                    Phase 04 ────────┘               ├──► Phase 06 ──► Phase 07
                                                     │
                                        Phase 05 ◄───┘
```

**Critical dependencies:**
- Phase 02 blocks Phase 03 (core must work)
- Phase 03 blocks Phase 04 (CLI tested before Electron)
- Phase 04 and 03 blocks Phase 05 (all code before testing)
- Phase 05 blocks Phase 06 (validated code before release)
- Phase 06 blocks Phase 07 (working packages before docs)

**On Track**: All phases following planned schedule

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Piper binary incompatibility on Linux/Windows | High | Medium | Early Phase 05 testing on multiple machines |
| macOS code signing costs | Medium | Low | Evaluate notarization alternatives |
| Electron complexity exceeds estimate | Medium | Medium | Scope reduction (remove tray icon if needed) |
| Voice model license changes | High | Low | Maintain model URL pinning, monitor Hugging Face |
| Breaking npm dependency updates | Medium | Medium | Lock versions, test before upgrading |

---

## Success Metrics

### Development Metrics
- ✅ Phase 01-03: Code quality 8.5+/10 (target 8+)
- ✅ Phase 04: Security hardening applied (CSP, sandbox, IPC validation)
- ✅ Phase 05: 242 tests passing, CI matrix on 3 OS platforms
- ✅ Phase 06: Distribution infrastructure complete, code quality ~8.5/10
- ⏳ Phase 07: Documentation and polish (target: zero linting errors)

### User Metrics (Post-Release)
- 1000+ GitHub stars (6 months)
- < 2% error rate in production
- 99% synthesis success rate
- Average synthesis latency < 200ms (cached)

### Performance Metrics
- First run download: < 5 minutes on 10Mbps connection
- Synthesis latency: < 100ms cached
- Memory usage: < 100MB during operation
- Disk usage: < 60MB (binary + 2 voices)

---

## Known Blockers & Constraints

### Technical Constraints
- Audio playback on Linux tested in CI (ubuntu-latest) via xvfb
- Windows PowerShell audio playback tested in CI (windows-latest)
- Electron auto-updates require infrastructure setup
- Code signing requires Apple Developer account ($ future enhancement)

### Resource Constraints
- Solo developer, part-time availability
- No budget for code signing/infrastructure (v1.0)
- Limited cross-platform testing hardware

---

## Future Enhancements (Post v1.0)

### v1.1 Features
- Multiple voice support (side-by-side comparison)
- Pitch and volume controls
- SSML support for advanced control
- Batch file processing
- Bookmarking for pause/resume

### v2.0 Features
- MP3/OGG export formats
- Streaming synthesis (real-time chunking)
- Voice cloning from user audio
- Multi-language support
- Web app / browser extension
- Mobile apps (iOS/Android)

### Technical Debt (v1.5+)
- Comprehensive integration tests
- Performance optimization
- Accessibility improvements
- Localization (UI translations)

---

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-02-14 | Use Commander.js for CLI | Popular, well-maintained, simple | Reduces Phase 03 scope |
| 2026-02-14 | Skip Inquirer for Phase 03 | Config file sufficient MVP | Faster Phase 03 delivery |
| 2026-02-14 | Use Web Audio for Electron playback | Cross-platform, no external deps | Simplifies Phase 04 |
| 2026-02-15 | Defer code signing to v1.1 | Reduces initial complexity | Requires manual workarounds on macOS |
| 2026-02-16 | Enforce sandbox + contextIsolation + CSP | Electron security best practices | Prevents XSS and IPC injection |
| 2026-02-16 | Use electron-vite for build | HMR in dev, optimized prod builds | Faster development iteration |
| 2026-02-16 | Defer save-to-file dialog | Focus on core synthesis flow first | Phase 05 enhancement |

---

## Review Schedule

| Frequency | Owner | Notes |
|-----------|-------|-------|
| Weekly | Developer | Check milestone progress vs. plan |
| Phase End | Project Manager | Verify acceptance criteria met |
| Monthly | Team | Adjust future phases if needed |

**Last Review**: 2026-02-17
**Next Review**: 2026-02-18 (Phase 07 kickoff)

---

**Document Owner**: Project Manager
**Update Policy**: After each phase completion
**Visibility**: Public (shared with contributors)
