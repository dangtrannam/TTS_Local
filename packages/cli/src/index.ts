/**
 * Commander.js program factory for tts-local CLI
 * Registers all available commands and configures the CLI interface
 */
import { Command } from 'commander';
import { registerSpeakCommand } from './commands/speak-command.js';
import { registerSetupCommand } from './commands/setup-command.js';
import { registerVoicesCommand } from './commands/voices-command.js';
import { registerConfigCommand } from './commands/config-command.js';

/**
 * Creates and configures the CLI program with all commands
 * @returns Configured Commander program instance
 */
export function createProgram(): Command {
  const program = new Command();

  program.name('tts').description('Local text-to-speech powered by Piper TTS').version('0.1.0');

  // Register all subcommands
  registerSpeakCommand(program);
  registerSetupCommand(program);
  registerVoicesCommand(program);
  registerConfigCommand(program);

  return program;
}
