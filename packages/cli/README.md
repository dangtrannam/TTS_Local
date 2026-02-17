# @tts-local/cli

> High-quality, privacy-first, local text-to-speech command-line tool powered by Piper TTS

Convert text to speech entirely on your device. No cloud services, no API fees, no data collection—just fast, neural-powered voice synthesis.

## Installation

```bash
npm install -g @tts-local/cli
```

## Requirements

- **Node.js** 18 or higher
- **Python 3** (for Piper TTS installation)
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

## Quick Start

### 1. Initial Setup

After installation, run setup to install Piper TTS and download the default voice:

```bash
tts setup
```

This will:
- Install Piper TTS via pip
- Download the default voice model (en_US-amy-medium)
- Create configuration file

### 2. Basic Usage

Speak text directly:

```bash
tts speak "Hello, this is a text to speech test"
```

Read from file:

```bash
tts speak --file document.txt
```

Read from stdin:

```bash
echo "Hello from stdin" | tts speak
cat article.txt | tts speak
```

Save to audio file:

```bash
tts speak -o output.wav "Save this to a file"
```

## Commands

### `tts speak [text]`

Synthesize text to speech.

**Options:**
- `-f, --file <path>` - Read text from file
- `-o, --output <path>` - Save to WAV file instead of playing
- `-s, --speed <rate>` - Speech speed (0.5 to 2.0, default: 1.0)
- `-v, --voice <name>` - Voice model to use
- `-t, --timeout <ms>` - Synthesis timeout in milliseconds (default: 30000)

**Examples:**

```bash
# Speak with faster speed
tts speak -s 1.5 "Speaking faster"

# Use specific voice
tts speak -v en_GB-jenny-medium "British accent"

# Long document with extended timeout
tts speak -f README.md -t 120000

# Combine options
tts speak -f README.md -s 1.5 -t 180000 -o output.wav
```

### `tts setup`

Install Piper TTS and download voice models.

**Interactive prompts:**
- Select voice models to download
- Configure default settings

### `tts voices`

List installed voice models.

**Output:**
```
Installed Voice Models:

* en_US-amy-medium (default) - 63.2 MB
  en_US-ryan-high - 47.8 MB

Total: 2 voice model(s)
```

### `tts config`

Manage configuration settings.

**Subcommands:**
- `tts config show` - Display current configuration (default)
- `tts config set <key> <value>` - Update setting
- `tts config reset` - Reset to defaults

**Available settings:**
- `defaultVoice` - Voice model name (e.g., en_US-amy-medium)
- `speed` - Speech rate from 0.5 to 2.0 (1.0 is normal)

**Examples:**

```bash
# View current config
tts config

# Change default voice
tts config set defaultVoice en_US-ryan-high

# Change default speed
tts config set speed 1.2

# Reset to defaults
tts config reset
```

## Available Voices

- `en_US-amy-medium` - US English, female, medium quality (default)
- `en_US-ryan-high` - US English, male, high quality
- `en_GB-jenny-medium` - British English, female, medium quality

Download additional voices with `tts setup`.

## Features

- **🔒 100% Local Processing** - All synthesis happens on your device
- **🎯 High-Quality Neural Voices** - Powered by Piper TTS with VITS architecture
- **💰 Zero Cost** - No API fees, unlimited usage
- **🚀 Fast Synthesis** - Sub-100ms latency for cached resources
- **🎭 Multiple Voices** - Various English voices (US, GB regions)
- **⚙️ Configurable** - Adjust speech speed, select default voice

## Troubleshooting

### "Piper binary not found"

Run setup to install Piper:

```bash
tts setup
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
tts setup
```

### "Permission denied"

Make binary executable (Unix/Linux):

```bash
chmod +x ~/Library/Python/3.12/bin/piper  # macOS
chmod +x ~/.local/bin/piper               # Linux
```

## License

MIT

## Links

- [GitHub Repository](https://github.com/dangtrannam/TTS_Local)
- [Report Issues](https://github.com/dangtrannam/TTS_Local/issues)
- [Piper TTS](https://github.com/rhasspy/piper)
