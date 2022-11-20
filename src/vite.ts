import { createServer, mergeConfig } from 'vite';
import vitePluginReact from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getHmrFixPlugin } from './plugins/hmr-fix';
import { getInjectPlugin } from './plugins/inject';
import { getRemixPlugin } from './plugins/remix';
import { getTransformPlugin } from './plugins/transform';
import { SERVER_ENTRY_ID } from './constants';
import { checkVersion } from './utils/version';
import type { ViteDevServer, UserConfig } from 'vite';
import type { ServerBuild } from '@remix-run/server-runtime';

/**
 * Get Remix build
 */
export const getRemixViteBuild = async (viteDevServer: ViteDevServer) => {
  const build = await viteDevServer.ssrLoadModule(`virtual:${SERVER_ENTRY_ID}`);

  return build as ServerBuild;
};

/**
 * Create remix-vite dev server
 */
export const createRemixViteDevServer = async (config?: UserConfig) => {
  await checkVersion();

  const remixPlugin = await getRemixPlugin();
  const remixInject = getInjectPlugin();
  const remixTransformPlugin = getTransformPlugin();
  const remixHmrFix = getHmrFixPlugin();

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  return createServer(
    mergeConfig(
      {
        server: {
          fs: {
            strict: false,
          },
          cors: true,
          middlewareMode: true,
        },
        plugins: [
          tsconfigPaths(),
          remixInject,
          remixPlugin,
          remixTransformPlugin,
          vitePluginReact(),
          remixHmrFix,
        ],
        appType: 'custom',
      } as UserConfig,
      config || {},
    ),
  );
};
