#!/usr/bin/env node

import { build } from 'esbuild';
import { chmod } from 'fs/promises';

try {
  // Bundle the CLI
  await build({
    entryPoints: ['src/cli/cli.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/passenger.js',
    external: [
      // External native modules that can't be bundled
      'fsevents'
    ],
    minify: false,
    sourcemap: true,
  });

  // Make the output executable
  await chmod('dist/passenger.js', 0o755);

  console.log('🐦 Build complete! Executable created at dist/passenger.js');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
