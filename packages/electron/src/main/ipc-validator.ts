/**
 * IPC message validation schema
 * Runtime schema validation for all IPC messages to prevent injection attacks
 */

interface IPCValidationResult {
  valid: boolean;
  error?: string;
}

interface IPCSchema {
  channel: string;
  validate: (args: unknown[]) => IPCValidationResult;
}

/**
 * Validation schemas for each IPC channel
 */
const schemas: IPCSchema[] = [
  {
    channel: 'tts:synthesize',
    validate: ([text, options]: unknown[]): IPCValidationResult => {
      // Validate text parameter
      if (typeof text !== 'string') {
        return { valid: false, error: 'text must be string' };
      }
      if (text.length === 0) {
        return { valid: false, error: 'text cannot be empty' };
      }
      if (text.length > 100_000) {
        return { valid: false, error: 'text exceeds 100K character limit' };
      }
      // Check for null bytes (security concern)
      if (text.includes('\0')) {
        return { valid: false, error: 'text contains null bytes' };
      }

      // Validate options parameter (optional)
      if (options !== undefined) {
        if (typeof options !== 'object' || options === null) {
          return { valid: false, error: 'options must be object' };
        }

        const opts = options as Record<string, unknown>;

        // Validate speed if provided
        if (opts.speed !== undefined) {
          if (typeof opts.speed !== 'number') {
            return { valid: false, error: 'speed must be number' };
          }
          if (opts.speed < 0.5 || opts.speed > 2.0) {
            return { valid: false, error: 'speed must be between 0.5 and 2.0' };
          }
        }

        // Validate voice if provided
        if (opts.voice !== undefined) {
          if (typeof opts.voice !== 'string') {
            return { valid: false, error: 'voice must be string' };
          }
          // Basic voice name validation (alphanumeric, hyphens, underscores)
          if (!/^[a-zA-Z0-9_-]+$/.test(opts.voice)) {
            return { valid: false, error: 'voice name contains invalid characters' };
          }
        }
      }

      return { valid: true };
    },
  },
  {
    channel: 'tts:set-config',
    validate: ([key, value]: unknown[]): IPCValidationResult => {
      const allowedKeys = ['defaultVoice', 'speed'];

      if (typeof key !== 'string') {
        return { valid: false, error: 'config key must be string' };
      }

      if (!allowedKeys.includes(key)) {
        return { valid: false, error: `Invalid config key: ${key}` };
      }

      // Validate value based on key
      if (key === 'speed') {
        if (typeof value !== 'number') {
          return { valid: false, error: 'speed must be number' };
        }
        if (value < 0.5 || value > 2.0) {
          return { valid: false, error: 'speed must be between 0.5 and 2.0' };
        }
      }

      if (key === 'defaultVoice') {
        if (typeof value !== 'string') {
          return { valid: false, error: 'defaultVoice must be string' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return { valid: false, error: 'voice name contains invalid characters' };
        }
      }

      return { valid: true };
    },
  },
];

/**
 * Validate IPC message arguments against registered schema
 * @param channel - IPC channel name
 * @param args - Arguments passed to the channel
 * @throws Error if validation fails
 */
export function validateIPC(channel: string, args: unknown[]): void {
  const schema = schemas.find((s) => s.channel === channel);

  // If no schema exists, assume it's a read-only channel (no validation needed)
  if (!schema) {
    return;
  }

  const result = schema.validate(args);
  if (!result.valid) {
    throw new Error(`IPC validation failed for ${channel}: ${result.error}`);
  }
}
