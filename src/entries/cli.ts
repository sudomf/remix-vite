/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { config } from 'dotenv';
import { createRequestHandler } from '@remix-run/express';
import args from 'args';
import { createRemixViteDevServer, getRemixViteBuild } from '../vite';
import type { RemixViteServerOptions } from '../vite';

config();

args
  .option('host', 'The host on which the app will be running', 'localhost')
  .option('port', 'The port on which the app will be running', 3000);

const flags = args.parse(process.argv) as RemixViteServerOptions;

const mode = 'development';

async function createServer() {
  const app = express();

  app.use(express.static('public', { maxAge: '1h' }));

  const viteDevServer = await createRemixViteDevServer();

  // use vite's connect instance as middleware
  // if you use your own express router (express.Router()), you should use router.use
  app.use(viteDevServer.middlewares);

  app.all('*', async (req, res, next) => {
    try {
      const build = await getRemixViteBuild(viteDevServer);
      const handler = createRequestHandler({
        build,
        mode,
      });

      return handler(req, res, next);
    } catch (e: any) {
      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      viteDevServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.listen(flags.port!, flags.host!, () => {
    console.log(`🖲 remix-vite started at http://${flags.host!}:${flags.port!}`);
  });
}

createServer().catch((e) => {
  console.error(e);
  process.exit(1);
});
