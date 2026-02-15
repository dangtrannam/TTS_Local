#!/usr/bin/env node
import { chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binPath = join(__dirname, '../dist/bin.js');

try {
  await chmod(binPath, 0o755);
  console.log('✓ Made dist/bin.js executable');
} catch (error) {
  console.error('Failed to make bin.js executable:', error.message);
  process.exit(1);
}
