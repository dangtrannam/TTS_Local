#!/usr/bin/env node
/**
 * CLI entry point for tts-local
 * This file serves as the executable entry when installed via npm
 */
import { createProgram } from './index.js';

const program = createProgram();
program.parse();
