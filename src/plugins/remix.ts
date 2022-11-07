/* eslint-disable @typescript-eslint/no-explicit-any */

import jsesc from 'jsesc';
import {
  createVirtualModule,
  getAppDirName,
  getRemixConfig,
  getRemixRouteModuleExports,
  getVirtualModuleUrl,
  resolveFSPath,
  resolveRelativeRouteFilePath,
} from '../utils/general';
import {
  BROWSER_ASSETS_MANIFEST_ID,
  SERVER_ASSETS_MANIFEST_ID,
  SERVER_ENTRY_ID,
} from '../constants';
import type { RemixConfig } from '@remix-run/dev/dist/config';
import type { Plugin } from 'vite';

export const getRemixPlugin = async (): Promise<Plugin> => {
  const config = await getRemixConfig();
  const manifest = await getAssetManifest(config);
  const serverEntryJs = getServerEntry(config);

  const serverEntryVirtualModule = createVirtualModule(
    SERVER_ENTRY_ID,
    serverEntryJs,
  );
  const serverManifestVirtualModule = createVirtualModule(
    SERVER_ASSETS_MANIFEST_ID,
    `export default ${jsesc(manifest, { es6: true })};`,
  );
  const browserManifestVirtualModule = createVirtualModule(
    BROWSER_ASSETS_MANIFEST_ID,
    `window.__remixManifest=${jsesc(manifest, { es6: true })};`,
  );

  const virtualModules = [
    serverEntryVirtualModule,
    serverManifestVirtualModule,
    browserManifestVirtualModule,
  ];

  return {
    name: 'vite-plugin-remix',
    enforce: 'pre',
    resolveId(id) {
      for (const virtualModule of virtualModules) {
        if (id === virtualModule.virtualModuleId) {
          return virtualModule.resolvedVirtualModuleId;
        }
      }
    },
    load(id) {
      for (const virtualModule of virtualModules) {
        if (id === virtualModule.resolvedVirtualModuleId) {
          return virtualModule.code;
        }
      }
    },
  };
};

const getServerEntry = (config: RemixConfig) => {
  const appDirName = getAppDirName(config);

  return `
  import * as entryServer from ${JSON.stringify(
    `./${appDirName}/${config.entryServerFile}`,
  )};
  ${Object.keys(config.routes)
    .map((key, index) => {
      const route = config.routes[key]!;
      return `import * as route${index} from ${JSON.stringify(
        resolveFSPath(resolveRelativeRouteFilePath(route, config)),
      )};`;
    })
    .join('\n')}
    export { default as assets } from ${JSON.stringify(
      'virtual:server-assets-manifest',
    )};
    export const assetsBuildDirectory = ${JSON.stringify(
      config.relativeAssetsBuildDirectory,
    )};
    export const publicPath = ${JSON.stringify(config.publicPath)};
    export const entry = { module: entryServer };
    export const routes = {
      ${Object.keys(config.routes)
        .map((key, index) => {
          const route = config.routes[key]!;
          return `${JSON.stringify(key)}: {
        id: ${JSON.stringify(route.id)},
        parentId: ${JSON.stringify(route.parentId)},
        path: ${JSON.stringify(route.path)},
        index: ${JSON.stringify(route.index)},
        caseSensitive: ${JSON.stringify(route.caseSensitive)},
        module: route${index}
      }`;
        })
        .join(',\n  ')}
    };`;
};

const getAssetManifest = async (config: RemixConfig) => {
  const routes: Record<string, any> = {};
  const appDirName = getAppDirName(config);

  for (const entry of Object.entries(config.routes)) {
    const [key, route] = entry;
    const sourceExports = await getRemixRouteModuleExports(route.id);

    routes[key] = {
      id: route.id,
      parentId: route.parentId,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive,
      module: resolveFSPath(resolveRelativeRouteFilePath(route, config)),
      hasAction: sourceExports.includes('action'),
      hasLoader: sourceExports.includes('loader'),
      hasCatchBoundary: sourceExports.includes('CatchBoundary'),
      hasErrorBoundary: sourceExports.includes('ErrorBoundary'),
      imports: [],
    };
  }

  return {
    url: getVirtualModuleUrl(BROWSER_ASSETS_MANIFEST_ID),
    version: Math.random(),
    entry: {
      module: `/${appDirName}/${config.entryClientFile}`,
      imports: [],
    },
    routes,
  };
};
