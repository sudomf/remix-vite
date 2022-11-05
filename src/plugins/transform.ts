import path from 'path';
import { getRouteModuleExports } from '@remix-run/dev/dist/compiler/routeExports';
import { readConfig } from '@remix-run/dev/dist/config';
import { Project } from 'ts-morph';
import { getAppDirName } from '../utils';
import type { RemixConfig } from '@remix-run/dev/dist/config';
import type { Plugin } from 'vite';

type Route = RemixConfig['routes'][string];

export const getTransformPlugin = async (): Promise<Plugin> => {
  const config = await readConfig();
  const appDir = getAppDirName(config);

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipLoadingLibFiles: true,
    useInMemoryFileSystem: true,
  });

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
    name: 'vite-plugin-remix-sanitize',
    enforce: 'pre',

    async transform(source, id, options) {
      let code = source;

      const route = routesByFile.get(id);

      if (!route) return code;

      if (route.id === 'root') {
        code = patchRoot(code);
      }

      if (options?.ssr) {
        return code;
      }

      const theExports = await getRouteModuleExports(config, route.id);

      const serverExports = theExports.filter(
        (e) => !browserSafeRouteExports[e],
      );

      const frontendExports = theExports.filter(
        (name) => !serverExports.includes(name),
      );

      if (frontendExports.length > 0) {
        const sourceFile = project.createSourceFile(id, code, {
          overwrite: true,
        });

        const exportMap = sourceFile.getExportedDeclarations();

        [...exportMap.keys()].forEach((name) => {
          if (!frontendExports.includes(name)) {
            exportMap.get(name)?.forEach((declaration) => {
              declaration.replaceWithText('');
            });
          }
        });

        const sanitizedCode = sourceFile.getFullText();

        return sanitizedCode;
      }

      return code;
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
