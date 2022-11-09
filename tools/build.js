/* eslint-disable no-console */
const esbuild = require('esbuild');
const chokidar = require('chokidar');
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
  watch: false,
};

const build = async () => {
  await Promise.all([
    esbuild.build({
      ...options,
      entryPoints: ['src/entries/lib.ts', 'src/entries/cli.ts'],
      outdir: './',
      assetNames: '[name].[ext]',
    }),
    esbuild.build({
      ...options,
      entryPoints: ['src/entries/lib.ts'],
      format: 'esm',
      outfile: './lib.esm.js',
    }),
  ]);
};

build()
  .then(() => {
    if (process.argv.includes('--dev')) {
      console.log('Watching for changes...');

      const watcher = chokidar.watch('./src/**/*.ts', {
        persistent: true,
      });

      watcher.on('change', async () => {
        console.log('Rebuilding...');
        await build();
      });
    }
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
