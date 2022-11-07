import { getRoutesByFile } from '../utils/general';
import { fixHmrCode } from '../utils/code';
import type { Plugin } from 'vite';

export const getHmrFixPlugin = async (): Promise<Plugin> => {
  const routesByFile = await getRoutesByFile();

  return {
    name: 'remix-plugin-hmr-fix',
    enforce: 'post',
    transform(code, id) {
      const route = routesByFile.get(id);

      if (
        route &&
        id.endsWith('.tsx') &&
        code.includes('if (import.meta.hot) {') &&
        code.includes('window.$RefreshReg$ = prevRefreshReg;')
      ) {
        return fixHmrCode(id, code);
      }
    },
  };
};
