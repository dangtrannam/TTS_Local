/**
 * CLI output utilities with ora spinners and chalk styling
 * Provides consistent formatting for success, error, info, and warning messages
 */
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { TTSError } from '@tts-local/types';
import { formatErrorForUser } from '@tts-local/core';

/**
 * Show a spinner with the given message
 * @param message Message to display next to spinner
 * @returns Ora spinner instance for control (stop, succeed, fail)
 */
export function showSpinner(message: string): Ora {
  return ora({
    text: message,
    color: 'cyan',
  }).start();
}

/**
 * Show a success message with green checkmark
 * @param message Success message to display
 */
export function showSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Show an error message with formatted TTSError details
 * @param error TTSError to format and display
 */
export function showError(error: TTSError): void {
  const formatted = formatErrorForUser(error);
  console.error(chalk.red('✗'), formatted);
}

/**
 * Show an info message with blue icon
 * @param message Info message to display
 */
export function showInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Show a warning message with yellow icon
 * @param message Warning message to display
 */
export function showWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Show a plain message without any icon or styling
 * @param message Message to display
 */
export function showMessage(message: string): void {
  console.log(message);
}

/**
 * Format duration in milliseconds to human-readable format
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "1.2s", "350ms")
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB", "340 KB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
