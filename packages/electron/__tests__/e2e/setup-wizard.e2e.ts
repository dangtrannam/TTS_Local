import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'node:path';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js')],
  });
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Setup Wizard', () => {
  test.skip('shows setup wizard when not ready', async () => {
    // This test requires mocking isReady to return false
    // In actual implementation, would set up test environment

    const wizard = window.locator('[data-testid="setup-wizard"]');
    await expect(wizard).toBeVisible();
  });

  test.skip('displays welcome message in wizard', async () => {
    const wizard = window.locator('[data-testid="setup-wizard"]');
    const welcomeText = await wizard.locator('h1').textContent();

    expect(welcomeText).toContain('Welcome');
  });

  test.skip('shows Download button in wizard', async () => {
    const downloadButton = window.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
  });

  test.skip('clicking Download starts setup process', async () => {
    const downloadButton = window.locator('button:has-text("Download")');
    await downloadButton.click();

    // Should show progress indicator
    const progressBar = window.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
  });

  test.skip('displays progress bar during download', async () => {
    const progressBar = window.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();

    // Progress should update
    await window.waitForTimeout(1000);
    const progress = await progressBar.getAttribute('value');
    expect(parseInt(progress || '0')).toBeGreaterThan(0);
  });

  test.skip('shows download percentage', async () => {
    const percentText = window.locator('[data-testid="progress-percent"]');
    const text = await percentText.textContent();

    expect(text).toMatch(/\d+%/);
  });

  test.skip('displays status messages during setup', async () => {
    const statusMessage = window.locator('[data-testid="setup-status"]');
    const message = await statusMessage.textContent();

    expect(message).toBeTruthy();
    expect(message).toMatch(/Downloading|Installing|Verifying/);
  });

  test.skip('wizard closes on successful setup', async () => {
    // Wait for setup to complete
    await window.waitForTimeout(5000);

    const wizard = window.locator('[data-testid="setup-wizard"]');
    await expect(wizard).not.toBeVisible();
  });

  test.skip('main interface becomes available after setup', async () => {
    const textarea = window.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
  });

  test.skip('shows error message if setup fails', async () => {
    // This requires mocking setup failure
    const errorMessage = window.locator('[data-testid="setup-error"]');
    await expect(errorMessage).toBeVisible();

    const text = await errorMessage.textContent();
    expect(text).toContain('failed');
  });

  test.skip('provides Retry button on setup failure', async () => {
    const retryButton = window.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });

  test.skip('clicking Retry restarts setup process', async () => {
    const retryButton = window.locator('button:has-text("Retry")');
    await retryButton.click();

    const progressBar = window.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
  });

  test.skip('Cancel button stops download', async () => {
    const downloadButton = window.locator('button:has-text("Download")');
    await downloadButton.click();

    const cancelButton = window.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Progress should stop
    const wizard = window.locator('[data-testid="setup-wizard"]');
    await expect(wizard).toBeVisible();
  });

  test.skip('displays estimated time remaining', async () => {
    const timeRemaining = window.locator('[data-testid="time-remaining"]');
    const text = await timeRemaining.textContent();

    expect(text).toMatch(/\d+\s*(second|minute)/);
  });
});
