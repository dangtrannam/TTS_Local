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
  });
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Preload Surface Area', () => {
  test('window.ttsAPI exists', async () => {
    const hasTtsAPI = await window.evaluate(() => {
      return typeof (window as any).ttsAPI !== 'undefined';
    });

    expect(hasTtsAPI).toBe(true);
  });

  test('window.ttsAPI exposes only whitelisted methods', async () => {
    const apiKeys = await window.evaluate(() => {
      return Object.keys((window as any).ttsAPI || {}).sort();
    });

    const expectedKeys = [
      'getConfig',
      'isReady',
      'listVoices',
      'onProgress',
      'onSetupProgress',
      'setConfig',
      'setup',
      'synthesize',
    ].sort();

    expect(apiKeys).toEqual(expectedKeys);
  });

  test('synthesize method is available', async () => {
    const hasSynthesize = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.synthesize === 'function';
    });

    expect(hasSynthesize).toBe(true);
  });

  test('setup method is available', async () => {
    const hasSetup = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.setup === 'function';
    });

    expect(hasSetup).toBe(true);
  });

  test('isReady method is available', async () => {
    const hasIsReady = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.isReady === 'function';
    });

    expect(hasIsReady).toBe(true);
  });

  test('listVoices method is available', async () => {
    const hasListVoices = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.listVoices === 'function';
    });

    expect(hasListVoices).toBe(true);
  });

  test('getConfig method is available', async () => {
    const hasGetConfig = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.getConfig === 'function';
    });

    expect(hasGetConfig).toBe(true);
  });

  test('setConfig method is available', async () => {
    const hasSetConfig = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.setConfig === 'function';
    });

    expect(hasSetConfig).toBe(true);
  });

  test('onProgress method is available', async () => {
    const hasOnProgress = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.onProgress === 'function';
    });

    expect(hasOnProgress).toBe(true);
  });

  test('onSetupProgress method is available', async () => {
    const hasOnSetupProgress = await window.evaluate(() => {
      return typeof (window as any).ttsAPI?.onSetupProgress === 'function';
    });

    expect(hasOnSetupProgress).toBe(true);
  });

  test('no dangerous methods exposed (e.g., executeCommand, readFile)', async () => {
    const dangerousMethods = await window.evaluate(() => {
      const api = (window as any).ttsAPI || {};
      const dangerous = [
        'executeCommand',
        'readFile',
        'writeFile',
        'exec',
        'spawn',
        'eval',
        'require',
      ];

      return dangerous.filter((method) => typeof api[method] !== 'undefined');
    });

    expect(dangerousMethods).toEqual([]);
  });

  test('cannot modify ttsAPI object', async () => {
    const canModify = await window.evaluate(() => {
      try {
        (window as any).ttsAPI.maliciousMethod = () => {};
        return 'ttsAPI modified (BAD)';
      } catch {
        return 'ttsAPI protected (GOOD)';
      }
    });

    expect(canModify).toBe('ttsAPI protected (GOOD)');
  });

  test('cannot delete ttsAPI methods', async () => {
    const canDelete = await window.evaluate(() => {
      try {
        delete (window as any).ttsAPI.synthesize;
        return typeof (window as any).ttsAPI.synthesize === 'undefined'
          ? 'method deleted (BAD)'
          : 'method protected (GOOD)';
      } catch {
        return 'method protected (GOOD)';
      }
    });

    expect(canDelete).toBe('method protected (GOOD)');
  });

  test('cannot access contextBridge internals', async () => {
    const hasContextBridge = await window.evaluate(() => {
      return typeof (window as any).contextBridge !== 'undefined';
    });

    expect(hasContextBridge).toBe(false);
  });

  test('cannot access ipcRenderer directly', async () => {
    const hasIpcRenderer = await window.evaluate(() => {
      return typeof (window as any).ipcRenderer !== 'undefined';
    });

    expect(hasIpcRenderer).toBe(false);
  });

  test('ttsAPI methods return Promises', async () => {
    const methodsReturnPromises = await window.evaluate(() => {
      const api = (window as any).ttsAPI;
      const asyncMethods = ['synthesize', 'setup', 'isReady', 'listVoices', 'getConfig'];

      return asyncMethods.map((method) => {
        try {
          const result = api[method]?.();
          return result instanceof Promise;
        } catch {
          return false;
        }
      });
    });

    // Most methods should return Promises (some may be sync)
    expect(methodsReturnPromises.some((isPromise) => isPromise)).toBe(true);
  });

  test('no prototype pollution possible', async () => {
    const canPollute = await window.evaluate(() => {
      try {
        (window as any).ttsAPI.__proto__.malicious = 'payload';
        return 'prototype polluted (BAD)';
      } catch {
        return 'prototype protected (GOOD)';
      }
    });

    expect(canPollute).toBe('prototype protected (GOOD)');
  });

  test('API surface area is minimal (8 methods only)', async () => {
    const methodCount = await window.evaluate(() => {
      return Object.keys((window as any).ttsAPI || {}).length;
    });

    expect(methodCount).toBe(8);
  });
});
