import path from 'path';
import { getAppDirName, getRemixConfig } from '../utils/general';
import type { RemixConfig } from '@remix-run/dev/dist/config';
import type { Plugin } from 'vite';

type Route = RemixConfig['routes'][string];

export const getInjectPlugin = async (): Promise<Plugin> => {
  const config = await getRemixConfig();
  const appDir = getAppDirName(config);

  const resolveRouteFile = (route: Route) =>
    path.join(process.cwd(), appDir, route.file);

  const routesByFile: Map<string, Route> = Object.keys(config.routes).reduce(
    (map, key) => {
      const route = config.routes[key]!;
      const file = resolveRouteFile(route);
      map.set(file, route);
      return map;
    },
    new Map<string, Route>(),
  );

  return {
    name: 'vite-plugin-remix-inject',
    enforce: 'pre',

    transform(source, id) {
      let code = source;

      const route = routesByFile.get(id);

      if (!route) return code;

      if (route.id === 'root') {
        code = patchRoot(code);
      }

      return code;
    },
  };
};

const patchRoot = (code: string) => {
  return code
    .replace(/<LiveReload.*?\/>/, '')
    .replace(/<Scripts.*\/>/, viteScripts);
};

const viteScripts = `
<script type="module" src="/@vite/client" />
<script
  type="module"
  dangerouslySetInnerHTML={{
    __html: \`import RefreshRuntime from '/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true\`,
  }}
/>
<Scripts />
`;
