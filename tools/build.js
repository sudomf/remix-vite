/* eslint-disable no-console */
const esbuild = require('esbuild');
const pkg = require('../package.json');

/**
 * @type {import('esbuild').BuildOptions}
 */
const options = {
  platform: 'node',
  target: 'node14',
  format: 'cjs',
  write: true,
  bundle: true,
  external: Object.keys(pkg.dependencies),
};

const run = async () => {
  await Promise.all([
    await esbuild.build({
      ...options,
      entryPoints: ['src/entries/lib.ts'],
      outfile: 'lib.js',
    }),
    await esbuild.build({
      ...options,
      entryPoints: ['src/entries/lib.ts'],
      outfile: 'lib.esm.js',
    }),
  ]);

  await esbuild.build({
    ...options,
    entryPoints: ['src/entries/cli.ts'],
    outfile: 'cli.js',
    banner: {
      js: '#!/usr/bin/env node',
    },
    watch: process.argv.includes('--watch'),
  });
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
