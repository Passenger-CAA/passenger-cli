#!/usr/bin/env node

import { chmod } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make the passenger.js file executable
const binPath = join(__dirname, 'passenger.js');

try {
  await chmod(binPath, 0o755);
  console.log('🐦 Passenger binary configured successfully!');
} catch (error) {
  console.error('Failed to set executable permissions:', error.message);
  process.exit(1);
}
