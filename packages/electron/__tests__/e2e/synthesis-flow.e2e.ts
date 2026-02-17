import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainPath = path.join(__dirname, '../../dist/main/index.js');
const ciArgs = process.env.ELECTRON_DISABLE_SANDBOX
  ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  : [];
const launchArgs = [mainPath, ...ciArgs];

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: launchArgs,
    timeout: 60000,
  });
  window = await electronApp.firstWindow({ timeout: 60000 });
});

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test.describe('Text Input', () => {
  test('can type text in textarea', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Hello world');

    const value = await textarea.inputValue();
    expect(value).toBe('Hello world');
  });

  test('can clear textarea', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Some text');
    await textarea.fill('');

    const value = await textarea.inputValue();
    expect(value).toBe('');
  });

  test('textarea accepts long text', async () => {
    const textarea = window.locator('textarea');
    const longText = 'A'.repeat(500);
    await textarea.fill(longText);

    const value = await textarea.inputValue();
    expect(value.length).toBe(500);

    // Clean up
    await textarea.fill('');
  });
});

test.describe('UI Interaction', () => {
  test('status indicator shows current state', async () => {
    const status = window.locator('[data-testid="status"]');
    const text = await status.textContent();
    expect(text).toBeTruthy();
  });

  test('no console errors on idle page', async () => {
    const errors: string[] = [];
    window.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to collect any errors
    await window.waitForTimeout(2000);

    // Filter out expected warnings (e.g., missing piper binary)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('piper') && !e.includes('setup') && !e.includes('tray'),
    );
    expect(unexpectedErrors.length).toBe(0);
  });
});

test.describe('Synthesis Flow (requires TTS setup)', () => {
  // These tests require piper binary and voice models to be installed
  // Skip on CI where TTS is not set up
  test.skip('Speak button triggers synthesis', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Test synthesis');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    await window.waitForTimeout(1000);
    const status = await window.locator('[data-testid="status"]').textContent();
    expect(status).toBeTruthy();
  });

  test.skip('voice selector changes voice', async () => {
    // Voice selector is in Settings modal
    const settingsButton = window.locator('button:has-text("Settings")');
    await settingsButton.click();

    const voiceSelect = window.locator('select[data-testid="voice-selector"]');
    await expect(voiceSelect).toBeVisible();
  });

  test.skip('speed slider changes speed value', async () => {
    // Speed slider is in Settings modal
    const settingsButton = window.locator('button:has-text("Settings")');
    await settingsButton.click();

    const speedSlider = window.locator('input[type="range"][data-testid="speed-slider"]');
    await expect(speedSlider).toBeVisible();
  });

  test.skip('Ctrl+Enter keyboard shortcut triggers synthesis', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Keyboard shortcut test');

    await window.keyboard.press('Control+Enter');
    await window.waitForTimeout(500);

    const status = await window.locator('[data-testid="status"]').textContent();
    expect(status).toBeTruthy();
  });

  test.skip('Escape key stops playback', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Stop test');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    await window.waitForTimeout(300);
    await window.keyboard.press('Escape');

    await window.waitForTimeout(200);
    const status = await window.locator('[data-testid="status"]').textContent();
    expect(status).toContain('Ready');
  });

  test.skip('displays error message for empty input', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    const error = await window.locator('[data-testid="error-message"]').textContent();
    expect(error).toBeTruthy();
  });
});
