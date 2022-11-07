import { createServer } from 'vite';
import vitePluginReact from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getHmrFixPlugin } from './plugins/hmr-fix';
import { getInjectPlugin } from './plugins/inject';
import { getRemixPlugin } from './plugins/remix';
import { getTransformPlugin } from './plugins/transform';
import { SERVER_ENTRY_ID } from './constants';
import type { ViteDevServer } from 'vite';
import type { ServerBuild } from '@remix-run/server-runtime';

/**
 * Get Remix build
 */
export const getRemixViteBuild = async (viteDevServer: ViteDevServer) => {
  const build = (await viteDevServer.ssrLoadModule(
    `virtual:${SERVER_ENTRY_ID}`,
  )) as ServerBuild;

  return build;
};

export interface RemixViteServerOptions {
  port?: number;
  host?: string;
}

/**
 * Create remix-vite dev server
 */
export const createRemixViteDevServer = async () => {
  const remixInject = getInjectPlugin();
  const remixPlugin = await getRemixPlugin();
  const remixTransformPlugin = await getTransformPlugin();
  const remixHmrFix = await getHmrFixPlugin();

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  return createServer({
    server: { middlewareMode: true, cors: true },
    plugins: [
      tsconfigPaths(),
      remixInject,
      remixPlugin,
      remixTransformPlugin,
      vitePluginReact(),
      remixHmrFix,
    ],
    appType: 'custom',
  });
};
