/**
 * Helper utilities for Electron-specific features.
 * Safely accesses Electron properties that may not exist in Node.js environment.
 */

/**
 * Check if running in packaged Electron app and get resources path.
 * Returns undefined if not in Electron or not packaged.
 *
 * NOTE: This only returns the path if it exists. It does NOT verify that
 * specific resources (binaries, models) actually exist at that path.
 * Callers must check file existence separately.
 *
 * @returns Absolute path to Electron resources directory, or undefined if not packaged
 */
export function getElectronResourcesPath(): string | undefined {
  // TypeScript doesn't know about process.resourcesPath (Electron-specific)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const electronProcess = process as any;
  const resourcesPath = electronProcess.resourcesPath;

  // Runtime type validation
  if (resourcesPath !== undefined && typeof resourcesPath !== 'string') {
    throw new Error(`Expected process.resourcesPath to be string, got ${typeof resourcesPath}`);
  }

  return resourcesPath as string | undefined;
}

/**
 * Check if running in packaged Electron app.
 */
export function isPackagedElectronApp(): boolean {
  return getElectronResourcesPath() !== undefined;
}
