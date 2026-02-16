Here's how to use the CLI immediately:

Option 1: Quick Test (Recommended)

# From project root

cd packages/cli

# Test help command

pnpm exec tsx src/bin.ts --help

# Download Piper binary and voice model (first time only, ~2 min)

pnpm exec tsx src/bin.ts setup

# Speak your first text!

pnpm exec tsx src/bin.ts speak "Hello, this is my text to speech system!"

# Try other features

pnpm exec tsx src/bin.ts speak --file README.md
echo "Testing stdin" | pnpm exec tsx src/bin.ts speak
pnpm exec tsx src/bin.ts speak --output hello.wav "Save to file"
pnpm exec tsx src/bin.ts voices
pnpm exec tsx src/bin.ts config

Option 2: Install Globally (Permanent)

# Link CLI globally

cd packages/cli
pnpm link --global

# Now use 'tts' command anywhere!

tts setup
tts speak "Hello world!"
tts --help

What Happens on First Run:

1. tts setup downloads:


    - Piper TTS binary (~15MB) to ~/Library/Application Support/tts-local/bin/
    - Voice model (~40MB) to ~/Library/Application Support/tts-local/models/

2. Takes ~1-2 minutes depending on connection
3. After setup, tts speak works instantly!

Current Capabilities:

✅ Text-to-speech - Synthesize and play audio
✅ Multiple inputs - Direct text, file, or stdin pipe
✅ Audio output - Play via afplay (macOS) or save to WAV
✅ Configuration - Customize voice and speed
✅ Voice management - List installed models

Ready to try it? Run the setup command and let me know if you hear the audio! 🔊
