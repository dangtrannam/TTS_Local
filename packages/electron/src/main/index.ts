/**
 * Electron main process
 * SECURITY: Implements strict security configuration
 */

import { app, BrowserWindow, session } from 'electron';

// Signal to core packages whether this is a packaged build.
// process.resourcesPath exists in both dev and packaged, so we need this flag
// to distinguish them and prevent bundled-binary-not-found errors in dev mode.
if (app.isPackaged) {
  process.env.ELECTRON_IS_PACKAGED = '1';
}
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  configureSecurityHeaders,
  configurePermissions,
  registerSecureProtocols,
} from './security-config.js';
import { registerIPCHandlers, unregisterIPCHandlers } from './ipc-handlers.js';
import { createTray, destroyTray } from './tray-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Extend app with isQuitting flag
const appState = { isQuitting: false };

/**
 * Create main browser window with strict security configuration
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 500,
    minHeight: 400,
    title: 'TTS Local',
    webPreferences: {
      // SECURITY: Critical security settings
      nodeIntegration: false, // MANDATORY: No Node.js in renderer
      contextIsolation: true, // MANDATORY: Isolate renderer context
      sandbox: true, // MANDATORY: Run renderer in sandboxed process
      webSecurity: true, // Enforce same-origin policy
      allowRunningInsecureContent: false, // Block mixed content
      experimentalFeatures: false, // Disable experimental features
      // Preload script (only safe API exposed via contextBridge)
      preload: path.join(__dirname, '../preload/index.cjs'),
    },
  });

  // Block all navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  // Block all new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // DevTools: open manually with Cmd+Option+I (macOS) or F12 (Win/Linux)
  // Auto-opening is intentionally disabled to avoid Chromium DevTools log spam.

  // Load renderer HTML
  // Use ELECTRON_RENDERER_URL if set (electron-vite dev mode),
  // otherwise load from built files (production/testing/CI)
  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Register IPC handlers
  registerIPCHandlers(mainWindow);

  // Create system tray (may fail on headless CI environments)
  try {
    createTray(mainWindow);
  } catch (error) {
    console.warn('Failed to create system tray:', error);
  }

  // Handle window close (minimize to tray instead of quitting)
  mainWindow.on('close', (event) => {
    if (!appState.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

/**
 * App ready - configure security and create window
 */
app.on('ready', () => {
  // Configure strict security policies
  configureSecurityHeaders(session.defaultSession);
  configurePermissions(session.defaultSession);
  registerSecureProtocols();

  createWindow();
});

/**
 * All windows closed - quit on non-macOS platforms
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Activate - recreate window on macOS when dock icon is clicked
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Before quit - cleanup resources
 */
app.on('before-quit', () => {
  appState.isQuitting = true;
  unregisterIPCHandlers();
  destroyTray();
});

/**
 * Handle uncaught errors
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // In production, might want to log to file or show error dialog
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
