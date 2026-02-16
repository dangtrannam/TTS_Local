import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'node:path';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js')],
  });

  // Wait for the first window
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Electron App Launch', () => {
  test('app launches successfully', async () => {
    expect(electronApp).toBeTruthy();
    expect(window).toBeTruthy();
  });

  test('window has correct title', async () => {
    const title = await window.title();
    expect(title).toContain('TTS Local');
  });

  test('window displays text input area', async () => {
    const textarea = window.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('window displays Speak button', async () => {
    const speakButton = window.locator('button:has-text("Speak")');
    await expect(speakButton).toBeVisible();
  });

  test('window displays voice selector', async () => {
    const voiceSelect = window.locator('select[data-testid="voice-selector"]');
    await expect(voiceSelect).toBeVisible();
  });

  test('window displays speed control', async () => {
    const speedInput = window.locator('input[type="range"][data-testid="speed-slider"]');
    await expect(speedInput).toBeVisible();
  });

  test('app has proper window dimensions', async () => {
    const size = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    expect(size.width).toBeGreaterThan(600);
    expect(size.height).toBeGreaterThan(400);
  });

  test('window is not in fullscreen mode initially', async () => {
    const isFullscreen = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getFocusedWindow();
      return win?.isFullScreen() ?? false;
    });

    expect(isFullscreen).toBe(false);
  });

  test('window can be focused', async () => {
    await window.focus();
    const isFocused = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getFocusedWindow();
      return win?.isFocused() ?? false;
    });

    expect(isFocused).toBe(true);
  });
});

test.describe('App Menu', () => {
  test('app has menu bar', async () => {
    const hasMenu = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getFocusedWindow();
      return win?.menuBarVisible !== false;
    });

    expect(hasMenu).toBeTruthy();
  });
});

test.describe('Initial State', () => {
  test('textarea is empty initially', async () => {
    const textarea = window.locator('textarea');
    const value = await textarea.inputValue();

    expect(value).toBe('');
  });

  test('Speak button is enabled', async () => {
    const speakButton = window.locator('button:has-text("Speak")');
    const isDisabled = await speakButton.isDisabled();

    expect(isDisabled).toBe(false);
  });

  test('default voice is selected', async () => {
    const voiceSelect = window.locator('select[data-testid="voice-selector"]');
    const value = await voiceSelect.inputValue();

    expect(value).toBeTruthy();
  });

  test('default speed is 1.0', async () => {
    const speedInput = window.locator('input[type="range"][data-testid="speed-slider"]');
    const value = await speedInput.inputValue();

    expect(parseFloat(value)).toBe(1.0);
  });
});
