import { getRoutesByFile } from '../utils/general';
import type { Plugin } from 'vite';

export const getInjectPlugin = async (): Promise<Plugin> => {
  const routesByFile = await getRoutesByFile();

  return {
    name: 'vite-plugin-remix-inject',
    enforce: 'pre',

    transform(code, id) {
      const route = routesByFile.get(id);

      if (!route) return;

      if (route.id === 'root') {
        return patchRoot(code);
      }
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
