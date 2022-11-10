import { getRouteByFilePath } from '../utils/general';
import { fixHmrCode } from '../utils/code';
import type { Plugin } from 'vite';

export const getHmrFixPlugin = (): Plugin => {
  return {
    name: 'remix-plugin-hmr-fix',
    enforce: 'post',
    async transform(code, id) {
      const route = await getRouteByFilePath(id);

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
