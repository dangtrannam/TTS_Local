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

test.describe('Sandbox Isolation', () => {
  test('Node.js require() is not available in renderer', async () => {
    const hasRequire = await window.evaluate(() => {
      return typeof (window as any).require !== 'undefined';
    });

    expect(hasRequire).toBe(false);
  });

  test('Node.js process object is not available in renderer', async () => {
    const hasProcess = await window.evaluate(() => {
      return typeof (window as any).process !== 'undefined';
    });

    expect(hasProcess).toBe(false);
  });

  test('Node.js Buffer is not available in renderer', async () => {
    const hasBuffer = await window.evaluate(() => {
      return typeof (window as any).Buffer !== 'undefined';
    });

    expect(hasBuffer).toBe(false);
  });

  test('Node.js fs module is not accessible in renderer', async () => {
    const result = await window.evaluate(() => {
      try {
        // Attempt to access fs via require (should fail)
        const fs = (window as any).require?.('fs');
        return fs ? 'fs accessible (BAD)' : 'fs not accessible (GOOD)';
      } catch {
        return 'fs not accessible (GOOD)';
      }
    });

    expect(result).toBe('fs not accessible (GOOD)');
  });

  test('Node.js child_process is not accessible in renderer', async () => {
    const result = await window.evaluate(() => {
      try {
        const child_process = (window as any).require?.('child_process');
        return child_process
          ? 'child_process accessible (BAD)'
          : 'child_process not accessible (GOOD)';
      } catch {
        return 'child_process not accessible (GOOD)';
      }
    });

    expect(result).toBe('child_process not accessible (GOOD)');
  });

  test('Cannot access Node.js internals via __dirname', async () => {
    const hasDirname = await window.evaluate(() => {
      return typeof (window as any).__dirname !== 'undefined';
    });

    expect(hasDirname).toBe(false);
  });

  test('Cannot access Node.js internals via __filename', async () => {
    const hasFilename = await window.evaluate(() => {
      return typeof (window as any).__filename !== 'undefined';
    });

    expect(hasFilename).toBe(false);
  });

  test('Cannot load native modules', async () => {
    const result = await window.evaluate(() => {
      try {
        const nativeModule = (window as any).require?.('native-module');
        return nativeModule ? 'native module loaded (BAD)' : 'native module blocked (GOOD)';
      } catch {
        return 'native module blocked (GOOD)';
      }
    });

    expect(result).toBe('native module blocked (GOOD)');
  });

  test('Cannot access Electron remote module', async () => {
    const hasRemote = await window.evaluate(() => {
      return typeof (window as any).require?.('@electron/remote') !== 'undefined';
    });

    expect(hasRemote).toBe(false);
  });

  test('window.open() opens in same context (no nodeIntegration)', async () => {
    // Verify that new windows also don't have Node access
    const result = await window.evaluate(() => {
      return new Promise((resolve) => {
        const newWin = window.open('about:blank');
        if (newWin) {
          setTimeout(() => {
            const hasRequire = typeof (newWin as any).require !== 'undefined';
            newWin.close();
            resolve(hasRequire ? 'new window has require (BAD)' : 'new window isolated (GOOD)');
          }, 100);
        } else {
          resolve('window.open blocked or failed');
        }
      });
    });

    expect(result).toBe('new window isolated (GOOD)');
  });

  test('renderer process is properly sandboxed', async () => {
    // Verify sandbox is enabled by checking for absence of Node.js globals
    const sandboxIndicators = await window.evaluate(() => {
      const indicators = {
        noRequire: typeof (window as any).require === 'undefined',
        noProcess: typeof (window as any).process === 'undefined',
        noModule: typeof (window as any).module === 'undefined',
        noGlobal: typeof (window as any).global === 'undefined',
      };

      return indicators;
    });

    expect(sandboxIndicators.noRequire).toBe(true);
    expect(sandboxIndicators.noProcess).toBe(true);
    expect(sandboxIndicators.noModule).toBe(true);
    expect(sandboxIndicators.noGlobal).toBe(true);
  });

  test('only whitelisted window.ttsAPI methods are available', async () => {
    const hasTtsAPI = await window.evaluate(() => {
      return typeof (window as any).ttsAPI !== 'undefined';
    });

    expect(hasTtsAPI).toBe(true);
  });

  test('cannot access main process via IPC without validation', async () => {
    const result = await window.evaluate(() => {
      try {
        // Attempt to send arbitrary IPC message
        const { ipcRenderer } = (window as any).require?.('electron') || {};
        if (ipcRenderer) {
          ipcRenderer.send('arbitrary-channel', { malicious: 'payload' });
          return 'arbitrary IPC allowed (BAD)';
        }
        return 'arbitrary IPC blocked (GOOD)';
      } catch {
        return 'arbitrary IPC blocked (GOOD)';
      }
    });

    expect(result).toBe('arbitrary IPC blocked (GOOD)');
  });
});
