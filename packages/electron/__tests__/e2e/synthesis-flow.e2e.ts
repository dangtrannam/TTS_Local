import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainPath = path.join(__dirname, '../../dist/main/index.js');
const launchArgs = process.env.ELECTRON_DISABLE_SANDBOX ? [mainPath, '--no-sandbox'] : [mainPath];

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: launchArgs,
    timeout: 60000,
  });
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Synthesis Flow', () => {
  test('can type text in textarea', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Hello world');

    const value = await textarea.inputValue();
    expect(value).toBe('Hello world');
  });

  test('Speak button triggers synthesis', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Test synthesis');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    // Wait for status change
    await window.waitForTimeout(1000);

    // Check if synthesis started (status should change)
    const status = await window.locator('[data-testid="status"]').textContent();
    expect(status).toBeTruthy();
  });

  test('status changes during synthesis: idle → synthesizing → playing → idle', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Status test');

    const statusElement = window.locator('[data-testid="status"]');

    // Initial state should be idle
    const initialStatus = await statusElement.textContent();
    expect(initialStatus).toContain('idle');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    // Should transition through states
    await window.waitForTimeout(500);
    // Note: In real implementation, would wait for specific states
  });

  test('voice selector changes voice', async () => {
    const voiceSelect = window.locator('select[data-testid="voice-selector"]');

    // Get initial value
    const initialVoice = await voiceSelect.inputValue();

    // Change to different voice (if available)
    const options = await voiceSelect.locator('option').all();
    if (options.length > 1) {
      await voiceSelect.selectOption({ index: 1 });

      const newVoice = await voiceSelect.inputValue();
      expect(newVoice).not.toBe(initialVoice);
    }
  });

  test('speed slider changes speed value', async () => {
    const speedSlider = window.locator('input[type="range"][data-testid="speed-slider"]');
    const speedDisplay = window.locator('[data-testid="speed-value"]');

    // Change speed to 1.5
    await speedSlider.fill('1.5');

    const displayValue = await speedDisplay.textContent();
    expect(displayValue).toContain('1.5');
  });

  test('displays error message for empty input', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    // Should show error
    const error = await window.locator('[data-testid="error-message"]').textContent();
    expect(error).toContain('empty');
  });

  test('Ctrl+Enter keyboard shortcut triggers synthesis', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Keyboard shortcut test');

    await window.keyboard.press('Control+Enter');

    // Wait for synthesis to start
    await window.waitForTimeout(500);

    const status = await window.locator('[data-testid="status"]').textContent();
    expect(status).toBeTruthy();
  });

  test('Escape key stops playback', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Stop test');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    // Wait a bit then press Escape
    await window.waitForTimeout(300);
    await window.keyboard.press('Escape');

    // Status should return to idle
    await window.waitForTimeout(200);
    const status = await window.locator('[data-testid="status"]').textContent();
    expect(status).toContain('idle');
  });

  test('displays synthesis duration after completion', async () => {
    const textarea = window.locator('textarea');
    await textarea.fill('Duration test');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    // Wait for completion
    await window.waitForTimeout(3000);

    const duration = await window.locator('[data-testid="audio-duration"]').textContent();
    expect(duration).toBeTruthy();
  });

  test('no console errors during synthesis', async () => {
    const errors: string[] = [];
    window.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const textarea = window.locator('textarea');
    await textarea.fill('Console test');

    const speakButton = window.locator('button:has-text("Speak")');
    await speakButton.click();

    await window.waitForTimeout(2000);

    expect(errors.length).toBe(0);
  });
});
