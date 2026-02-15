/**
 * Config command implementation
 * Shows and manages CLI configuration
 */
import { Command } from 'commander';
import { TTSError } from '@tts-local/types';
import { getConfig, setConfig, resetConfig, getDefaultConfig } from '../utils/config-manager.js';
import { showSuccess, showError, showInfo } from '../utils/cli-output.js';
import chalk from 'chalk';

/**
 * Register the config command with Commander
 */
export function registerConfigCommand(program: Command): void {
  const configCmd = program.command('config').description('Show and manage configuration');

  // Show current config
  configCmd
    .command('show')
    .description('Show current configuration')
    .action(async () => {
      try {
        await handleShowConfig();
      } catch (error) {
        if (error instanceof TTSError) {
          showError(error);
          process.exit(1);
        }
        throw error;
      }
    });

  // Set config value
  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      try {
        await handleSetConfig(key, value);
      } catch (error) {
        if (error instanceof TTSError) {
          showError(error);
          process.exit(1);
        }
        throw error;
      }
    });

  // Reset config
  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .action(async () => {
      try {
        await handleResetConfig();
      } catch (error) {
        if (error instanceof TTSError) {
          showError(error);
          process.exit(1);
        }
        throw error;
      }
    });

  // Default action: show config
  configCmd.action(async () => {
    try {
      await handleShowConfig();
    } catch (error) {
      if (error instanceof TTSError) {
        showError(error);
        process.exit(1);
      }
      throw error;
    }
  });
}

/**
 * Handle show config command
 */
async function handleShowConfig(): Promise<void> {
  const config = await getConfig();
  const defaults = getDefaultConfig();

  console.log('\nCurrent Configuration:\n');

  // Display each config key with value and whether it's default
  for (const [key, value] of Object.entries(config)) {
    const isDefault = value === defaults[key as keyof typeof defaults];
    const valueStr = chalk.cyan(String(value));
    const defaultMarker = isDefault ? chalk.gray(' (default)') : '';

    console.log(`  ${chalk.bold(key)}: ${valueStr}${defaultMarker}`);
  }

  console.log('\nAvailable settings:');
  console.log('  defaultVoice - Voice model name (e.g., en_US-amy-medium)');
  console.log('  speed        - Speech rate from 0.5 to 2.0 (1.0 is normal)');

  console.log('\nUsage:');
  console.log('  tts config set defaultVoice en_US-ryan-high');
  console.log('  tts config set speed 1.2');
  console.log('  tts config reset\n');
}

/**
 * Handle set config command
 */
async function handleSetConfig(key: string, value: string): Promise<void> {
  await setConfig(key, value);
  showSuccess(`Configuration updated: ${key} = ${value}`);

  // Show hint for voices if setting defaultVoice
  if (key === 'defaultVoice') {
    showInfo('Run "tts voices" to see installed voice models');
  }
}

/**
 * Handle reset config command
 */
async function handleResetConfig(): Promise<void> {
  await resetConfig();
  showSuccess('Configuration reset to defaults');

  const defaults = getDefaultConfig();
  console.log('\nDefaults:');
  for (const [key, value] of Object.entries(defaults)) {
    console.log(`  ${key}: ${value}`);
  }
}
