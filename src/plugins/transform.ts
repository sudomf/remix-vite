import {
  getRemixRouteModuleExports,
  getRouteByFilePath,
} from '../utils/general';
import { filterExports } from '../utils/code';
import type { Plugin } from 'vite';

const BACKEND_ONLY_EXPORTS = ['loader', 'action'];

export const getTransformPlugin = (): Plugin => {
  return {
    name: 'vite-plugin-remix-transform',
    enforce: 'pre',

    async transform(code, id, options) {
      // If it's SSR code, let's bypass it.
      if (options?.ssr) return;

      // If it's .server.<ext>, let's bypass it.
      if (id.includes('.server.')) return 'export default {}';

      const route = await getRouteByFilePath(id);

      if (!route) return;

      const theExports = await getRemixRouteModuleExports(route.id);

      // If it's a route with no default component export, let's bypass it.
      if (!theExports.includes('default')) return;

      const frontendExports = theExports.filter(
        (e) => !BACKEND_ONLY_EXPORTS.includes(e),
      );

      if (!frontendExports.length) return code;

      const filtered = filterExports(id, code, frontendExports);
      const result = filtered.code;

      return {
        code: result,
        map: null,
      };
    },
  };
};
