# Code Standards

**Project**: TTS_Local
**Last Updated**: 2026-02-15
**Enforcement**: ESLint + Prettier + TypeScript Strict Mode

---

## File Naming Conventions

### TypeScript/JavaScript Files
- **Format**: kebab-case
- **Pattern**: `{feature}-{type}.ts`
- **Examples**:
  - `piper-tts-service.ts`
  - `platform-detector.ts`
  - `download-helper.ts`
  - `error-handler.ts`

### Test Files
- **Format**: `{filename}.test.ts` or `{filename}.spec.ts`
- **Location**: Colocated with source files or in `__tests__/` directory
- **Examples**:
  - `piper-tts-service.test.ts`
  - `platform-detector.spec.ts`

### Configuration Files
- **Format**: Conventional names
- **Examples**:
  - `tsconfig.json`, `package.json`, `.eslintrc.json`
  - `vitest.config.ts`, `.prettierrc`

### Documentation Files
- **Format**: kebab-case with `.md` extension
- **Examples**:
  - `codebase-summary.md`
  - `system-architecture.md`
  - `code-standards.md`

---

## Directory Structure

### Monorepo Layout
```
TTS_Local/
├── packages/               # Workspace packages
│   ├── core/              # Core TTS implementation
│   ├── types/             # Shared TypeScript types
│   ├── cli/               # CLI application
│   └── electron/          # Desktop application
├── docs/                  # Project documentation
├── plans/                 # Development plans and reports
│   ├── {date}-{slug}/     # Plan directories
│   └── reports/           # Agent reports
└── .github/               # CI/CD workflows
    └── workflows/
```

### Package Internal Structure
```
packages/{package}/
├── src/
│   ├── services/          # Business logic, orchestration
│   ├── commands/          # CLI commands (CLI package only)
│   ├── utils/             # Pure functions, helpers
│   ├── config/            # Constants, configuration
│   ├── bin.ts             # Executable entry point (CLI only)
│   └── index.ts           # Public API exports
├── __tests__/             # Test files (if not colocated)
├── package.json
├── tsconfig.json
└── README.md              # Package-specific docs
```

### Service Layer Organization
```
src/services/
├── {feature}-service.ts       # Main service class
├── {feature}-manager.ts       # Resource management
├── {feature}-runner.ts        # Execution logic
└── {feature}-validator.ts     # Validation logic
```

### Utility Layer Organization
```
src/utils/
├── platform-detector.ts       # Platform detection
├── platform-paths.ts          # Path resolution
├── download-helper.ts         # Download utilities
├── audio-utils.ts             # Audio processing
└── error-handler.ts           # Error formatting
```

### CLI-Specific Organization
```
packages/cli/src/
├── bin.ts                    # Node shebang entry point
├── index.ts                  # CLI program factory
├── commands/                 # Command handlers
│   ├── speak-command.ts     # Synthesize and play/save
│   ├── setup-command.ts     # Download binary/models
│   ├── voices-command.ts    # List installed voices
│   └── config-command.ts    # Configuration management
└── utils/                   # CLI utilities
    ├── cli-output.ts        # Terminal output (colors, spinners)
    ├── input-reader.ts      # stdin/file/argument input
    ├── audio-player.ts      # Platform-aware audio playback
    └── config-manager.ts    # JSON config file CRUD
```

---

## Naming Conventions

### Variables and Functions
```typescript
// camelCase for variables and functions
const binaryPath = '/path/to/binary';
const maxRetries = 3;

function downloadFile(url: string): Promise<void> { }
async function ensureBinary(): Promise<string> { }
```

### Classes and Interfaces
```typescript
// PascalCase for classes and interfaces
class PiperTTSService { }
class PiperBinaryManager { }

interface TTSOptions { }
interface PlatformInfo { }
type TTSResult = { };
```

### Constants
```typescript
// UPPER_SNAKE_CASE for constants
const PIPER_VERSION = '2023.11.14-2';
const MAX_TEXT_LENGTH = 100_000;
const DEFAULT_TIMEOUT = 30_000;
```

### Enums
```typescript
// PascalCase for enum name, UPPER_SNAKE_CASE for values
enum TTSErrorCode {
  BINARY_NOT_FOUND = 'BINARY_NOT_FOUND',
  MODEL_DOWNLOAD_FAILED = 'MODEL_DOWNLOAD_FAILED',
  SYNTHESIS_TIMEOUT = 'SYNTHESIS_TIMEOUT',
}
```

### Type Aliases
```typescript
// PascalCase for type aliases
type VoicePaths = {
  onnx: string;
  config: string;
};

type ProgressCallback = (progress: DownloadProgress) => void;
```

### Private Class Members
```typescript
// Prefix with underscore (optional, but preferred)
class PiperTTSService {
  private _binaryManager: PiperBinaryManager;
  private _voiceManager: PiperVoiceManager;

  // Or without prefix (also acceptable)
  private platform: PlatformInfo;
  private config: PiperConfig;
}
```

---

## TypeScript Standards

### Strict Mode Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Annotations
```typescript
// Always annotate function return types
function parseWavHeader(buffer: Buffer): WavHeader { }

// Explicit return types for public APIs
export async function ensureBinary(): Promise<string> { }

// Infer types for simple variables
const count = 42;  // number (inferred)
const name = 'piper';  // string (inferred)

// Annotate complex variables
const config: PiperConfig = {
  binaryPath: '/path',
  modelsDir: '/models',
  defaultVoice: 'en_US-amy-medium',
  defaultSpeed: 1.0,
  synthesisTimeout: 30_000,
};
```

### Avoid `any`
```typescript
// ❌ Bad
function processData(data: any): any { }

// ✅ Good - use unknown for truly dynamic types
function processData(data: unknown): ProcessedData {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}

// ✅ Good - use generics for flexible types
function wrapResult<T>(value: T): Result<T> {
  return { success: true, value };
}
```

### Use Readonly
```typescript
// Readonly properties for immutable data
interface TTSResult {
  readonly audio: Buffer;
  readonly duration: number;
  readonly sampleRate: number;
}

// Readonly arrays
const SUPPORTED_FORMATS: readonly string[] = ['wav'];

// Const assertions
const CONFIG = {
  timeout: 30_000,
  maxRetries: 3,
} as const;
```

### Discriminated Unions
```typescript
// Use discriminated unions for state management
type SynthesisState =
  | { status: 'idle' }
  | { status: 'downloading'; percent: number }
  | { status: 'synthesizing' }
  | { status: 'complete'; result: TTSResult }
  | { status: 'error'; error: TTSError };
```

---

## Code Organization

### File Size Limits
- **Target**: < 200 lines per file
- **Reason**: Optimal context for LLM tools and human readability
- **Action**: Split into smaller modules when exceeding limit

**Example Refactoring:**
```
Before:
  piper-manager.ts (400 lines)

After:
  piper-binary-manager.ts (180 lines)
  piper-voice-manager.ts (150 lines)
  piper-process-runner.ts (120 lines)
```

### Single Responsibility Principle
Each file/class should have one clear purpose:
- `piper-tts-service.ts`: Orchestrate TTS operations
- `piper-binary-manager.ts`: Manage binary lifecycle
- `platform-detector.ts`: Detect OS and architecture

### Import Organization
```typescript
// 1. Node.js built-ins
import fs from 'node:fs/promises';
import path from 'node:path';

// 2. External dependencies
import { execa } from 'execa';
import fse from 'fs-extra';

// 3. Workspace dependencies
import type { TTSOptions, TTSResult } from '@tts-local/types';
import { TTSError, TTSErrorCode } from '@tts-local/types';

// 4. Relative imports (same package)
import { PiperBinaryManager } from './services/piper-binary-manager.js';
import { detectPlatform } from './utils/platform-detector.js';
import { DEFAULT_CONFIG } from './config/default-config.js';
```

### Export Patterns
```typescript
// Named exports (preferred)
export class PiperTTSService { }
export function detectPlatform(): PlatformInfo { }
export const PIPER_VERSION = '2023.11.14-2';

// Type exports
export type { TTSOptions, TTSResult };

// Re-exports for convenience
export { TTSError, TTSErrorCode } from '@tts-local/types';

// Default exports (avoid for libraries, OK for applications)
// ❌ Avoid: export default class PiperTTSService { }
```

---

## CLI-Specific Patterns

### Command Handler Structure
```typescript
/**
 * Command handler for 'speak' command
 * Synthesizes text and plays or saves audio
 */
export async function registerSpeakCommand(program: Command): Promise<void> {
  program
    .command('speak [text]')
    .description('Synthesize and play text')
    .option('--file <path>', 'Read text from file')
    .option('--output, -o <file>', 'Save to WAV file')
    .option('--voice <name>', 'Override default voice')
    .action(async (text: string | undefined, options: SpeakOptions) => {
      try {
        // Implementation...
      } catch (error) {
        handleError(error);
        process.exit(1);
      }
    });
}
```

### Input Validation Pattern (CLI)
```typescript
// Validate inputs from multiple sources
async function readInput(text: string | undefined, options: Options): Promise<string> {
  if (text) {
    validateText(text);
    return text;
  }

  if (options.file) {
    const path = sanitizePath(options.file);
    const content = await fs.readFile(path, 'utf-8');
    if (!content.trim()) throw new TTSError(CLI_FILE_EMPTY, 'File is empty');
    return content;
  }

  // Try stdin with timeout
  const stdin = await readStdin(5000); // 5s timeout
  if (!stdin.trim()) throw new TTSError(CLI_NO_INPUT, 'No input provided');
  return stdin;
}

// Size validation
function validateText(text: string): void {
  if (text.length > 100_000) {
    throw new TTSError(CLI_STDIN_TOO_LARGE, 'Input too large (max 100KB)');
  }
}

// Path sanitization to prevent traversal
function sanitizePath(userPath: string): string {
  const resolved = path.resolve(userPath);
  if (!resolved.startsWith(process.cwd())) {
    throw new TTSError(CLI_INVALID_FILE, 'Invalid file path');
  }
  return resolved;
}
```

### Configuration Management Pattern (CLI)
```typescript
interface CLIConfig {
  voice: string;
  speed: number;
  outputDir?: string;
}

class ConfigManager {
  private configPath: string;

  async load(): Promise<CLIConfig> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(data) as CLIConfig;
    } catch {
      return this.defaults();
    }
  }

  async save(config: CLIConfig): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.ensureDir(dir);
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    // Unix: restrict to user only
    if (process.platform !== 'win32') {
      await fs.chmod(this.configPath, 0o600);
    }
  }

  private defaults(): CLIConfig {
    return {
      voice: 'en_US-amy-medium',
      speed: 1.0,
    };
  }
}
```

### Output Formatting Pattern (CLI)
```typescript
import chalk from 'chalk';
import ora from 'ora';

// Unified output interface
class CliOutput {
  success(message: string): void {
    console.log(chalk.green('✓') + ' ' + message);
  }

  error(message: string): void {
    console.error(chalk.red('✗') + ' ' + message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ') + ' ' + message);
  }

  spinner(text: string) {
    return ora(text).start();
  }
}

// Usage
const output = new CliOutput();
const spinner = output.spinner('Downloading voice model...');
try {
  await downloadVoice();
  spinner.succeed('Voice model ready');
} catch (error) {
  spinner.fail('Download failed');
  output.error(formatErrorForUser(error));
}
```

### Platform-Aware Audio Playback (CLI)
```typescript
async function playAudio(audioPath: string): Promise<void> {
  const platform = detectPlatform();
  let command: string;
  let args: string[];

  if (platform.os === 'darwin') {
    command = 'afplay';
    args = [audioPath];
  } else if (platform.os === 'linux') {
    // Try multiple players in order
    for (const player of ['paplay', 'aplay', 'ffplay -nodisp -autoexit']) {
      if (await commandExists(player)) {
        command = player;
        args = [audioPath];
        break;
      }
    }
    if (!command) {
      throw new TTSError(CLI_NO_AUDIO_PLAYER, 'No audio player available');
    }
  } else if (platform.os === 'win32') {
    // PowerShell audio playback
    command = 'powershell.exe';
    args = ['-Command', `(New-Object System.Media.SoundPlayer '${audioPath}').PlaySync()`];
  }

  await execa(command, args);
}
```

---

## Error Handling

### Custom Error Classes
```typescript
// Extend Error with structured data
export class TTSError extends Error {
  constructor(
    public readonly code: TTSErrorCode,
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'TTSError';
  }
}

// Usage
throw new TTSError(
  TTSErrorCode.BINARY_NOT_FOUND,
  'Piper binary not found after download',
  originalError,
);
```

### Error Propagation
```typescript
// Catch and rethrow with context
async function ensureBinary(): Promise<string> {
  try {
    await downloadBinary();
  } catch (error) {
    throw new TTSError(
      TTSErrorCode.BINARY_DOWNLOAD_FAILED,
      'Failed to download Piper binary',
      error instanceof Error ? error : undefined,
    );
  }
}
```

### User-Friendly Error Messages
```typescript
// Format errors for end users
export function formatErrorForUser(error: TTSError | Error): string {
  if (!(error instanceof TTSError)) {
    return `Unexpected error: ${error.message}`;
  }

  switch (error.code) {
    case TTSErrorCode.BINARY_NOT_FOUND:
      return 'TTS engine not found. Try reinstalling the application.';
    case TTSErrorCode.MODEL_DOWNLOAD_FAILED:
      return 'Failed to download voice model. Check your internet connection.';
    // ... more cases
  }
}
```

---

## Async/Await Standards

### Always Use Async/Await
```typescript
// ❌ Avoid raw promises
function download(): Promise<void> {
  return fetch(url)
    .then(response => response.buffer())
    .then(buffer => fs.writeFile(dest, buffer));
}

// ✅ Prefer async/await
async function download(): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await fs.writeFile(dest, buffer);
}
```

### Error Handling with Async/Await
```typescript
// Use try/catch for error handling
async function synthesize(text: string): Promise<TTSResult> {
  try {
    const binaryPath = await ensureBinary();
    const voicePaths = await ensureVoice();
    return await runSynthesis(text, binaryPath, voicePaths);
  } catch (error) {
    throw new TTSError(
      TTSErrorCode.SYNTHESIS_FAILED,
      'Synthesis failed',
      error instanceof Error ? error : undefined,
    );
  }
}
```

### Parallel Execution
```typescript
// Use Promise.all for parallel operations
const [binaryPath, voicePaths] = await Promise.all([
  ensureBinary(),
  ensureVoice(voiceName),
]);

// Use Promise.allSettled to handle partial failures
const results = await Promise.allSettled([
  downloadFile(url1),
  downloadFile(url2),
  downloadFile(url3),
]);
```

---

## Documentation Standards

### Function Documentation
```typescript
/**
 * Synthesize text to speech using Piper TTS.
 *
 * @param text - Input text to synthesize (max 100k chars)
 * @param options - Synthesis options (voice, speed, output)
 * @returns Audio buffer with metadata
 * @throws {TTSError} If synthesis fails or text is invalid
 *
 * @example
 * ```typescript
 * const result = await service.synthesize('Hello world', {
 *   voice: 'en_US-amy-medium',
 *   speed: 1.2,
 * });
 * console.log(`Duration: ${result.duration}s`);
 * ```
 */
async function synthesize(
  text: string,
  options?: TTSOptions,
): Promise<TTSResult> { }
```

### Class Documentation
```typescript
/**
 * Manages Piper binary lifecycle: download, extraction, verification.
 *
 * Stores binaries in platform-specific app data directories:
 * - macOS: ~/Library/Application Support/tts-local/bin/
 * - Linux: ~/.local/share/tts-local/bin/
 * - Windows: %APPDATA%/tts-local/bin/
 */
export class PiperBinaryManager { }
```

### Inline Comments
```typescript
// Use comments for non-obvious logic
async function parseWavHeader(buffer: Buffer): Promise<WavHeader> {
  // WAV header format: RIFF (4 bytes) + size (4 bytes) + WAVE (4 bytes)
  const riff = buffer.toString('ascii', 0, 4);
  if (riff !== 'RIFF') {
    throw new Error('Invalid WAV file: missing RIFF header');
  }

  // Sample rate is at offset 24 (little-endian 32-bit int)
  const sampleRate = buffer.readUInt32LE(24);

  return { sampleRate, /* ... */ };
}
```

---

## Testing Standards

### Test File Naming
```
src/services/piper-tts-service.ts
src/services/piper-tts-service.test.ts
```

### Test Structure
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PiperTTSService } from './piper-tts-service.js';

describe('PiperTTSService', () => {
  let service: PiperTTSService;

  beforeEach(() => {
    service = new PiperTTSService();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('synthesize', () => {
    it('should synthesize text successfully', async () => {
      const result = await service.synthesize('Hello world');

      expect(result.audio).toBeInstanceOf(Buffer);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.sampleRate).toBe(22050);
    });

    it('should throw error for empty text', async () => {
      await expect(service.synthesize('')).rejects.toThrow(TTSError);
    });
  });
});
```

### Test Coverage Goals
- **Services**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **Critical paths**: 100% coverage

---

## Linting and Formatting

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_"
    }],
    "no-console": "warn"
  }
}
```

### Prettier Configuration
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid"
}
```

### Pre-commit Hooks
```bash
# .husky/pre-commit
pnpm lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## Performance Guidelines

### Avoid Blocking Operations
```typescript
// ❌ Bad - synchronous file operations
const data = fs.readFileSync(path);

// ✅ Good - async operations
const data = await fs.readFile(path);
```

### Use Streams for Large Files
```typescript
// ✅ Good - stream-based download
async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  const writer = fs.createWriteStream(dest);

  await new Promise((resolve, reject) => {
    response.body.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
```

### Cache Expensive Computations
```typescript
class PiperBinaryManager {
  private _cachedBinaryPath?: string;

  async ensureBinary(): Promise<string> {
    if (this._cachedBinaryPath && await this.binaryExists(this._cachedBinaryPath)) {
      return this._cachedBinaryPath;
    }

    this._cachedBinaryPath = await this.downloadBinary();
    return this._cachedBinaryPath;
  }
}
```

---

## Security Guidelines

### Input Validation
```typescript
// Validate all user inputs
function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new TTSError(TTSErrorCode.EMPTY_TEXT, 'Text cannot be empty');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new TTSError(
      TTSErrorCode.TEXT_TOO_LONG,
      `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
    );
  }
}
```

### Avoid Shell Injection
```typescript
// ❌ Bad - shell injection risk
const output = await exec(`piper --text "${text}"`);

// ✅ Good - array-based arguments
const { stdout } = await execa('piper', ['--text', text]);
```

### File Path Sanitization
```typescript
import path from 'node:path';

// Sanitize file paths to prevent directory traversal
function sanitizePath(userPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, userPath);

  if (!resolved.startsWith(baseDir)) {
    throw new Error('Invalid path: directory traversal detected');
  }

  return resolved;
}
```

---

## Git Commit Standards

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions or fixes
- `chore`: Build/tooling changes

### Examples
```
feat(core): implement Piper TTS service

Add PiperTTSService with binary and voice management.
Includes automatic download and platform detection.

Closes #12

---

fix(core): handle macOS Gatekeeper blocking unsigned binaries

Add detection and user-friendly error message for Gatekeeper issues.
Update docs with manual xattr removal instructions.

---

docs: update system architecture with Phase 02 changes

Add service layer documentation and data flow diagrams.
Update codebase summary with implementation status.
```

---

## Code Review Checklist

### Before Submitting PR
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No unused imports or variables
- [ ] No `console.log` statements (use proper logging)
- [ ] Documentation updated if API changed
- [ ] Commit messages follow conventional format

### During Code Review
- [ ] Code follows naming conventions
- [ ] Functions have clear single responsibilities
- [ ] Error handling is comprehensive
- [ ] Type safety is maintained (no `any`)
- [ ] Performance implications considered
- [ ] Security implications considered
- [ ] Test coverage is adequate

---

**Enforcement**: Pre-commit hooks + CI checks
**Exceptions**: Request approval for deviations in PR description
**Updates**: Review quarterly or after major refactoring
