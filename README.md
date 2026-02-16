# TTS_Local

> High-quality, privacy-first, local text-to-speech powered by Piper TTS

TTS_Local is a cross-platform text-to-speech application that runs entirely on your device. No cloud services, no API fees, no data collection—just fast, neural-powered voice synthesis that respects your privacy.

## ✨ Features

- **🔒 100% Local Processing** - All synthesis happens on your device, no data leaves your computer
- **🎯 High-Quality Neural Voices** - Powered by Piper TTS with VITS neural architecture
- **💰 Zero Cost** - No API fees, unlimited usage
- **🚀 Fast Synthesis** - Sub-100ms latency for cached resources
- **🎭 Multiple Voices** - Choose from various English voices (US, GB regions)
- **⚙️ Configurable** - Adjust speech speed, select default voice
- **🖥️ Cross-Platform** - macOS, Linux, and Windows support
- **📦 Automatic Setup** - Binary and voice models download automatically

## 🎯 Use Cases

- Read articles, documents, and emails aloud
- Convert text files to audio
- Accessibility support for visually impaired users
- Voiceover generation for videos and presentations
- Development testing for voice-enabled applications

## 📋 Prerequisites

- **Node.js** 18 or higher
- **Python 3** (for Piper TTS installation)
- **pnpm** (package manager)
- **espeak-ng** (audio library dependency)

### Installing espeak-ng

#### macOS

```bash
brew install espeak-ng
```

#### Ubuntu/Debian

```bash
sudo apt-get install espeak-ng
```

#### Windows

Download from [espeak-ng releases](https://github.com/espeak-ng/espeak-ng/releases)

## 🚀 Quick Start

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/dangtrannam/TTS_Local.git
   cd TTS_Local
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build the project**

   ```bash
   pnpm build
   ```

4. **Set up Piper TTS**

   ```bash
   cd packages/cli
   pnpm exec tts setup
   ```

   This will:
   - Install Piper TTS via pip
   - Download the default voice model (en_US-amy-medium)
   - Create configuration file

### Usage

#### Basic Text-to-Speech

Speak text directly:

```bash
pnpm exec tts speak "Hello, this is a text to speech test"
```

#### Read from File

Speak contents of a text file:

```bash
pnpm exec tts speak --file document.txt
```

#### Read from Stdin

Pipe text from other commands:

```bash
echo "Hello from stdin" | pnpm exec tts speak
cat article.txt | pnpm exec tts speak
```

#### Save to Audio File

Generate WAV file without playing:

```bash
pnpm exec tts speak -o output.wav "Save this to a file"
pnpm exec tts speak --output audio.wav "Another example"
```

#### Adjust Speech Speed

Control playback speed (0.5 to 2.0):

```bash
pnpm exec tts speak -s 1.5 "Speaking faster"
pnpm exec tts speak --speed 0.8 "Speaking slower"
```

#### Use Specific Voice

Override default voice:

```bash
pnpm exec tts speak -v en_GB-jenny-medium "British accent"
pnpm exec tts speak --voice en_US-ryan-high "High quality US voice"
```

#### Increase Timeout for Long Files

For very long texts (like large documents), increase the synthesis timeout:

```bash
# Default timeout is 30 seconds (30000ms)
pnpm exec tts speak --file README.md --timeout 120000  # 2 minutes
pnpm exec tts speak -f long-document.txt -t 300000     # 5 minutes

# Combine with other options
pnpm exec tts speak -f README.md -s 1.5 -t 180000 -o output.wav
```

### Voice Management

#### List Installed Voices

```bash
pnpm exec tts voices
```

Output:

```
Installed Voice Models:

* en_US-amy-medium (default) - 63.2 MB

Total: 1 voice model(s)
```

#### Download Additional Voices

```bash
pnpm exec tts setup
```

Select from available voices:

- `en_US-amy-medium` - US English, female, medium quality
- `en_US-ryan-high` - US English, male, high quality
- `en_GB-jenny-medium` - British English, female, medium quality

### Configuration

#### Show Current Config

```bash
pnpm exec tts config
# or
pnpm exec tts config show
```

Output:

```
Current Configuration:

  defaultVoice: en_US-amy-medium
  speed: 1.0 (default)

Available settings:
  defaultVoice - Voice model name (e.g., en_US-amy-medium)
  speed        - Speech rate from 0.5 to 2.0 (1.0 is normal)
```

#### Change Default Voice

```bash
pnpm exec tts config set defaultVoice en_US-ryan-high
```

#### Change Default Speed

```bash
pnpm exec tts config set speed 1.2
```

#### Reset to Defaults

```bash
pnpm exec tts config reset
```

### Global Installation (Optional)

For system-wide access without `pnpm exec`:

```bash
cd packages/cli
pnpm link --global
```

Then use directly:

```bash
tts speak "Now available globally"
tts voices
tts config
```

## 🏗️ Architecture

TTS_Local is built as a TypeScript monorepo with the following packages:

```
├── packages/
│   ├── types/          # Shared TypeScript types
│   ├── core/           # Piper TTS integration
│   └── cli/            # Command-line interface
```

### Core Components

- **PiperTTSService** - Main API for text-to-speech synthesis
- **PiperBinaryManager** - Manages Piper installation via pip
- **PiperVoiceManager** - Downloads and manages voice models
- **PiperProcessRunner** - Executes Piper binary subprocess

### Technology Stack

- **Runtime**: Node.js 18+ LTS
- **Language**: TypeScript 5+
- **Package Manager**: pnpm (workspaces)
- **TTS Engine**: Piper TTS 1.4.1 (via PyPI)
- **CLI Framework**: Commander.js
- **Process Execution**: execa
- **Audio Playback**: Platform-specific (afplay, aplay, PowerShell)

## 🛠️ Development

### Setup Development Environment

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

### Project Structure

```
TTS_Local/
├── packages/
│   ├── types/
│   │   └── src/
│   │       ├── tts-types.ts           # TTS interfaces
│   │       └── error-types.ts         # Error codes
│   ├── core/
│   │   └── src/
│   │       ├── index.ts               # Public API
│   │       ├── piper-tts-service.ts   # Main service
│   │       ├── services/              # Core services
│   │       └── utils/                 # Utilities
│   └── cli/
│       └── src/
│           ├── bin.ts                 # CLI entry point
│           ├── index.ts               # Main CLI
│           ├── commands/              # Command implementations
│           └── utils/                 # CLI utilities
├── docs/                              # Documentation
├── plans/                             # Implementation plans
└── package.json                       # Workspace root
```

### Running in Development Mode

```bash
# Watch mode for CLI
cd packages/cli
pnpm dev
```

### Adding New Commands

Commands are located in `packages/cli/src/commands/`:

- `speak-command.ts` - Text-to-speech synthesis
- `setup-command.ts` - Binary and voice setup
- `voices-command.ts` - Voice listing
- `config-command.ts` - Configuration management

## 📊 Performance

- **First Synthesis**: < 5s (including downloads)
- **Cached Synthesis**: < 100ms
- **Memory Usage**: < 100MB during synthesis
- **Disk Usage**: < 100MB (binary + 2 voices)

## 🔒 Privacy & Security

- **No Telemetry** - Zero usage data collection
- **No Cloud Services** - All processing happens locally
- **No Credentials** - No API keys or tokens required
- **No Network** - Except initial downloads (opt-in)

## 🐛 Troubleshooting

### "Piper binary not found"

Run setup to install Piper:

```bash
pnpm exec tts setup
```

### "Library not loaded: libespeak-ng"

Install espeak-ng:

```bash
# macOS
brew install espeak-ng

# Ubuntu/Debian
sudo apt-get install espeak-ng
```

### "Voice model not found"

Download voice model:

```bash
pnpm exec tts setup
```

### "Permission denied"

Make binary executable (Unix/Linux):

```bash
chmod +x ~/Library/Python/3.12/bin/piper  # macOS
chmod +x ~/.local/bin/piper               # Linux
```

## 📝 Documentation

- [Project Overview](./docs/project-overview-pdr.md) - Product requirements and vision
- [System Architecture](./docs/system-architecture.md) - Technical architecture details
- [Code Standards](./docs/code-standards.md) - Coding conventions and guidelines
- [Codebase Summary](./docs/codebase-summary.md) - Package overview

## 🗺️ Roadmap

- [x] **Phase 01**: Foundation & Monorepo Setup
- [x] **Phase 02**: Core TTS Implementation
- [x] **Phase 03**: CLI Application
- [ ] **Phase 04**: Desktop Application (Electron GUI)
- [ ] **Phase 05**: Testing & Finalization

See [Project Roadmap](./docs/project-roadmap.md) for detailed milestones.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Piper TTS](https://github.com/rhasspy/piper) - Fast, local neural text-to-speech
- [HuggingFace](https://huggingface.co/rhasspy/piper-voices) - Voice model hosting
- [VITS](https://arxiv.org/abs/2106.06103) - Neural TTS architecture

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/dangtrannam/TTS_Local/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dangtrannam/TTS_Local/discussions)

---

**Made with ❤️ by the dangtrannam**
