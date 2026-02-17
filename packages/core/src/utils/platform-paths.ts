import path from 'node:path';
import os from 'node:os';

/**
 * Resolve platform-specific app data directories.
 * - macOS: ~/Library/Application Support/tts-local/
 * - Windows: %APPDATA%/tts-local/
 * - Linux: ~/.local/share/tts-local/
 */
function getBaseDir(): string {
  const platform = process.platform;
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'tts-local');
  }
  if (platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'tts-local',
    );
  }
  // Linux and others
  return path.join(
    process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
    'tts-local',
  );
}

export interface AppPaths {
  appData: string;
  bin: string;
  models: string;
  cache: string;
  config: string;
}

/** Returns all platform-specific app directories */
export function getAppPaths(): AppPaths {
  const base = getBaseDir();
  return {
    appData: base,
    bin: path.join(base, 'bin'),
    models: path.join(base, 'models'),
    cache: path.join(base, 'cache'),
    config: path.join(base, 'config'),
  };
}
