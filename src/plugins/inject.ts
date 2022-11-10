import { getRouteByFilePath } from '../utils/general';
import type { Plugin } from 'vite';

export const getInjectPlugin = (): Plugin => {
  return {
    name: 'vite-plugin-remix-inject',
    enforce: 'pre',

    async transform(code, id) {
      const route = await getRouteByFilePath(id);

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
