const esbuild = require('esbuild');
const pkg = require('./package.json');

esbuild.build({
  entryPoints: ['src/main.ts'],
  platform: 'node',
  target: 'node14',
  format: 'cjs',
  write: true,
  bundle: true,
  external: Object.keys(pkg.dependencies),
  outfile: 'remix-vite.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  watch: process.argv.includes('--watch'),
});
