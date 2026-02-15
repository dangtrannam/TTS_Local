/**
 * Configuration manager for TTS CLI
 * Handles reading, writing, validating, and resetting user configuration
 */
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { getAppPaths } from '@tts-local/core';
import { TTSError, TTSErrorCode } from '@tts-local/types';

export interface TTSConfig {
  defaultVoice: string;
  speed: number;
}

// Default configuration values
const DEFAULT_CONFIG: TTSConfig = {
  defaultVoice: 'en_US-amy-medium',
  speed: 1.0,
};

// Validation rules
const CONFIG_SCHEMA = {
  defaultVoice: {
    type: 'string' as const,
    validate: (value: string) => value.length > 0,
    errorMessage: 'defaultVoice must be a non-empty string',
  },
  speed: {
    type: 'number' as const,
    validate: (value: number) => value >= 0.5 && value <= 2.0,
    errorMessage: 'speed must be between 0.5 and 2.0',
  },
} as const;

/**
 * Get path to config file
 */
function getConfigPath(): string {
  const { config } = getAppPaths();
  return join(config, 'settings.json');
}

/**
 * Read configuration from file
 * Merges with defaults for missing keys
 *
 * @returns Current configuration with defaults applied
 */
export async function getConfig(): Promise<TTSConfig> {
  const configPath = getConfigPath();

  try {
    const content = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Merge with defaults to handle missing keys
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
  } catch (error) {
    // If file doesn't exist or is invalid, return defaults
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_CONFIG };
    }

    // JSON parse error - return defaults and warn
    if (error instanceof SyntaxError) {
      console.warn('⚠ Config file is corrupted, using defaults');
      return { ...DEFAULT_CONFIG };
    }

    // Other errors
    throw new TTSError(
      TTSErrorCode.CONFIG_READ_ERROR,
      `Failed to read config: ${(error as Error).message}`,
    );
  }
}

/**
 * Set a configuration value
 * Validates the key and value before saving
 *
 * @param key Configuration key to set
 * @param value Value to set (will be parsed to appropriate type)
 * @throws TTSError if key is invalid or value fails validation
 */
export async function setConfig(key: string, value: string): Promise<void> {
  // Check if key is valid
  if (!(key in CONFIG_SCHEMA)) {
    const validKeys = Object.keys(CONFIG_SCHEMA).join(', ');
    throw new TTSError(
      TTSErrorCode.INVALID_CONFIG_KEY,
      `Unknown config key: ${key}. Valid keys: ${validKeys}`,
    );
  }

  const schema = CONFIG_SCHEMA[key as keyof typeof CONFIG_SCHEMA];

  // Parse and validate value based on schema type
  let parsedValue: string | number;

  if (schema.type === 'number') {
    parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      throw new TTSError(TTSErrorCode.INVALID_CONFIG_VALUE, `Value for ${key} must be a number`);
    }
  } else {
    parsedValue = value;
  }

  // Validate using schema validator
  if (!schema.validate(parsedValue as never)) {
    throw new TTSError(TTSErrorCode.INVALID_CONFIG_VALUE, schema.errorMessage);
  }

  // Read current config and update
  const currentConfig = await getConfig();
  const updatedConfig = {
    ...currentConfig,
    [key]: parsedValue,
  };

  // Write updated config
  await writeConfig(updatedConfig);
}

/**
 * Reset configuration to defaults
 * Deletes the config file so defaults take effect
 */
export async function resetConfig(): Promise<void> {
  const configPath = getConfigPath();

  try {
    await unlink(configPath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new TTSError(
        TTSErrorCode.CONFIG_RESET_ERROR,
        `Failed to reset config: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * Write configuration to file
 * Creates config directory if it doesn't exist
 *
 * @param config Configuration object to write
 */
async function writeConfig(config: TTSConfig): Promise<void> {
  const configPath = getConfigPath();
  const { config: configDir } = getAppPaths();

  try {
    // Ensure config directory exists
    await mkdir(configDir, { recursive: true });

    // Write config file with pretty formatting
    const content = JSON.stringify(config, null, 2);
    await writeFile(configPath, content, {
      encoding: 'utf-8',
      mode: 0o600, // Owner-only read/write on Unix
    });
  } catch (error) {
    throw new TTSError(
      TTSErrorCode.CONFIG_WRITE_ERROR,
      `Failed to write config: ${(error as Error).message}`,
    );
  }
}

/**
 * Get default configuration
 * @returns Default configuration object
 */
export function getDefaultConfig(): TTSConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Validate entire config object
 * @param config Config object to validate
 * @returns True if valid
 * @throws TTSError if validation fails
 */
export function validateConfig(config: unknown): config is TTSConfig {
  if (typeof config !== 'object' || config === null) {
    throw new TTSError(TTSErrorCode.INVALID_CONFIG, 'Config must be an object');
  }

  const obj = config as Record<string, unknown>;

  // Validate each key in schema
  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    if (key in obj) {
      const value = obj[key];

      // Type check
      if (typeof value !== schema.type) {
        throw new TTSError(
          TTSErrorCode.INVALID_CONFIG,
          `Config key ${key} must be of type ${schema.type}`,
        );
      }

      // Validation check
      if (!schema.validate(value as never)) {
        throw new TTSError(TTSErrorCode.INVALID_CONFIG, schema.errorMessage);
      }
    }
  }

  return true;
}
