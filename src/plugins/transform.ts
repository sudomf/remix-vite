import { getRemixRouteModuleExports, getRoutesByFile } from '../utils/general';
import { filterExports } from '../utils/code';
import type { Plugin } from 'vite';

export const getTransformPlugin = async (): Promise<Plugin> => {
  const routesByFile = await getRoutesByFile();

  return {
    name: 'vite-plugin-remix-transform',
    enforce: 'pre',

    async transform(code, id, options) {
      const route = routesByFile.get(id);

      // If it's SSR code, let's bypass it.
      if (options?.ssr) return;

      // If it's .server.<ext>, let's bypass it.
      if (id.includes('.server.')) return 'export default {}';

      if (!route) return;

      const theExports = await getRemixRouteModuleExports(route.id);

      // If it's a route with no default component export, let's bypass it.
      if (!theExports.includes('default')) return;

      const frontendExports = theExports.filter(
        (e) => browserSafeRouteExports[e],
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

const browserSafeRouteExports: Record<string, boolean> = {
  CatchBoundary: true,
  ErrorBoundary: true,
  default: true,
  handle: true,
  links: true,
  meta: true,
  unstable_shouldReload: true,
};
